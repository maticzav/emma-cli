import * as probot from 'probot'
import { getMockSources } from '../../__mock__/sources'
import { syncRepository } from '../../../src/events/sync/repository'
import { Sources } from '../../../src/sources'
import { Octokit } from 'probot'
import mls from 'multilines'
import { base64 } from '../../../src/utils'

describe('syncRepository:', () => {
  let app: probot.Application
  let github: Octokit
  let upsert: jest.Mock
  let addObject: jest.Mock
  let getContents: jest.Mock
  let findMany: jest.Mock
  let deleteMany: jest.Mock
  let deleteObjects: jest.Mock
  let sources: Sources

  beforeEach(() => {
    sources = getMockSources()
    upsert = jest.fn()
    addObject = jest.fn()
    getContents = jest.fn()
    findMany = jest.fn()
    deleteMany = jest.fn()
    deleteObjects = jest.fn()
    app = new probot.Application()
    github = new Octokit()

    Object.defineProperty(sources.prisma.photon, 'starters', {
      get: () => ({
        upsert,
        findMany,
        deleteMany,
      }),
    })

    sources.algolia.indices.starters.addObject = addObject
    sources.algolia.indices.starters.deleteObjects = deleteObjects
    github.repos.getContents = getContents as any

    app.auth = () => Promise.resolve(github as any)
    app.on('push', syncRepository(sources))
  })

  test('should ignore execution if ref is non-default', async () => {
    await app.receive({
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

    await app.receive({
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

    await app.receive({
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

    await app.receive({
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

    await app.receive({
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

    await app.receive({
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

    await app.receive({
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

    await app.receive({
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
