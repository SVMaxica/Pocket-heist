import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import type { Heist } from "@/types/firestore";

const mockUseAuthState = vi.fn();
const mockCollection = vi.fn();
const mockQuery = vi.fn();
const mockWhere = vi.fn();
const mockOnSnapshot = vi.fn();
const mockUnsubscribe = vi.fn();

vi.mock("@/lib/firebase", () => ({ db: {} }));

vi.mock("@/lib/useAuthState", () => ({
  useAuthState: () => mockUseAuthState(),
}));

vi.mock("firebase/firestore", () => ({
  collection: (...args: unknown[]) => mockCollection(...args),
  query: (...args: unknown[]) => mockQuery(...args),
  where: (...args: unknown[]) => mockWhere(...args),
  onSnapshot: (...args: unknown[]) => mockOnSnapshot(...args),
}));

import { useHeists } from "@/lib/useHeists";

const AUTHENTICATED = {
  status: "authenticated",
  user: { uid: "me" },
  error: null,
};

function getSnapshotCallbacks() {
  const call = mockOnSnapshot.mock.calls[0];
  return { onNext: call[1], onError: call[2] };
}

// Bygger ett fejkat QuerySnapshot vars docs redan är konverterade (deadline och
// createdAt som Date), likt vad heistConverter.fromFirestore returnerar.
function heistSnapshot(heists: Partial<Heist>[]) {
  return { docs: heists.map((h) => ({ data: () => h })) };
}

function makeHeist(overrides: Partial<Heist>): Partial<Heist> {
  return {
    id: "h",
    title: "A heist",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    deadline: new Date(),
    finalStatus: null,
    ...overrides,
  };
}

describe("useHeists", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    mockUseAuthState.mockReset();
    mockCollection.mockReset();
    mockQuery.mockReset();
    mockWhere.mockReset();
    mockOnSnapshot.mockReset();
    mockUnsubscribe.mockReset();
  });

  function primeFirestore() {
    mockCollection.mockReturnValue({ withConverter: () => ({}) });
    mockQuery.mockReturnValue({});
    mockOnSnapshot.mockReturnValue(mockUnsubscribe);
  }

  it("stays in loading and does not subscribe while auth is not yet known", () => {
    mockUseAuthState.mockReturnValue({
      status: "loading",
      user: null,
      error: null,
    });
    primeFirestore();

    const { result } = renderHook(() => useHeists("active"));

    expect(result.current).toEqual({
      status: "loading",
      heists: null,
      error: null,
    });
    expect(mockOnSnapshot).not.toHaveBeenCalled();
  });

  it("filters on assignedTo for the active mode", () => {
    mockUseAuthState.mockReturnValue(AUTHENTICATED);
    primeFirestore();

    renderHook(() => useHeists("active"));

    expect(mockWhere).toHaveBeenCalledWith("assignedTo", "==", "me");
  });

  it("filters on createdBy for the assigned mode", () => {
    mockUseAuthState.mockReturnValue(AUTHENTICATED);
    primeFirestore();

    renderHook(() => useHeists("assigned"));

    expect(mockWhere).toHaveBeenCalledWith("createdBy", "==", "me");
  });

  it("does not apply a where filter for the expired mode", () => {
    mockUseAuthState.mockReturnValue(AUTHENTICATED);
    primeFirestore();

    renderHook(() => useHeists("expired"));

    expect(mockWhere).not.toHaveBeenCalled();
  });

  it("returns only heists whose deadline has not passed for the active mode", () => {
    mockUseAuthState.mockReturnValue(AUTHENTICATED);
    primeFirestore();

    const { result } = renderHook(() => useHeists("active"));

    const future = new Date(Date.now() + 60_000);
    const past = new Date(Date.now() - 60_000);
    act(() =>
      getSnapshotCallbacks().onNext(
        heistSnapshot([
          makeHeist({ id: "future", title: "Future", deadline: future }),
          makeHeist({ id: "past", title: "Past", deadline: past }),
        ]),
      ),
    );

    expect(result.current.status).toBe("ready");
    expect(result.current.heists?.map((h) => h.id)).toEqual(["future"]);
  });

  it("returns past-deadline heists for the expired mode, including ones with a null finalStatus", () => {
    mockUseAuthState.mockReturnValue(AUTHENTICATED);
    primeFirestore();

    const { result } = renderHook(() => useHeists("expired"));

    const future = new Date(Date.now() + 60_000);
    const past = new Date(Date.now() - 60_000);
    act(() =>
      getSnapshotCallbacks().onNext(
        heistSnapshot([
          makeHeist({ id: "future", deadline: future, finalStatus: "success" }),
          makeHeist({ id: "past-open", deadline: past, finalStatus: null }),
          makeHeist({
            id: "past-done",
            deadline: past,
            finalStatus: "failure",
          }),
        ]),
      ),
    );

    expect(result.current.heists?.map((h) => h.id)).toEqual([
      "past-open",
      "past-done",
    ]);
  });

  it("sorts heists newest createdAt first", () => {
    mockUseAuthState.mockReturnValue(AUTHENTICATED);
    primeFirestore();

    const { result } = renderHook(() => useHeists("active"));

    const future = new Date(Date.now() + 60_000);
    act(() =>
      getSnapshotCallbacks().onNext(
        heistSnapshot([
          makeHeist({
            id: "older",
            deadline: future,
            createdAt: new Date("2026-01-01T00:00:00.000Z"),
          }),
          makeHeist({
            id: "newer",
            deadline: future,
            createdAt: new Date("2026-02-01T00:00:00.000Z"),
          }),
        ]),
      ),
    );

    expect(result.current.heists?.map((h) => h.id)).toEqual(["newer", "older"]);
  });

  it("updates the returned heists when a new snapshot is delivered", () => {
    mockUseAuthState.mockReturnValue(AUTHENTICATED);
    primeFirestore();

    const { result } = renderHook(() => useHeists("active"));
    const future = new Date(Date.now() + 60_000);

    act(() =>
      getSnapshotCallbacks().onNext(
        heistSnapshot([makeHeist({ id: "first", deadline: future })]),
      ),
    );
    expect(result.current.heists?.map((h) => h.id)).toEqual(["first"]);

    act(() =>
      getSnapshotCallbacks().onNext(
        heistSnapshot([
          makeHeist({ id: "first", deadline: future }),
          makeHeist({
            id: "second",
            deadline: future,
            createdAt: new Date("2026-03-01T00:00:00.000Z"),
          }),
        ]),
      ),
    );
    expect(result.current.heists?.map((h) => h.id)).toEqual([
      "second",
      "first",
    ]);
  });

  it("transitions to the error state when the listener errors", () => {
    mockUseAuthState.mockReturnValue(AUTHENTICATED);
    primeFirestore();

    const { result } = renderHook(() => useHeists("active"));
    const error = new Error("permission-denied");

    act(() => getSnapshotCallbacks().onError(error));

    expect(result.current).toEqual({
      status: "error",
      heists: null,
      error,
    });
  });

  it("unsubscribes from the listener on unmount", () => {
    mockUseAuthState.mockReturnValue(AUTHENTICATED);
    primeFirestore();

    const { unmount } = renderHook(() => useHeists("active"));
    unmount();

    expect(mockUnsubscribe).toHaveBeenCalled();
  });
});
