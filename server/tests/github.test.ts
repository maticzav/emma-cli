import { resetBranch, getRepo, fetchRepos } from '../src/github'
import { Octokit } from 'probot'

describe('github:', () => {
  let github: Octokit
  const owner = 'maticzav'
  const repo = 'emma-cli'

  describe('resetBranch:', () => {
    let getBranch: jest.Mock
    let deleteRef: jest.Mock
    let getRef: jest.Mock
    let createRef: jest.Mock

    const branchName = 'test-branch'
    const defaultBranchName = 'default-branch'

    beforeEach(() => {
      github = new Octokit()
      getBranch = jest.fn()
      deleteRef = jest.fn()
      getRef = jest.fn()
      createRef = jest.fn()
      github.repos.getBranch = getBranch as any
      github.git.deleteRef = deleteRef as any
      github.git.getRef = getRef as any
      github.git.createRef = createRef as any
    })

    test.skip('should handle correctly if some param is wrong', () => {
      // TODO: consider to implement the code for this
    })

    test('should just create branch if it dont exists', async () => {
      getBranch.mockRejectedValue(new Error('not exists'))

      getRef.mockResolvedValueOnce({
        data: { object: { sha: 'sha' } },
      })

      createRef.mockResolvedValueOnce('created')

      const result = await resetBranch(
        github,
        owner,
        repo,
        branchName,
        defaultBranchName,
      )

      expect(result).toBe('created')
      expect(deleteRef).not.toBeCalled()
      expect(createRef).toBeCalledTimes(1)
      expect(createRef).toBeCalledWith({
        owner,
        repo,
        ref: `refs/heads/${branchName}`,
        sha: 'sha',
      })
    })

    test('should delete and create branch if it exists', async () => {
      getBranch.mockResolvedValueOnce({
        data: branchName,
      })

      getRef.mockResolvedValueOnce({
        data: { object: { sha: 'sha' } },
      })

      createRef.mockResolvedValueOnce('created')

      const result = await resetBranch(
        github,
        owner,
        repo,
        branchName,
        defaultBranchName,
      )

      expect(result).toBe('created')
      expect(deleteRef).toBeCalledTimes(1)
      expect(deleteRef).toBeCalledWith({
        owner,
        repo,
        ref: `heads/${branchName}`,
      })
      expect(createRef).toBeCalledTimes(1)
      expect(createRef).toBeCalledWith({
        owner,
        repo,
        ref: `refs/heads/${branchName}`,
        sha: 'sha',
      })
    })
  })

  describe('fetchRepos', () => {
    let githubReposGet: jest.Mock

    beforeEach(() => {
      github = new Octokit()
      githubReposGet = jest.fn()
      github.repos.get = githubReposGet as any
    })

    test('should get multiple repositories', async () => {
      githubReposGet.mockImplementation(({ owner, repo }) =>
        Promise.resolve(
          ({
            'maticzav/repo1': { data: { name: 'repo1' } },
            'maticzav/repo2': { data: { name: 'repo2' } },
            'maticzav/repo3': { data: { name: 'repo3' } },
          } as any)[`${owner}/${repo}`],
        ),
      )

      const result = await fetchRepos(github, [
        { full_name: 'maticzav/repo1' },
        { full_name: 'maticzav/repo2' },
        { full_name: 'maticzav/repo3' },
      ] as any)

      expect(result).toHaveLength(3)
      expect(result).toContainEqual({ name: 'repo1' })
      expect(result).toContainEqual({ name: 'repo2' })
      expect(result).toContainEqual({ name: 'repo3' })
    })
  })

  describe('getRepo', () => {
    let githubReposGet: jest.Mock

    beforeEach(() => {
      github = new Octokit()
      githubReposGet = jest.fn()
      github.repos.get = githubReposGet as any
    })

    test('handle correctly if not found', async () => {
      expect.assertions(2)
      githubReposGet.mockRejectedValueOnce(new Error('not found'))

      try {
        await getRepo(github, owner, repo)
      } catch (error) {
        expect(error).toEqual(new Error('not found'))
      }

      expect(githubReposGet).toBeCalledTimes(1)
    })

    test('should get a single repository', async () => {
      githubReposGet.mockResolvedValueOnce({
        data: {
          name: repo,
        },
      })

      const result = await getRepo(github, owner, repo)

      expect(result).toEqual({ name: repo })
      expect(githubReposGet).toBeCalledTimes(1)
    })
  })
})
