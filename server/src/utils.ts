/**
 * Uses a default fallback value on undefined or null.
 *
 * @param fallback
 * @param value
 */
function withDefault<T>(fallback: T, value: T | undefined | null): T {
  if (value === null || value === undefined) return fallback
  else return value
}
