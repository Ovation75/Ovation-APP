// Social sharing via the native Share sheet (React Native built-in — no extra
// dependency). Text-only for now: no deep links until the app has a public URL
// scheme / universal links.
import { Share } from 'react-native';

function stars(rating: number): string {
  // e.g. 3.5 -> "★★★½"
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  return '★'.repeat(full) + (half ? '½' : '');
}

// Share a show (from the Fiche Spectacle).
export function shareShow(title: string, venue?: string): void {
  const lines = [
    `${title} — à découvrir sur Ovation 🎭`,
    venue ? `En ce moment : ${venue}` : null,
  ].filter(Boolean);
  Share.share({ message: lines.join('\n') }).catch(() => {});
}

// Share a log/review (own or someone else's).
export function shareReview(
  username: string,
  showTitle: string,
  rating: number,
  review?: string | null
): void {
  const snippet = review
    ? `« ${review.length > 140 ? `${review.slice(0, 140)}…` : review} »`
    : null;
  const lines = [
    `${username} a noté ${showTitle} ${stars(rating)} (${rating
      .toFixed(1)
      .replace('.', ',')}/5) sur Ovation 🎭`,
    snippet,
  ].filter(Boolean);
  Share.share({ message: lines.join('\n') }).catch(() => {});
}
