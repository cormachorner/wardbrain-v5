export function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getSearchTokens(input: string): string[] {
  return normalizeText(input)
    .split(" ")
    .filter((token) => token.length > 1);
}
