import { Starter, BatchPayload } from '@prisma/photon'
import { Task } from 'algoliasearch'
import * as e from 'fp-ts/lib/Either'
import { PathReporter } from 'io-ts/lib/PathReporter'
import hash from 'object-hash'
import { Context, Octokit } from 'probot'

import { StarterConfiguration, decodeConfiguration } from '../../configuration'
import { EmmaStarter } from '../../models'
import { Sources } from '../../sources'

/**
 * Performs a repository sync.
 *
 * @param sources
 */
export const syncRepository = (sources: Sources) => async (ctx: Context) => {
  const owner = ctx.payload.repository.owner.login
  const repo = ctx.payload.repository.name
  const ref = ctx.payload.ref
  const masterRef = `refs/heads/${ctx.payload.repository.default_branch}`

  /* Ignore changes on non-default ref. */
  if (masterRef !== ref) {
    ctx.log.info(`Ignoring ref: ${ref}. Default ref: ${masterRef}`)
    return
  }

  /* Load configuration. */
  const configFile = await ctx.config(sources.constants.configurationFile)
  const eConfig = decodeConfiguration(configFile)

  /* Terminate faulty configuration. */
  if (e.isLeft(eConfig)) {
    const report = PathReporter.report(eConfig)
    ctx.log.debug(
      { report, errors: eConfig.left },
      `Couldn't load configuration.`,
    )
    return
  }

  const config = eConfig.right

  ctx.log.debug({ config, owner, repo }, 'received configuration')

  try {
    /* Loads starters. */
    const starters = await Promise.all(
      config.starters.map<Promise<EmmaStarter>>(sc =>
        loadStarter(ctx.github, { repo, owner, ref }, sc),
      ),
    )

    /* Syncs starters with database. */
    const saveRes = await Promise.all(
      starters.map(starter => saveStarter(sources, starter)),
    )
    const cleanRes = await cleanStarters(sources, { repo, owner }, starters)

    ctx.log.debug({ repo, owner, saveRes, cleanRes }, `Synced Repository`)
  } catch (err) {
    /* Log error on failure. */
    ctx.log.warn(err)
  }
}

/**
 * Loads a starter information from Github.
 *
 * @param github
 * @param param
 * @param config
 */
async function loadStarter(
  github: Octokit,
  { repo, owner, ref }: { repo: string; owner: string; ref: string },
  config: StarterConfiguration,
): Promise<EmmaStarter> {
  /* Attempt to laod configuration. */
  const res = await github.repos.getContents({
    owner: owner,
    repo: repo,
    ref: ref,
    path: `${config.path}/package.json`,
  })

  switch (res.status) {
    case 200: {
      /* Make sure response is a file. */
      if (Array.isArray(res.data) || !res.data.content) {
        throw new Error(
          `Expected a file at ${config.path} received ${typeof res.data}`,
        )
      }

      const buffer = Buffer.from(res.data.content, 'base64').toString()
      const pkg = JSON.parse(buffer)

      /* Make sure response includes all parameters. */
      if (!pkg.name || !pkg.dependencies) {
        throw new Error(`Missing a starter name or dependencies.`)
      }

      return {
        /* Meta */
        repo: repo,
        owner: owner,
        /* Info */
        signature: hash({ owner, repo, name: config.name, ref: ref }),
        path: config.path,
        ref: ref,
        /* Search */
        name: config.name,
        description: withDefault(pkg.description, config.description),
        dependencies: Object.keys(pkg.dependencies),
      }
    }
    default: {
      /* Process the error. */
      throw new Error(
        `[${res.status}] Couldn't load package.json at ${config.path}.`,
      )
    }
  }
}

/* PRISMA */

/**
 * Writes a starter to database.
 *
 * @param photon
 * @param starter
 */
async function saveStarter(
  { prisma, algolia }: Sources,
  starter: EmmaStarter,
): Promise<[Starter, Task]> {
  /* Save to database. */
  const prismaRes = await prisma.photon.starters.upsert({
    where: { signature: starter.signature },
    create: {
      signature: starter.signature,
      repo: starter.repo,
      owner: starter.owner,
      path: starter.path,
      ref: starter.ref,
      name: starter.name,
      description: starter.description,
      dependencies: { set: starter.dependencies },
    },
    update: {
      repo: starter.repo,
      owner: starter.owner,
      path: starter.path,
      ref: starter.ref,
      name: starter.name,
      description: starter.description,
      dependencies: { set: starter.dependencies },
    },
  })

  const algoliaRes = await algolia.indices.starters.addObject({
    objectID: starter.signature,
    owner: starter.owner,
    repo: starter.repo,
    name: starter.name,
    description: starter.description,
    downloads: 0,
    dependencies: starter.dependencies,
  })

  return [prismaRes, algoliaRes]
}

/**
 * Deletes legacy starters from the database.
 *
 * @param starters
 */
async function cleanStarters(
  { prisma, algolia }: Sources,
  { repo, owner }: { repo: string; owner: string },
  starters: EmmaStarter[],
): Promise<[Starter[], Task, BatchPayload]> {
  const startersNames = starters.map(starter => starter.name)

  const dbStarters = await prisma.photon.starters.findMany({
    where: {
      repo: repo,
      owner: owner,
      name: { notIn: startersNames },
    },
  })

  const algoliaRes = await algolia.indices.starters.deleteObjects(
    dbStarters.map(starter => starter.signature),
  )

  const prismaRes = await prisma.photon.starters.deleteMany({
    where: {
      repo: repo,
      owner: owner,
      name: { notIn: startersNames },
    },
  })

  return [dbStarters, algoliaRes, prismaRes]
}
