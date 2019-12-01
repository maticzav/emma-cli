import ml from 'multilines'
import { Context, Octokit } from 'probot'

import { EmmaConfiguration } from '../../configuration'
import { Sources } from '../../sources'

/**
 * Seeks potential starters in a repository.
 *
 * @param sources
 */
export const discoverStarters = (sources: Sources) => async (ctx: Context) => {
  const owner = ctx.payload.repository.owner.login
  const repo = ctx.payload.repository.name
  const ref = ctx.payload.ref

  ctx.log.debug(`Discovering starters in ${owner}:${repo}/${ref}.`)
  const query = `filename:package.json+repo:${owner}/${repo}`

  try {
    const files = await findFiles(query)
    const starters = findPotentialStarters(files)

    const configFile = generateConfigurationFile(starters)
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
  async function generateConfigurationFile(
    filePaths: string[],
  ): Promise<EmmaConfiguration> {
    const starterLookups = await Promise.all(
      filePaths.map(filePath =>
        lookupStarter(ctx.github, { repo, owner, ref }, filePath),
      ),
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
export function findPotentialStarters(
  files: Octokit.SearchCodeResponseItemsItem[],
): string[] {
  const exceptions = [
    '^package.json$',
    'packages/.*/package.json$',
    'public/.*/package.json$',
    'web/.*/package.json$',
    'server/.*/package.json$',
  ]

  const matches = files.filter(
    file =>
      file.name === 'package.json' &&
      !exceptions.some(pattern => new RegExp(pattern).test(file.path)),
  )

  return matches.map(item => item.path)

  // const tree = matches.reduce((files, file) => {

  // })

  // /* Helper functions */

  // function fileDepth(f: Octokit.SearchCodeResponseItemsItem): number {
  //   return f.path.split('/').length
  // }
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
  { repo, owner, ref }: { repo: string; owner: string; ref: string },
  path: string,
): Promise<StarterLookup | false> {
  /* Attempt to laod configuration. */
  const res = await github.repos.getContents({
    owner: owner,
    repo: repo,
    ref: ref,
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
 * @param config
 */
export function explainConfiguration(config: EmmaConfiguration): string {
  return ml`
  | 
  `
}
