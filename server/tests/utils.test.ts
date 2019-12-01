import { withDefault } from '../src/utils'

test('withDefault', () => {
  expect(withDefault(4, undefined)).toBe(4)
  expect(withDefault(4, 6)).toBe(6)
})
