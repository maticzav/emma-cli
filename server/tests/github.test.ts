import { resetBranch } from '../src/github'
import { Octokit } from 'probot'

describe('github:', () => {
  describe('resetBranch:', () => {
    let github: Octokit
    let getBranch: jest.Mock
    let deleteRef: jest.Mock
    let getRef: jest.Mock
    let createRef: jest.Mock

    const owner = 'maticzav'
    const repo = 'emma-cli'
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
})
