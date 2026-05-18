/**
 * Classic Levenshtein edit distance.
 * Used by not-found pages to suggest "Did you mean X?" per D-03 / UI-SPEC §5.4.
 */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const m = a.length;
  const n = b.length;
  const prev: number[] = new Array(n + 1);
  const curr: number[] = new Array(n + 1);

  for (let j = 0; j <= n; j++) prev[j] = j;

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        curr[j - 1] + 1,       // insertion
        prev[j] + 1,           // deletion
        prev[j - 1] + cost,    // substitution
      );
    }
    for (let j = 0; j <= n; j++) prev[j] = curr[j];
  }

  return prev[n];
}

/**
 * Find the nearest reference in `candidates` to `needle`.
 * Returns the candidate if Levenshtein distance ≤ 2 OR if `needle` and the
 * candidate share a numeric prefix of ≥ 4 digits (per D-03).
 * Returns `null` if no candidate qualifies.
 */
export function nearestReference(needle: string, candidates: string[]): string | null {
  if (!needle || candidates.length === 0) return null;
  const upper = needle.toUpperCase();

  let best: { value: string; distance: number } | null = null;
  for (const c of candidates) {
    const d = levenshtein(upper, c.toUpperCase());
    if (d <= 2 && (best === null || d < best.distance)) {
      best = { value: c, distance: d };
    }
  }
  if (best) return best.value;

  // Fallback: matching numeric prefix of ≥ 4 digits.
  const prefixMatch = upper.match(/\d{4,}/);
  if (prefixMatch) {
    const prefix = prefixMatch[0];
    for (const c of candidates) {
      if (c.toUpperCase().includes(prefix)) return c;
    }
  }

  return null;
}
