// Fixed UUIDs for the 9 demo catalogue shows.
//
// The real `shows` table was empty during wiring, so the mocked Feed cards
// (lib/mockFeed.ts) and Fiche Spectacle reviews (lib/mockShows.ts) had no real
// ids to point at — tapping a card hit "Spectacle introuvable". These stable
// ids fix that: they MUST stay in sync with `scripts/seed-catalogue.sql`,
// which inserts exactly these rows into `shows` / `show_venues`. Once that
// seed SQL has been run against the real database, every mocked reference here
// resolves to a real row.
//
// This whole file (and the two mock files that import it) is throwaway demo
// scaffolding — delete it once the catalogue is populated for real and the
// Feed/reviews are sourced from live queries.
export const DEMO_SHOW_IDS = {
  malade: '835a4a88-5998-4d56-81c9-765302a624fb', // Le Malade imaginaire
  cyrano: 'ab0248cc-ee9c-4954-9b75-5ae0a79a32a6', // Cyrano de Bergerac
  godot: '48d0be2a-4bad-48dc-ab06-48ece15370e4', // En attendant Godot
  cantatrice: '36545100-9590-4f60-8913-91ffc6faf53d', // La Cantatrice chauve
  romeo: '1cf77c46-4018-4b6d-9411-a5d82dc065c6', // Roméo et Juliette
  huisClos: '4434a701-65dd-480b-98c2-ce88eb1e8e04', // Huis clos
  standup: '6e69ad97-93b3-4d8f-b866-f68c20871476', // Un stand-up presque parfait
  diner: '57affd75-cc51-4129-9154-97aaf547b8ab', // Le Dîner de cons
  domJuan: 'c4373d1a-a94c-495d-a581-68159f2ca637', // Dom Juan
} as const;
