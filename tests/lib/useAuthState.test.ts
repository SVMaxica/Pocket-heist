import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import type { User } from "firebase/auth";

const mockOnAuthStateChanged = vi.fn();
const mockUnsubscribe = vi.fn();

vi.mock("@/lib/firebase", () => ({ auth: {} }));

vi.mock("firebase/auth", () => ({
  onAuthStateChanged: (...args: unknown[]) => mockOnAuthStateChanged(...args),
}));

import { useAuthState } from "@/lib/useAuthState";

type Callbacks = {
  onNext: (user: User | null) => void;
  onError: (error: Error) => void;
};

function getAuthCallbacks(): Callbacks {
  const call = mockOnAuthStateChanged.mock.calls[0];
  return { onNext: call[1], onError: call[2] };
}

const fakeUser = { uid: "abc123" } as User;

describe("useAuthState", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    mockOnAuthStateChanged.mockReset();
    mockUnsubscribe.mockReset();
  });

  it("starts in the loading state", () => {
    mockOnAuthStateChanged.mockReturnValue(mockUnsubscribe);
    const { result } = renderHook(() => useAuthState());

    expect(result.current).toEqual({
      status: "loading",
      user: null,
      error: null,
    });
  });

  it("transitions to authenticated with the user when a session exists", () => {
    mockOnAuthStateChanged.mockReturnValue(mockUnsubscribe);
    const { result } = renderHook(() => useAuthState());

    act(() => getAuthCallbacks().onNext(fakeUser));

    expect(result.current).toEqual({
      status: "authenticated",
      user: fakeUser,
      error: null,
    });
  });

  it("transitions to unauthenticated when there is no session", () => {
    mockOnAuthStateChanged.mockReturnValue(mockUnsubscribe);
    const { result } = renderHook(() => useAuthState());

    act(() => getAuthCallbacks().onNext(null));

    expect(result.current).toEqual({
      status: "unauthenticated",
      user: null,
      error: null,
    });
  });

  it("transitions to the error state when the auth listener errors", () => {
    mockOnAuthStateChanged.mockReturnValue(mockUnsubscribe);
    const error = new Error("network");
    const { result } = renderHook(() => useAuthState());

    act(() => getAuthCallbacks().onError(error));

    expect(result.current).toEqual({
      status: "error",
      user: null,
      error,
    });
  });

  it("unsubscribes from the auth listener on unmount", () => {
    mockOnAuthStateChanged.mockReturnValue(mockUnsubscribe);
    const { unmount } = renderHook(() => useAuthState());

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalled();
  });
});
