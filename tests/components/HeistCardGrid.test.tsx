import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import type { Heist } from "@/types/firestore";

const mockUseHeists = vi.fn();

vi.mock("@/lib/useHeists", () => ({
  useHeists: (...args: unknown[]) => mockUseHeists(...args),
}));

import HeistCardGrid from "@/components/HeistCardGrid";

function makeHeist(id: string, title: string): Heist {
  return {
    id,
    title,
    description: "",
    createdBy: "u1",
    createdByCodename: "Mastermind",
    assignedTo: "u2",
    assignedToCodename: "NightOwl",
    createdAt: new Date(),
    deadline: new Date(Date.now() + 60 * 60 * 1000),
    finalStatus: null,
  };
}

describe("HeistCardGrid", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    mockUseHeists.mockReset();
  });

  it("shows a row of skeleton cards while loading", () => {
    mockUseHeists.mockReturnValue({
      status: "loading",
      heists: null,
      error: null,
    });

    render(<HeistCardGrid mode="active" />);

    expect(screen.getAllByRole("status")).toHaveLength(3);
  });

  it("shows an error message when loading fails", () => {
    mockUseHeists.mockReturnValue({
      status: "error",
      heists: null,
      error: new Error("boom"),
    });

    render(<HeistCardGrid mode="active" />);

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

    render(<HeistCardGrid mode="active" />);

    expect(screen.getByText(/no heists here yet/i)).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("renders a card per heist with links in order", () => {
    mockUseHeists.mockReturnValue({
      status: "ready",
      heists: [
        makeHeist("1", "Swap the keyboard keys"),
        makeHeist("2", "Hide a rubber duck"),
      ],
      error: null,
    });

    render(<HeistCardGrid mode="active" />);

    const links = screen.getAllByRole("link");
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "/heists/1",
      "/heists/2",
    ]);
  });

  it("passes the mode prop through to useHeists", () => {
    mockUseHeists.mockReturnValue({
      status: "ready",
      heists: [],
      error: null,
    });

    render(<HeistCardGrid mode="assigned" />);

    expect(mockUseHeists).toHaveBeenCalledWith("assigned");
  });
});
