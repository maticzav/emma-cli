import ml from 'multilines'
import { Context, Octokit } from 'probot'
import yaml from 'js-yaml'

import { EmmaConfiguration, getConfig } from '../../configuration'
import { Sources } from '../../sources'
import { resetBranch } from '../../github'
import { base64, sha } from '../../utils'

/**
 * Seeks potential starters in a repository.
 *
 * @param sources
 */
export const discoverStarters = (sources: Sources) => async (
  ctx: Context,
  owner: string,
  repo: string,
  default_branch: string,
) => {
  const masterRef = `refs/heads/${default_branch}`

  ctx.log.info(`Discovering starters in ${owner}:${repo}.`)

  /* Check that a configuration file doesn't exist yet. */
  const config = await getConfig(sources)(ctx.github, owner, repo)
  if (config !== null) {
    ctx.log.info(`${owner}:${repo} has an existing configuration.`)
    return
  }

  const query = `filename:package.json+repo:${owner}/${repo}`

  try {
    /**
     * Searches for potential starters and generates
     * a configuration file out of the results.
     */
    const files = await findFiles(query)
    const starters = filterPotentialStarters(files)

    ctx.log.debug({ starters }, `potential starters found in ${owner}/${repo}`)

    const generatedConfig = await generateConfigurationFile(starters)
    const configExplanation = explainConfiguration(generatedConfig)
    const configFile = yaml.safeDump(generatedConfig)

    ctx.log.debug(
      { generatedConfig, configExplanation, configFile },
      `Composed PR content for ${owner}/${repo}`,
    )

    /**
     * Creates a configuration PR on the designated branch.
     */
    await resetBranch(
      ctx.github,
      repo,
      owner,
      sources.constants.configurationBranch,
      masterRef,
    )

    await ctx.github.repos.createOrUpdateFile({
      owner: owner,
      repo: repo,
      path: sources.constants.configurationFilePath,
      message: `chore: Create Emma CLI configuration`,
      content: base64(configFile),
      sha: sha(configFile),
      branch: sources.constants.configurationBranch,
    })

    const pr = await ctx.github.pulls.create({
      owner: owner,
      repo: repo,
      head: sources.constants.configurationBranch,
      base: masterRef,
      title: `EmmaCLI Starters onboarding`,
      body: configExplanation,
      maintainer_can_modify: true,
    })

    ctx.log.info(
      `Submitted onboarding pr (${pr.data.number}) to ${owner}/${repo}`,
    )
  } catch (err) {
    ctx.log.error(err)
  }

  /* Helper functions */

  /**
   * Paginates and finds all files matching the query.
   *
   * @param query
   * @param page
   */
  async function findFiles(
    query: string,
    page: number = 0,
  ): Promise<Octokit.SearchCodeResponseItemsItem[]> {
    const files = await ctx.github.search.code({
      q: query,
      page,
      per_page: 100,
    })

    if (files.data.items.length < 100) {
      return files.data.items
    } else {
      const remainingFiles = await findFiles(query, page + 1)
      return files.data.items.concat(remainingFiles)
    }
  }

  /**
   * Looks up each potential starter and derives configuraiton.
   *
   * @param filePaths
   */
  async function generateConfigurationFile(
    filePaths: string[],
  ): Promise<EmmaConfiguration> {
    const starterLookups = await Promise.all(
      filePaths.map(filePath =>
        lookupStarter(ctx.github, { repo, owner }, filePath),
      ),
    )

    ctx.log.debug(
      { starterLookups },
      `found these potential starters in ${owner}/${repo}`,
    )

    const starters: StarterLookup[] = starterLookups.reduce<StarterLookup[]>(
      (acc, lookup) => {
        if (lookup === false) {
          return acc
        } else {
          return acc.concat(lookup)
        }
      },
      [],
    )

    return {
      starters: starters.map(starter => ({
        name: starter.name,
        description: starter.description,
        path: starter.path,
      })),
    }
  }
}

/**
 * Filters down the list of possible starters.
 *
 * @param files
 */
export function filterPotentialStarters(
  files: Octokit.SearchCodeResponseItemsItem[],
): string[] {
  const exceptions = [
    '^package.json$',
    'packages/.*/package.json$',
    'public/.*/package.json$',
    'web/.*/package.json$',
    'server/.*/package.json$',
    'action.*/package.json$',
  ]

  const matches = files.filter(
    file =>
      file.name === 'package.json' &&
      !exceptions.some(pattern => new RegExp(pattern).test(file.path)),
  )

  return matches.map(item => item.path)
}

interface StarterLookup {
  path: string
  name: string
  description: string
}

/**
 * Looks up a path for a potential starter.
 *
 * @param github
 * @param param
 * @param config
 */
async function lookupStarter(
  github: Octokit,
  { repo, owner }: { repo: string; owner: string },
  path: string,
): Promise<StarterLookup | false> {
  /* Attempt to laod configuration. */
  const res = await github.repos.getContents({
    owner: owner,
    repo: repo,
    path: path,
  })

  switch (res.status) {
    case 200: {
      /* Make sure response is a file. */
      if (Array.isArray(res.data) || !res.data.content) return false

      const buffer = Buffer.from(res.data.content, 'base64').toString()
      const pkg = JSON.parse(buffer)

      /* Make sure response includes all parameters. */
      if (!pkg.name || !pkg.dependencies) return false

      return {
        path: path,
        name: pkg.name,
        description: pkg.description,
      }
    }
    default: {
      return false
    }
  }
}

/**
 * Translates machine readable configuration into
 * a human readable piece of writing.
 *
 * @param config
 */
export function explainConfiguration(config: EmmaConfiguration): string {
  return ml`
  | # Configure Emma CLI Starters
  |
  | Welcome to Emma CLI!
  |
  | This is onboarding pull request that will help you understand and configure Emma CLI Starters.
  |
  | If you have any questions try reading our [docs](https://github.com/maticzav/emma-cli), or file an issue [here](https://github.com/maticzav/emma-cli).
  |
  | ## Detected Starters
  | ${config.starters.map(st => ` * ${st.name}: \`${st.path}\`\n`)}
  |
  | ## What to expect
  |
  | Based on your current configuration, Emma CLI will:
  | * Inspect ${config.starters.length} starters,
  | * Index your starters in our database,
  | * Make starters available to everyone using \`create-emma\`.
  |
  | We are happy to have you onboard! :tada:
  `
}
