import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

import HeistCardSkeleton from "@/components/HeistCardSkeleton";

describe("HeistCardSkeleton", () => {
  it("renders a loading placeholder without any heist data", () => {
    render(<HeistCardSkeleton />);

    expect(
      screen.getByRole("status", { name: /loading heist/i }),
    ).toBeInTheDocument();
  });
});
