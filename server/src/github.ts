import { Octokit } from 'probot'
import { WebhookPayloadInstallationRepositoriesRepositoriesAddedItem } from '@octokit/webhooks'
import { ReposGetContentsResponse, ReposGetResponse } from '@octokit/rest'

/**
 *
 * Create or Re-Create branch on a given repository.
 *
 * Branch names should include no `heads` and `refs`.
 *
 * Taken from opencollective/opencollective-bot
 *
 * @param github
 * @param owner
 * @param repo
 * @param branchName
 * @param defaultBranchName
 */
export async function resetBranch(
  github: Octokit,
  owner: string,
  repo: string,
  branchName: string,
  defaultBranchName: string,
) {
  // Get if the BRANCH_NAME is already existing
  const githubBranch = await github.repos
    .getBranch({
      owner,
      repo,
      branch: branchName,
    })
    .then(res => res.data)
    .catch(() => null)

  // Delete the branch in this case
  if (githubBranch) {
    await github.git.deleteRef({
      owner,
      repo,
      ref: `heads/${branchName}`,
    })
  }

  // Get the reference for the default branch (not necessarily master)
  const reference = await github.git
    .getRef({
      owner,
      repo,
      ref: `heads/${defaultBranchName}`,
    })
    .then(res => res.data)

  // Create the target branch
  return github.git.createRef({
    owner,
    repo,
    ref: `refs/heads/${branchName}`,
    sha: reference.object.sha,
  })
}

/**
 *
 * Fetch multiple repositories
 *
 * @param github
 * @param repositories
 */
export async function fetchRepos(
  github: Octokit,
  repositories: WebhookPayloadInstallationRepositoriesRepositoriesAddedItem[],
): Promise<ReposGetResponse[]> {
  return Promise.all(
    repositories.map(repository => {
      const [owner, repo] = repository.full_name.split('/')
      return getRepo(github, owner, repo)
    }),
  )
}

/**
 *
 * Get a single repository
 *
 * @param github
 * @param owner
 * @param repo
 */
export async function getRepo(
  github: Octokit,
  owner: string,
  repo: string,
): Promise<ReposGetResponse> {
  return github.repos.get({ owner, repo }).then((res: any) => res.data)
}
