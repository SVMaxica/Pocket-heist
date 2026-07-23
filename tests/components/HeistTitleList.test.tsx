import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";

const mockUseHeists = vi.fn();

vi.mock("@/lib/useHeists", () => ({
  useHeists: (...args: unknown[]) => mockUseHeists(...args),
}));

import HeistTitleList from "@/components/HeistTitleList";

describe("HeistTitleList", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    mockUseHeists.mockReset();
  });

  it("shows a loading spinner while the heists are loading", () => {
    mockUseHeists.mockReturnValue({
      status: "loading",
      heists: null,
      error: null,
    });

    render(<HeistTitleList mode="active" />);

    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("shows an error message when loading fails", () => {
    mockUseHeists.mockReturnValue({
      status: "error",
      heists: null,
      error: new Error("boom"),
    });

    render(<HeistTitleList mode="active" />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      /could not load heists/i,
    );
  });

  it("shows an empty-state message when there are no heists", () => {
    mockUseHeists.mockReturnValue({
      status: "ready",
      heists: [],
      error: null,
    });

    render(<HeistTitleList mode="active" />);

    expect(screen.getByText(/no heists here yet/i)).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("renders the heist titles in the given order", () => {
    mockUseHeists.mockReturnValue({
      status: "ready",
      heists: [
        { id: "1", title: "Swap the keyboard keys" },
        { id: "2", title: "Hide a rubber duck" },
      ],
      error: null,
    });

    render(<HeistTitleList mode="active" />);

    const items = screen.getAllByRole("listitem");
    expect(items.map((item) => item.textContent)).toEqual([
      "Swap the keyboard keys",
      "Hide a rubber duck",
    ]);
  });

  it("passes the mode prop through to useHeists", () => {
    mockUseHeists.mockReturnValue({
      status: "ready",
      heists: [],
      error: null,
    });

    render(<HeistTitleList mode="expired" />);

    expect(mockUseHeists).toHaveBeenCalledWith("expired");
  });
});
