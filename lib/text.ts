// Text helpers shared across search / filtering.

// Normalize a string for accent- and case-insensitive comparison:
// decompose accented characters (NFD), strip the combining diacritics
// (U+0300-U+036F), lowercase, and trim.
// e.g. "Molière" / "MOLIÈRE" / "Moliere" all normalize to "moliere".
export function normalizeText(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}
