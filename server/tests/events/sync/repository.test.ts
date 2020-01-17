import { LoggerWithTarget } from 'probot/lib/wrap-logger'
import { GitHubAPI } from 'probot/lib/github'
import { Context } from 'probot'
import mls from 'multilines'
import { getMockSources } from '../../__mock__/sources'
import { syncRepository } from '../../../src/events/sync/repository'
import { Sources } from '../../../src/sources'
import { base64 } from '../../../src/utils'


describe('syncRepository:', () => {
  // github
  let github: GitHubAPI
  let getContents: jest.Mock

  // prisma
  let upsert: jest.Mock
  let findMany: jest.Mock
  let deleteMany: jest.Mock

  // algolia
  let addObject: jest.Mock
  let deleteObjects: jest.Mock

  // log
  let log: LoggerWithTarget
  let logInfo: jest.Mock
  let logWarn: jest.Mock
  let logDebug: jest.Mock
  let logError: jest.Mock

  let sources: Sources

  const makeContext = (event: any) => new Context(event, github, log)

  beforeEach(() => {
    sources = getMockSources()

    // prisma
    upsert = jest.fn()
    findMany = jest.fn()
    deleteMany = jest.fn()
    Object.defineProperty(sources.prisma.photon, 'starters', {
      get: () => ({
        upsert,
        findMany,
        deleteMany,
      })
    })

    // algolia
    addObject = jest.fn()
    deleteObjects = jest.fn()
    sources.algolia.indices.starters.addObject = addObject
    sources.algolia.indices.starters.deleteObjects = deleteObjects

    // github
    github = GitHubAPI()
    getContents = jest.fn()
    github.repos.getContents = getContents as any

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

  test('should ignore execution if ref is non-default', async () => {
    const ctx = makeContext({
      id: '123',
      name: 'push',
      payload: {
        ref: 'refs/heads/non-default',
        repository: {
          name: 'graphql-shield',
          default_branch: 'master',
          owner: { login: 'maticzav' },
        },
      },
    })

    await syncRepository(sources)(ctx)

    expect(upsert).not.toBeCalled()
    expect(addObject).not.toBeCalled()
  })

  test('should ignore execution if faulty configuration', async () => {
    const invalidConfig = mls`
      | starters:
      |   - name: correct_name
      |     paths_invalid: /invalid/field
      |   - name: correct_name
      |     path: /this/field/is/valid
      `

    getContents.mockResolvedValue({
      data: {
        content: base64(invalidConfig),
      },
    })

    const ctx = makeContext({
      id: '123',
      name: 'push',
      payload: {
        ref: 'refs/heads/master',
        repository: {
          name: 'graphql-shield',
          default_branch: 'master',
          owner: { login: 'maticzav' },
        },
      },
    })

    await syncRepository(sources)(ctx)

    expect(getContents).toBeCalledTimes(1)
    expect(upsert).not.toBeCalled()
    expect(addObject).not.toBeCalled()
  })

  test('should ignore execution if unsuccess status on get starter package.json content', async () => {
    const config = mls`
      | starters:
      |   - name: GraphQL Shield Basic
      |     path: /examples/basic
      `

    getContents.mockImplementation(({ path }) => {
      if ('/examples/basic/package.json' === path) {
        // For loadStarter
        return { status: 123 }
      } else {
        // For loadConfiguration
        return { status: 200, data: { content: base64(config) } }
      }
    })

    const ctx = makeContext({
      id: '123',
      name: 'push',
      payload: {
        ref: 'refs/heads/master',
        repository: {
          name: 'graphql-shield',
          default_branch: 'master',
          owner: { login: 'maticzav' },
        },
      },
    })

    await syncRepository(sources)(ctx)

    expect(getContents).toBeCalledTimes(2)
    expect(upsert).not.toBeCalled()
    expect(addObject).not.toBeCalled()
  })

  test('should ignore execution if starter package.json is not a file', async () => {
    const config = mls`
      | starters:
      |   - name: GraphQL Shield Basic
      |     path: /examples/basic
      `

    getContents.mockImplementation(({ path }) => {
      if ('/examples/basic/package.json' === path) {
        // Set package.json is not a file
        return { status: 200, data: {} }
      } else {
        // For loadConfiguration
        return { status: 200, data: { content: base64(config) } }
      }
    })

    const ctx = makeContext({
      id: '123',
      name: 'push',
      payload: {
        ref: 'refs/heads/master',
        repository: {
          name: 'graphql-shield',
          default_branch: 'master',
          owner: { login: 'maticzav' },
        },
      },
    })

    await syncRepository(sources)(ctx)

    expect(getContents).toBeCalledTimes(2)
    expect(upsert).not.toBeCalled()
    expect(addObject).not.toBeCalled()
  })

  test('should ignore execution if starter package.json dont include package name', async () => {
    const config = mls`
      | starters:
      |   - name: GraphQL Shield Basic
      |     path: /examples/basic
      `

    const packageConfig = mls`
    | {
    |   "dependecies": { "but_no_package_name": "1.0.0" }
    | }
    `

    getContents.mockImplementation(({ path }) => {
      if ('/examples/basic/package.json' === path) {
        // For starter pacakge.json
        return { status: 200, data: { content: base64(packageConfig) } }
      } else {
        // For loadConfiguration
        return { status: 200, data: { content: base64(config) } }
      }
    })

    const ctx = makeContext({
      id: '123',
      name: 'push',
      payload: {
        ref: 'refs/heads/master',
        repository: {
          name: 'graphql-shield',
          default_branch: 'master',
          owner: { login: 'maticzav' },
        },
      },
    })

    await syncRepository(sources)(ctx)

    expect(getContents).toBeCalledTimes(2)
    expect(upsert).not.toBeCalled()
    expect(addObject).not.toBeCalled()
  })

  test('should ignore execution if starter package.json dont include package dependencies', async () => {
    const config = mls`
    | starters:
    |   - name: GraphQL Shield Basic
    |     path: /examples/basic
      `

    const packageConfig = mls`
    | {
    |   "name": "basic_but_dependecies_is_not_present"
    | }
    `

    getContents.mockImplementation(({ path }) => {
      if ('/examples/basic/package.json' === path) {
        // For loadStarter
        return { status: 200, data: { content: base64(packageConfig) } }
      } else {
        // For loadConfiguration
        return { status: 200, data: { content: base64(config) } }
      }
    })

    const ctx = makeContext({
      id: '123',
      name: 'push',
      payload: {
        ref: 'refs/heads/master',
        repository: {
          name: 'graphql-shield',
          default_branch: 'master',
          owner: { login: 'maticzav' },
        },
      },
    })

    await syncRepository(sources)(ctx)

    expect(getContents).toBeCalledTimes(2)
    expect(upsert).not.toBeCalled()
    expect(addObject).not.toBeCalled()
  })

  test('should save starters to prisma and algolia', async () => {
    const config = mls`
      | starters:
      |   - name: GraphQL Shield Basic
      |     path: /examples/basic
      `

    const packageConfig = mls`
    | {
    |   "name": "basic",
    |   "description": "GraphQL Shield Basic description",
    |   "dependencies": {
    |     "graphql-shield": "6.1.0",
    |     "graphql-yoga": "1.18.3"
    |   }
    | }
    `

    getContents.mockImplementation(({ path }) => {
      if ('/examples/basic/package.json' === path) {
        // For loadStarter
        return { status: 200, data: { content: base64(packageConfig) } }
      } else {
        // For loadConfiguration
        return { status: 200, data: { content: base64(config) } }
      }
    })

    findMany.mockResolvedValueOnce([])

    const ctx = makeContext({
      id: '123',
      name: 'push',
      payload: {
        ref: 'refs/heads/master',
        repository: {
          name: 'graphql-shield',
          default_branch: 'master',
          owner: { login: 'maticzav' },
        },
      },
    })

    await syncRepository(sources)(ctx)

    expect(getContents).toBeCalledTimes(2)
    expect(upsert).toBeCalledTimes(1)
    expect(upsert).toBeCalledWith({
      where: { signature: '5dc5d222ce2b605e66ffe56e12a76c3ee7eb0a0b' },
      create: {
        signature: '5dc5d222ce2b605e66ffe56e12a76c3ee7eb0a0b',
        repo: 'graphql-shield',
        owner: 'maticzav',
        path: '/examples/basic',
        ref: 'refs/heads/master',
        name: 'GraphQL Shield Basic',
        description: 'GraphQL Shield Basic description',
        dependencies: { set: ['graphql-shield', 'graphql-yoga'] },
      },
      update: {
        repo: 'graphql-shield',
        owner: 'maticzav',
        path: '/examples/basic',
        ref: 'refs/heads/master',
        name: 'GraphQL Shield Basic',
        description: 'GraphQL Shield Basic description',
        dependencies: { set: ['graphql-shield', 'graphql-yoga'] },
      },
    })
    expect(addObject).toBeCalledTimes(1)
    expect(addObject).toBeCalledWith({
      objectID: '5dc5d222ce2b605e66ffe56e12a76c3ee7eb0a0b',
      owner: 'maticzav',
      repo: 'graphql-shield',
      name: 'GraphQL Shield Basic',
      description: 'GraphQL Shield Basic description',
      downloads: 0,
      dependencies: ['graphql-shield', 'graphql-yoga'],
    })
  })

  test('should clean legacy starters from database', async () => {
    const config = mls`
      | starters:
      |   - name: GraphQL Shield Basic
      |     path: /examples/basic
      `

    const packageConfig = mls`
    | {
    |   "name": "basic",
    |   "description": "GraphQL Shield Basic description",
    |   "dependencies": {
    |     "graphql-shield": "6.1.0",
    |     "graphql-yoga": "1.18.3"
    |   }
    | }
    `

    getContents.mockImplementation(({ path }) => {
      if ('/examples/basic/package.json' === path) {
        // For loadStarter
        return { status: 200, data: { content: base64(packageConfig) } }
      } else {
        // For loadConfiguration
        return { status: 200, data: { content: base64(config) } }
      }
    })

    findMany.mockResolvedValueOnce([
      {
        signature: 'legacy_signature_1',
      },
      {
        signature: 'legacy_signature_2',
      },
    ])

    const ctx = makeContext({
      id: '123',
      name: 'push',
      payload: {
        ref: 'refs/heads/master',
        repository: {
          name: 'graphql-shield',
          default_branch: 'master',
          owner: { login: 'maticzav' },
        },
      },
    })

    await syncRepository(sources)(ctx)

    expect(getContents).toBeCalledTimes(2)
    expect(findMany).toBeCalledTimes(1)
    expect(findMany).toBeCalledWith({
      where: {
        repo: 'graphql-shield',
        owner: 'maticzav',
        name: { notIn: ['GraphQL Shield Basic'] },
      },
    })
    expect(deleteObjects).toBeCalledTimes(1)
    expect(deleteObjects).toBeCalledWith([
      'legacy_signature_1',
      'legacy_signature_2',
    ])
    expect(deleteMany).toBeCalledTimes(1)
    expect(deleteMany).toBeCalledWith({
      where: {
        repo: 'graphql-shield',
        owner: 'maticzav',
        name: { notIn: ['GraphQL Shield Basic'] },
      },
    })
  })
})
