import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import type { Heist } from "@/types/firestore";

const mockUseHeists = vi.fn();

vi.mock("@/lib/useHeists", () => ({
  useHeists: (...args: unknown[]) => mockUseHeists(...args),
}));

import HeistCardList from "@/components/HeistCardList";

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
    deadline: new Date(Date.now() - 60 * 60 * 1000),
    finalStatus: null,
  };
}

describe("HeistCardList", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    mockUseHeists.mockReset();
  });

  it("calls useHeists with the expired mode", () => {
    mockUseHeists.mockReturnValue({
      status: "ready",
      heists: [],
      error: null,
    });

    render(<HeistCardList />);

    expect(mockUseHeists).toHaveBeenCalledWith("expired");
  });

  it("shows a column of skeleton cards while loading", () => {
    mockUseHeists.mockReturnValue({
      status: "loading",
      heists: null,
      error: null,
    });

    render(<HeistCardList />);

    expect(screen.getAllByRole("status")).toHaveLength(3);
  });

  it("shows an error message when loading fails", () => {
    mockUseHeists.mockReturnValue({
      status: "error",
      heists: null,
      error: new Error("boom"),
    });

    render(<HeistCardList />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      /could not load heists/i,
    );
  });

  it("shows an expired-specific empty-state message when there are no heists", () => {
    mockUseHeists.mockReturnValue({
      status: "ready",
      heists: [],
      error: null,
    });

    render(<HeistCardList />);

    expect(screen.getByText(/no expired heists yet/i)).toBeInTheDocument();
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

    render(<HeistCardList />);

    const links = screen.getAllByRole("link");
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "/heists/1",
      "/heists/2",
    ]);
  });
});
