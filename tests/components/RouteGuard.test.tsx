import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import type { User } from "firebase/auth";

const mockOnAuthStateChanged = vi.fn();
const mockReplace = vi.fn();
const mockUnsubscribe = vi.fn();

vi.mock("@/lib/firebase", () => ({ auth: {} }));

vi.mock("firebase/auth", () => ({
  onAuthStateChanged: (...args: unknown[]) => mockOnAuthStateChanged(...args),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace, push: mockReplace }),
}));

// komponentimporter
import RouteGuard from "@/components/RouteGuard";

// Fångar de callbacks som RouteGuard (via useAuthState) skickar till
// onAuthStateChanged, så vi kan driva fram auth-status manuellt.
type Callbacks = {
  onNext: (user: User | null) => void;
  onError: (error: Error) => void;
};

function getAuthCallbacks(): Callbacks {
  const call = mockOnAuthStateChanged.mock.calls[0];
  return { onNext: call[1], onError: call[2] };
}

const fakeUser = { uid: "abc123" } as User;

describe("RouteGuard", () => {
  beforeEach(() => {
    mockOnAuthStateChanged.mockReturnValue(mockUnsubscribe);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    mockOnAuthStateChanged.mockReset();
    mockReplace.mockReset();
    mockUnsubscribe.mockReset();
  });

  it("shows the loader and not the children while auth state is still loading", () => {
    render(
      <RouteGuard mode="require-authenticated" redirectTo="/login">
        <div>protected content</div>
      </RouteGuard>,
    );

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByText("protected content")).not.toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("redirects to the login page and never renders children for a logged-out user on a protected route", () => {
    render(
      <RouteGuard mode="require-authenticated" redirectTo="/login">
        <div>protected content</div>
      </RouteGuard>,
    );

    act(() => getAuthCallbacks().onNext(null));

    expect(mockReplace).toHaveBeenCalledWith("/login");
    expect(screen.queryByText("protected content")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("renders children without redirecting for a logged-in user on a protected route", () => {
    render(
      <RouteGuard mode="require-authenticated" redirectTo="/login">
        <div>protected content</div>
      </RouteGuard>,
    );

    act(() => getAuthCallbacks().onNext(fakeUser));

    expect(screen.getByText("protected content")).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("redirects to the dashboard and never renders children for a logged-in user on a public route", () => {
    render(
      <RouteGuard mode="require-unauthenticated" redirectTo="/heists">
        <div>public content</div>
      </RouteGuard>,
    );

    act(() => getAuthCallbacks().onNext(fakeUser));

    expect(mockReplace).toHaveBeenCalledWith("/heists");
    expect(screen.queryByText("public content")).not.toBeInTheDocument();
  });

  it("renders children without redirecting for a logged-out user on a public route", () => {
    render(
      <RouteGuard mode="require-unauthenticated" redirectTo="/heists">
        <div>public content</div>
      </RouteGuard>,
    );

    act(() => getAuthCallbacks().onNext(null));

    expect(screen.getByText("public content")).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("shows an error message and does not redirect when the auth check fails", () => {
    render(
      <RouteGuard mode="require-authenticated" redirectTo="/login">
        <div>protected content</div>
      </RouteGuard>,
    );

    act(() => getAuthCallbacks().onError(new Error("network")));

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
    expect(screen.queryByText("protected content")).not.toBeInTheDocument();
  });
});
