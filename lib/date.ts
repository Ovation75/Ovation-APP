// Date formatting helpers. Kept mock-friendly: logs store a pre-formatted
// French date string plus a numeric sortKey for ordering.

const MONTHS_FR = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre',
];

// e.g. new Date('2026-07-02') -> "2 juillet 2026"
export function formatDateFr(date: Date): string {
  return `${date.getDate()} ${MONTHS_FR[date.getMonth()]} ${date.getFullYear()}`;
}
