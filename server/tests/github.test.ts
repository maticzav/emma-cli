import { resetBranch, getRepo, fetchRepos } from '../src/github'

const owner = 'maticzav'
const repo = 'emma-cli'

describe('resetBranch:', () => {
  const branchName = 'test-branch'
  const defaultBranchName = 'default-branch'

  test('just create branch if it dont exists', async () => {
    const github = {
      repos: {
        getBranch: jest.fn().mockRejectedValue(new Error('not exists')),
      },
      git: {
        getRef: jest.fn().mockResolvedValueOnce({
          data: { object: { sha: 'sha' } },
        }),
        createRef: jest.fn().mockResolvedValueOnce('created'),
        deleteRef: jest.fn(),
      },
    }

    const result = await resetBranch(
      github as any,
      owner,
      repo,
      branchName,
      defaultBranchName,
    )

    expect(result).toBe('created')
    expect(github.git.deleteRef).not.toBeCalled()
    expect(github.git.createRef).toBeCalledTimes(1)
    expect(github.git.createRef).toBeCalledWith({
      owner,
      repo,
      ref: `refs/heads/${branchName}`,
      sha: 'sha',
    })
  })

  test('delete and create branch if it exists', async () => {
    const github = {
      repos: {
        getBranch: jest.fn().mockResolvedValueOnce({
          data: branchName,
        }),
      },
      git: {
        getRef: jest.fn().mockResolvedValueOnce({
          data: { object: { sha: 'sha' } },
        }),
        createRef: jest.fn().mockResolvedValueOnce('created'),
        deleteRef: jest.fn(),
      },
    }

    const result = await resetBranch(
      github as any,
      owner,
      repo,
      branchName,
      defaultBranchName,
    )

    expect(result).toBe('created')
    expect(github.git.deleteRef).toBeCalledTimes(1)
    expect(github.git.deleteRef).toBeCalledWith({
      owner,
      repo,
      ref: `heads/${branchName}`,
    })
    expect(github.git.createRef).toBeCalledTimes(1)
    expect(github.git.createRef).toBeCalledWith({
      owner,
      repo,
      ref: `refs/heads/${branchName}`,
      sha: 'sha',
    })
  })
})

describe('fetchRepos', () => {
  test('get multiple repositories', async () => {
    const github = {
      repos: {
        get: jest.fn().mockImplementation(({ owner, repo }) =>
          Promise.resolve(
            ({
              'maticzav/repo1': { data: { name: 'repo1' } },
              'maticzav/repo2': { data: { name: 'repo2' } },
              'maticzav/repo3': { data: { name: 'repo3' } },
            } as any)[`${owner}/${repo}`],
          ),
        ),
      },
    }

    const result = await fetchRepos(
      github as any,
      [
        { full_name: 'maticzav/repo1' },
        { full_name: 'maticzav/repo2' },
        { full_name: 'maticzav/repo3' },
      ] as any,
    )

    expect(result).toHaveLength(3)
    expect(result).toContainEqual({ name: 'repo1' })
    expect(result).toContainEqual({ name: 'repo2' })
    expect(result).toContainEqual({ name: 'repo3' })
  })
})

describe('getRepo', () => {
  test('get a single repository', async () => {
    const github = {
      repos: {
        get: jest.fn().mockResolvedValueOnce({
          data: {
            name: repo,
          },
        }),
      },
    }

    const result = await getRepo(github as any, owner, repo)

    expect(result).toEqual({ name: repo })
    expect(github.repos.get).toBeCalledTimes(1)
  })
})
