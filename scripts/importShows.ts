// Catalogue import script (admin tooling, runs outside the app).
//
// Reads a CSV of shows and emits either SQL INSERT statements or JSON ready
// for a Supabase import, matching the draft schema (specs/04-data-model.md):
//
//   shows(id, title, genre, company, synopsis, status)
//   show_venues(show_id, venue)
//
// CSV columns (header required, order-free): title, genre, company, venues,
// synopsis, status. Multiple venues in one cell are separated by "|".
// Status accepts French labels or slugs: "En ce moment [à Paris]"/now/ongoing,
// "En tournée"/touring, "Terminé"/finished.
//
// Usage (Node ≥ 22 runs TypeScript directly):
//   node scripts/importShows.ts scripts/sample-shows.csv          # SQL
//   node scripts/importShows.ts scripts/sample-shows.csv --json   # JSON
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import process from 'node:process';

type ShowStatus = 'ongoing' | 'touring' | 'finished';

type ShowRow = {
  id: string;
  title: string;
  genre: string;
  company: string;
  synopsis: string;
  status: ShowStatus;
};

type VenueRow = {
  show_id: string;
  venue: string;
};

const KNOWN_GENRES = [
  'Théâtre classique',
  'Contemporain',
  'Comédie',
  'Stand-up',
];

// ---- CSV parsing -----------------------------------------------------------
// Minimal RFC-4180 parser: quoted fields, embedded commas/newlines, "" escapes.
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++; // escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++; // CRLF
      row.push(field);
      field = '';
      if (row.some((f) => f.trim() !== '')) rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  // Trailing field/row without final newline.
  row.push(field);
  if (row.some((f) => f.trim() !== '')) rows.push(row);
  return rows;
}

// ---- Normalization ---------------------------------------------------------
function normalizeStatus(raw: string): ShowStatus {
  const s = raw
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
  if (s === 'ongoing' || s === 'now' || s.startsWith('en ce moment')) {
    return 'ongoing';
  }
  if (s === 'touring' || s === 'en tournee') return 'touring';
  if (s === 'finished' || s === 'termine') return 'finished';
  throw new Error(
    `Statut inconnu: "${raw}" (attendu: En ce moment / En tournée / Terminé, ou ongoing / touring / finished)`
  );
}

function sqlQuote(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

// ---- Main ------------------------------------------------------------------
function main(): void {
  const args = process.argv.slice(2);
  const asJson = args.includes('--json');
  const csvPath = args.find((a) => !a.startsWith('--'));
  if (!csvPath) {
    console.error(
      'Usage: node scripts/importShows.ts <fichier.csv> [--json]'
    );
    process.exit(1);
  }

  const rows = parseCsv(readFileSync(csvPath, 'utf8'));
  if (rows.length < 2) {
    console.error('CSV vide (en-tête + au moins une ligne attendus).');
    process.exit(1);
  }

  const header = rows[0].map((h) => h.trim().toLowerCase());
  const col = (name: string, ...aliases: string[]): number => {
    for (const n of [name, ...aliases]) {
      const idx = header.indexOf(n);
      if (idx !== -1) return idx;
    }
    console.error(`Colonne manquante dans le CSV: "${name}"`);
    process.exit(1);
  };

  const iTitle = col('title');
  const iGenre = col('genre');
  const iCompany = col('company');
  const iVenues = col('venues', 'venue');
  const iSynopsis = col('synopsis');
  const iStatus = col('status');

  const shows: ShowRow[] = [];
  const venues: VenueRow[] = [];

  for (const [lineNo, row] of rows.slice(1).entries()) {
    const title = row[iTitle]?.trim();
    if (!title) {
      console.error(`Ligne ${lineNo + 2}: titre manquant, ligne ignorée.`);
      continue;
    }
    const genre = row[iGenre]?.trim() ?? '';
    if (!KNOWN_GENRES.includes(genre)) {
      console.error(
        `Ligne ${lineNo + 2}: genre inconnu "${genre}" (gardé tel quel — genres connus: ${KNOWN_GENRES.join(', ')})`
      );
    }
    const id = randomUUID();
    shows.push({
      id,
      title,
      genre,
      company: row[iCompany]?.trim() ?? '',
      synopsis: row[iSynopsis]?.trim() ?? '',
      status: normalizeStatus(row[iStatus] ?? ''),
    });
    for (const venue of (row[iVenues] ?? '')
      .split('|')
      .map((v) => v.trim())
      .filter(Boolean)) {
      venues.push({ show_id: id, venue });
    }
  }

  if (asJson) {
    // Ready for supabase-js: supabase.from('shows').insert(payload.shows) then
    // supabase.from('show_venues').insert(payload.show_venues).
    console.log(JSON.stringify({ shows, show_venues: venues }, null, 2));
    return;
  }

  // SQL output — ids are generated here so show_venues can reference them
  // without needing RETURNING round-trips.
  const lines: string[] = [
    '-- Generated by scripts/importShows.ts — review before running.',
    'begin;',
    '',
    'insert into shows (id, title, genre, company, synopsis, status) values',
    shows
      .map(
        (s) =>
          `  (${sqlQuote(s.id)}, ${sqlQuote(s.title)}, ${sqlQuote(s.genre)}, ${sqlQuote(s.company)}, ${sqlQuote(s.synopsis)}, ${sqlQuote(s.status)})`
      )
      .join(',\n') + ';',
  ];
  if (venues.length > 0) {
    lines.push(
      '',
      'insert into show_venues (show_id, venue) values',
      venues
        .map((v) => `  (${sqlQuote(v.show_id)}, ${sqlQuote(v.venue)})`)
        .join(',\n') + ';'
    );
  }
  lines.push('', 'commit;');
  console.log(lines.join('\n'));
}

main();
