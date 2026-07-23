import { describe, it, expect } from "vitest";
import { generateCodenameSuggestions } from "@/lib/codenameSuggestions";

describe("generateCodenameSuggestions", () => {
  it("returns the requested number of suggestions", () => {
    const suggestions = generateCodenameSuggestions(4);

    expect(suggestions).toHaveLength(4);
  });

  it("returns suggestions matching the @AdjectiveNoun format", () => {
    const suggestions = generateCodenameSuggestions(6);

    for (const suggestion of suggestions) {
      expect(suggestion).toMatch(/^@[A-Za-z]+$/);
    }
  });

  it("never returns duplicate suggestions in a single call", () => {
    const suggestions = generateCodenameSuggestions(10);

    expect(new Set(suggestions).size).toBe(suggestions.length);
  });

  it("is deterministic given the same injected random function", () => {
    function makeSteppingRandom() {
      let i = 0;
      const values = [0.1, 0.9, 0.2, 0.8, 0.3, 0.7, 0.4, 0.6];
      return () => values[i++ % values.length];
    }

    const first = generateCodenameSuggestions(4, makeSteppingRandom());
    const second = generateCodenameSuggestions(4, makeSteppingRandom());

    expect(first).toEqual(second);
  });
});
