import { decodeConfiguration } from '../src/configuration'

describe('configuration:', () => {
  test('errors on incorrect', () => {
    const config = {
      starters: [
        {
          name: 'starter',
          path: '/templates/starter',
        },
        {
          faulty: '',
        },
      ],
    }

    expect(decodeConfiguration(config)._tag).toBe('Left')
  })

  test('passes on correct', () => {
    const config = {
      starters: [
        {
          name: 'starter',
          path: '/templates/starter',
        },
      ],
    }

    expect(decodeConfiguration(config)).toEqual({
      _tag: 'Right',
      right: config,
    })
  })
})
