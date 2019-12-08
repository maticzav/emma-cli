import crypto from 'crypto'

/**
 * Uses a default fallback value on undefined or null.
 *
 * @param fallback
 * @param value
 */
export function withDefault<T>(fallback: T, value: T | undefined | null): T {
  if (value === null || value === undefined) return fallback
  else return value
}

/**
 *
 * Computes the sha1 hash of a string
 *
 * Taken from opencollective/opencollective-bot
 *
 * @param value
 */
export function sha(value: string) {
  return crypto
    .createHash('sha1')
    .update(value)
    .digest('hex')
}

/**
 *
 * Encode a string using base64
 *
 * Taken from opencollective/opencollective-bot
 *
 * @param value
 */
export function base64(value: string) {
  return Buffer.from(value).toString('base64')
}
