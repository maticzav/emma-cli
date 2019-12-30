import { LoggerWithTarget } from 'probot/lib/wrap-logger'
import { GitHubAPI } from 'probot/lib/github'
import { Context } from 'probot'
import mls from 'multilines'
import { getMockSources } from '../../__mock__/sources'
import { discoverStarters } from '../../../src/events/discover/starters'
import { Sources } from '../../../src/sources'
import { base64 } from '../../../src/utils'
import * as githubMock from '../../../src/github'
import * as packages from './__fixtures__/packages'

jest.mock('../../../src/github')

describe('discoverStarters:', () => {
  // github
  let github: GitHubAPI
  let getContents: jest.Mock
  let searchCode: jest.Mock
  let createOrUpdateFile: jest.Mock
  let createPr: jest.Mock

  // log
  let log: LoggerWithTarget
  let logInfo: jest.Mock
  let logWarn: jest.Mock
  let logDebug: jest.Mock
  let logError: jest.Mock
  let sources: Sources

  const makeContext = (event: any) => new Context(event, github, log)

  const sampleEvent = {
    id: '123',
    name: 'installation_repositories.added',
    payload: {
      repository: {
        name: 'graphql-shield',
        default_branch: 'master',
        owner: { login: 'maticzav' },
      },
    },
  }

  beforeEach(() => {
    sources = getMockSources()

    // github
    github = GitHubAPI()
    getContents = jest.fn()
    searchCode = jest.fn()
    createOrUpdateFile = jest.fn()
    createPr = jest.fn()
    github.repos.getContents = getContents as any
    github.search.code = searchCode as any
    github.repos.createOrUpdateFile = createOrUpdateFile as any
    github.pulls.create = createPr as any

    // log
    logInfo = jest.fn()
    logWarn = jest.fn()
    logDebug = jest.fn()
    logError = jest.fn()
    log = {
      info: logInfo,
      warn: logWarn,
      debug: logDebug,
      error: logError,
    } as any
  })

  test('should ignore execution if configuration file already exists', async () => {
    const config = mls`
      | starters:
      |   - name: GraphQL Shield Basic
      |     path: /examples/basic
      `

    // Return content correctly implying that configuration file exists
    getContents.mockResolvedValue({
      data: {
        content: base64(config),
      },
    })

    const ctx = makeContext(sampleEvent)
    await discoverStarters(sources)(ctx, 'maticzav', 'graphql-shield', 'master')

    expect(logInfo).toBeCalledTimes(2)
    expect(logInfo).toHaveBeenNthCalledWith(
      2,
      'maticzav:graphql-shield has an existing configuration.',
    )
  })

  test('should log error if exception occur', async () => {
    // Return no content implying that configuration file doesnt exists
    getContents.mockResolvedValue({
      data: {},
    })

    // Throw error while finding files
    searchCode.mockRejectedValue('error finding files')

    const ctx = makeContext(sampleEvent)
    await discoverStarters(sources)(ctx, 'maticzav', 'graphql-shield', 'master')

    expect(logInfo).toBeCalledTimes(1)
    expect(logError).toBeCalledTimes(1)
    expect(logError).toBeCalledWith('error finding files')
  })

  test('should succeed', async () => {
    const owner = 'maticzav'
    const repo = 'graphql-shield'

    // Return no content implying that configuration file doesnt exists
    getContents.mockResolvedValue({
      data: {},
    })

    const items = [
      { name: 'package.json', path: 'examples/advanced/package.json' },
      { name: 'package.json', path: 'examples/basic/package.json' },
      {
        name: 'package.json',
        path: 'examples/with-apollo-server-lambda/package.json',
      },
      {
        name: 'package.json',
        path: 'examples/with-graphql-middleware-forward-binding/package.json',
      },
      {
        name: 'package.json',
        path: 'examples/with-graphql-nexus/package.json',
      },
      { name: 'package.json', path: 'package.json' },
    ]

    searchCode.mockResolvedValueOnce({
      data: {
        items,
      },
    })
    ;(githubMock.resetBranch as jest.Mock).mockResolvedValue(undefined)

    getContents.mockImplementation(({ path }) => {
      return Promise.resolve({
        status: 200,
        data: {
          content: base64(
            JSON.stringify(
              Object.values(packages).filter(x => x.path === path)[0],
            ),
          ),
        },
      })
    })

    createPr.mockResolvedValueOnce({
      data: { number: 123 },
    })

    const potencialStarters = [
      items[0],
      items[1],
      items[2],
      items[3],
      items[4],
    ].map(x => x.path)

    // act!
    const ctx = makeContext(sampleEvent)
    await discoverStarters(sources)(ctx, owner, repo, 'master')

    // check
    expect(logInfo).toBeCalledTimes(2)
    expect(logDebug).toHaveBeenNthCalledWith(
      1,
      { starters: potencialStarters },
      'potential starters found in maticzav/graphql-shield',
    )
    expect(getContents).toBeCalledTimes(6)

    for (let i = 0; i < 5; i++) {
      expect(getContents).nthCalledWith(i + 2, {
        owner,
        repo,
        path: potencialStarters[i],
      })
    }

    expect(githubMock.resetBranch).toBeCalledTimes(1)
    expect(createOrUpdateFile).toBeCalledTimes(1)

    expect(logWarn).not.toBeCalled()
    expect(logError).not.toBeCalled()
  })
})
