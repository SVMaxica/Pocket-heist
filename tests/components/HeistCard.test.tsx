import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import type { Heist } from "@/types/firestore";

import HeistCard from "@/components/HeistCard";

function makeHeist(overrides: Partial<Heist> = {}): Heist {
  return {
    id: "h1",
    title: "Swap the keyboard keys",
    description: "Rearrange every key alphabetically.",
    createdBy: "u1",
    createdByCodename: "@Mastermind",
    assignedTo: "u2",
    assignedToCodename: "@NightOwl",
    createdAt: new Date(),
    deadline: new Date(Date.now() + 5 * 60 * 60 * 1000),
    finalStatus: null,
    ...overrides,
  };
}

describe("HeistCard", () => {
  it("renders the title, assignee and creator codenames", () => {
    render(<HeistCard heist={makeHeist()} />);

    expect(
      screen.getByRole("heading", { name: "Swap the keyboard keys" }),
    ).toBeInTheDocument();
    expect(screen.getByText("@NightOwl")).toBeInTheDocument();
    expect(screen.getByText("@Mastermind")).toBeInTheDocument();
  });

  it("links the title to the heist detail page", () => {
    render(<HeistCard heist={makeHeist({ id: "abc123" })} />);

    const link = screen.getByRole("link", { name: /swap the keyboard keys/i });
    expect(link).toHaveAttribute("href", "/heists/abc123");
  });

  it("shows Overdue when the deadline has passed", () => {
    const deadline = new Date(Date.now() - 60 * 60 * 1000);
    render(<HeistCard heist={makeHeist({ deadline })} />);

    expect(screen.getByText("Overdue")).toBeInTheDocument();
  });

  it("shows the remaining time when the deadline is in the future", () => {
    const deadline = new Date(Date.now() + (4 * 60 + 42) * 60 * 1000);
    render(<HeistCard heist={makeHeist({ deadline })} />);

    expect(screen.getByText(/^\d+h \d+m$/)).toBeInTheDocument();
  });

  it("falls back to placeholder codenames when they are missing", () => {
    render(
      <HeistCard
        heist={makeHeist({ assignedToCodename: "", createdByCodename: "" })}
      />,
    );

    expect(screen.getByText("Unassigned")).toBeInTheDocument();
    expect(screen.getByText("Unknown")).toBeInTheDocument();
  });

  it("exposes only the title as an interactive element (icons are decorative)", () => {
    render(<HeistCard heist={makeHeist()} />);

    expect(screen.getAllByRole("link")).toHaveLength(1);
  });

  it("shows a Success badge when an overdue heist finished successfully", () => {
    const deadline = new Date(Date.now() - 60 * 60 * 1000);
    render(
      <HeistCard heist={makeHeist({ deadline, finalStatus: "success" })} />,
    );

    expect(screen.getByText("Success")).toBeInTheDocument();
    expect(screen.queryByText("Expired")).not.toBeInTheDocument();
  });

  it("shows an Expired badge when an overdue heist was never completed", () => {
    const deadline = new Date(Date.now() - 60 * 60 * 1000);
    render(<HeistCard heist={makeHeist({ deadline, finalStatus: null })} />);

    expect(screen.getByText("Expired")).toBeInTheDocument();
  });

  it("shows an Expired badge when an overdue heist failed", () => {
    const deadline = new Date(Date.now() - 60 * 60 * 1000);
    render(
      <HeistCard heist={makeHeist({ deadline, finalStatus: "failure" })} />,
    );

    expect(screen.getByText("Expired")).toBeInTheDocument();
  });

  it("shows no result badge when the deadline hasn't passed", () => {
    const deadline = new Date(Date.now() + 60 * 60 * 1000);
    render(<HeistCard heist={makeHeist({ deadline })} />);

    expect(screen.queryByText("Success")).not.toBeInTheDocument();
    expect(screen.queryByText("Expired")).not.toBeInTheDocument();
  });
});
