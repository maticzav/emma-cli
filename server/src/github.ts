import { Octokit } from 'probot'

/**
 *
 * Create or Re-Create branch on a given repository
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
    .then((res: any) => res.data)
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
    .then((res: any) => res.data)

  // Create the target branch
  return await github.git.createRef({
    owner,
    repo,
    ref: `refs/heads/${branchName}`,
    sha: reference.object.sha,
  })
}
