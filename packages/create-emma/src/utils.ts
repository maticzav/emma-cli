export type WithStdin<X> = X & {
  /**
   * Stdin stream passed to `render()` in `options.stdin` or `process.stdin` by default. Useful if your app needs to handle user input.
   */
  readonly stdin: NodeJS.ReadStream
  /**
   * Ink exposes this function via own `<StdinContext>` to be able to handle Ctrl+C, that's why you should use Ink's `setRawMode` instead of `process.stdin.setRawMode`.
   */
  readonly setRawMode: NodeJS.ReadStream['setRawMode']
}

export type Maybe<A> = A | null

/**
 *
 * Remove particular key from the object.
 *
 * @param k
 * @param obj
 */
export function removeKey<T>(
  k: string,
  obj: { [key: string]: T },
): { [key: string]: T } {
  return Object.keys(obj).reduce<{ [key: string]: T }>((acc, key) => {
    if (key === k) return acc
    return { ...acc, [key]: obj[key] }
  }, {})
}
