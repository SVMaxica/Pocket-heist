const ADJECTIVES = [
  "Night",
  "Shadow",
  "Midnight",
  "Phantom",
  "Stealthy",
  "Ghost",
  "Dark",
  "Silent",
  "Crimson",
  "Rogue",
] as const;

const NOUNS = [
  "Owl",
  "Panda",
  "Coder",
  "Boss",
  "Agent",
  "Runner",
  "Knight",
  "Fox",
  "Elf",
  "Typist",
] as const;

/**
 * Genererar `count` unika, spiontema-kodnamnsförslag (t.ex. "@ShadowOwl").
 * Tar en injicerbar `random`-funktion så resultatet blir deterministiskt i tester.
 */
export function generateCodenameSuggestions(
  count: number = 4,
  random: () => number = Math.random,
): string[] {
  const maxCombinations = ADJECTIVES.length * NOUNS.length;
  const target = Math.min(count, maxCombinations);

  const suggestions = new Set<string>();
  while (suggestions.size < target) {
    const adjective = ADJECTIVES[Math.floor(random() * ADJECTIVES.length)];
    const noun = NOUNS[Math.floor(random() * NOUNS.length)];
    suggestions.add(`@${adjective}${noun}`);
  }

  return Array.from(suggestions);
}
