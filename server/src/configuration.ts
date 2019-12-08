import * as e from 'fp-ts/lib/Either'
import * as t from 'io-ts'
import { Octokit } from 'probot'
import yaml from 'js-yaml'

import { Sources } from './sources'

const StarterConfiguration = t.intersection([
  t.type({
    name: t.string,
    path: t.string,
  }),
  t.partial({
    description: t.string,
  }),
])

export interface StarterConfiguration
  extends t.TypeOf<typeof StarterConfiguration> {}

const Configuration = t.type({
  starters: t.array(StarterConfiguration),
})

export interface EmmaConfiguration extends t.TypeOf<typeof Configuration> {}

/**
 * Decodes configurations. Returns error message as a first parameter,
 * or null meaning that configuration is valid.
 *
 * @param config
 */
function decodeConfiguration(
  config: any,
): e.Either<t.Errors, EmmaConfiguration> {
  return Configuration.decode(config)
}

/**
 *
 * Loads configuration from GitHub.
 *
 * @param ctx
 */
export const getConfig = (sources: Sources) => async (
  github: Octokit,
  owner: string,
  repo: string,
): Promise<EmmaConfiguration | null> => {
  try {
    const res = await github.repos.getContents({
      owner: owner,
      repo: repo,
      path: sources.constants.configurationFilePath,
    })

    /* Make sure response is a file. */
    if (Array.isArray(res.data) || !res.data.content) {
      return null
    }

    const buffer = Buffer.from(res.data.content, 'base64').toString()
    const yml = yaml.safeLoad(buffer)
    const config = decodeConfiguration(yml)

    if (e.isLeft(config)) {
      return null
    }

    return config.right
  } catch (err) {
    return null
  }
}
