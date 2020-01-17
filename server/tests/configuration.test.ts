import { Octokit } from 'probot'
import mls from 'multilines'
import { getConfig } from '../src/configuration'
import { Sources } from '../src/sources'
import { getMockSources } from './__mock__/sources'

const owner = 'maticzav'
const repo = 'emma-cli'

describe('getConfig:', () => {
  let sources: Sources = getMockSources()
  let github: Octokit

  beforeEach(() => {
    github = new Octokit()
  })

  test('return null if occur some error', async () => {
    const getContents = jest.fn()
    github.repos.getContents = getContents as any
    getContents.mockRejectedValueOnce(new Error('exception'))

    const result = await getConfig(sources)(github, owner, repo)

    expect(result).toBeNull()
    expect(getContents).toBeCalledTimes(1)
  })

  test('return null if repo is not a file', async () => {
    const getContents = jest.fn()
    github.repos.getContents = getContents as any
    getContents
      .mockResolvedValueOnce({
        data: [],
      })
      .mockResolvedValueOnce({
        data: {},
      })

    const result1 = await getConfig(sources)(github, owner, repo)
    const result2 = await getConfig(sources)(github, owner, repo)

    expect(result1).toBeNull()
    expect(result2).toBeNull()
    expect(getContents).toBeCalledTimes(2)
  })

  test('return null if configuration is invalid', async () => {
    const invalidConfig = mls`
    | starters:
    |   - name: correct_name
    |     paths_invalid: /invalid/field
    |   - name: correct_name
    |     path: /this/field/is/valid
    `

    const getContents = jest.fn()
    github.repos.getContents = getContents as any
    getContents.mockResolvedValueOnce({
      data: {
        content: Buffer.from(invalidConfig).toString('base64'),
      },
    })

    const result = await getConfig(sources)(github, owner, repo)

    expect(result).toBeNull()
    expect(getContents).toBeCalledTimes(1)
  })

  test('return the config if it is valid', async () => {
    const validConfig = mls`
    | starters:
    |   - name: correct_name
    |     path: /this/field/is/valid
    |   - name: correct_name2
    |     path: /this/field/is/valid/too
    |     description: valid_again
    `

    const getContents = jest.fn()
    github.repos.getContents = getContents as any
    getContents.mockResolvedValueOnce({
      data: {
        content: Buffer.from(validConfig).toString('base64'),
      },
    })

    const result = await getConfig(sources)(github, owner, repo)

    expect(result).toEqual({
      starters: [
        { name: 'correct_name', path: '/this/field/is/valid' },
        {
          name: 'correct_name2',
          path: '/this/field/is/valid/too',
          description: 'valid_again',
        },
      ],
    })

    expect(getContents).toBeCalledTimes(1)
  })
})
