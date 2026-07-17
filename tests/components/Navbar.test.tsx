import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, afterEach } from "vitest";

const mockSignOut = vi.fn();
const mockPush = vi.fn();

vi.mock("@/lib/firebase", () => ({ auth: {} }));

vi.mock("firebase/auth", () => ({
  signOut: (...args: unknown[]) => mockSignOut(...args),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// komponentimporter
import Navbar from "@/components/Navbar";

describe("Navbar", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    mockSignOut.mockReset();
    mockPush.mockReset();
  });

  it("renders the main heading", () => {
    render(<Navbar />);

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toBeInTheDocument();
  });

  it("renders the Create Heist link", () => {
    render(<Navbar />);

    const createLink = screen.getByRole("link", { name: /create heist/i });
    expect(createLink).toBeInTheDocument();
    expect(createLink).toHaveAttribute("href", "/heists/create");
  });

  it("signs the user out and redirects to /login when Logout is clicked", async () => {
    mockSignOut.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<Navbar />);

    await user.click(screen.getByRole("button", { name: /logout/i }));

    await waitFor(() => expect(mockSignOut).toHaveBeenCalledWith({}));
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/login"));
  });
});
