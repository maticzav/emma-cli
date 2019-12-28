import { withDefault, base64, sha } from '../src/utils'

describe('utils:', () => {
  test('withDefault:', () => {
    expect(withDefault(4, undefined)).toBe(4)
    expect(withDefault(4, 6)).toBe(6)
  })

  test('sha', () => {
    expect(sha('qwerty')).toBe('b1b3773a05c0ed0176787a4f1574ff0075f7521e')
    expect(sha('1029384756')).toBe('1142b33e04e1bef9f8724b824c54b08899f572a7')
    expect(sha('asdfg_123')).toBe('49bc7a03bdeb7cc62a516673cb3c2c0267d42aae')
  })

  describe('base64', () => {
    test('inverseBase64(base64(x)) === x', () => {
      const identity = (x: string) =>
        Buffer.from(base64(x), 'base64').toString()

      expect(identity('qwerty')).toBe('qwerty')
      expect(identity('1029384756')).toBe('1029384756')
      expect(identity('asdfg_123')).toBe('asdfg_123')
    })
  })
})
