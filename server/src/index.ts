import algoliasearch, {
  Index as AlgoliaIndex,
  Task as AlgoliaTask,
} from 'algoliasearch'
import * as e from 'fp-ts/lib/Either'
import * as t from 'io-ts'
import { PathReporter } from 'io-ts/lib/PathReporter'
import probot, { Octokit } from 'probot'

import { Photon, Starter, BatchPayload } from '@generated/photon'

/* Constants */

const EmmaConfigurationFilePath = 'emma.yml'

/* Webhooks */

module.exports = (app: probot.Application) => {
  /* Info */
  app.log.info('Emma server up 🚀')

  /* Prisma */

  const photon = new Photon({})

  /* Algolia */

  const algolia = algoliasearch(
    process.env.ALGOLIA_APP_ID!,
    process.env.ALGOLIA_API_KEY!,
  )

  const algoliaStartersIndexName = process.env.ALGOLIA_STARTERS_INDEX!
  const algoliaStartersIndex = algolia.initIndex(algoliaStartersIndexName)

  app.log.info(`Algolia starters index: ${algoliaStartersIndexName}`)

  /* API */

  const api = app.route('/api')

  api.get('/starter/:signiture/', async (req, res) => {
    const starter = await photon.starters.findOne({
      where: { signature: req.body.signature },
    })

    /* Process response */
    if (!starter) {
      res.sendStatus(404)
    } else {
      res.setHeader('Content-Type', 'application/json')
      res.send(
        JSON.stringify({
          ref: starter.ref,
          path: starter.path,
          owner: starter.owner,
          repo: starter.repo,
        }),
      )
    }
  })

  /* Events */

  app.on('push', async context => {
    const owner = context.payload.repository.owner.login
    const repo = context.payload.repository.name
    const ref = context.payload.ref
    const masterRef = `refs/heads/${context.payload.repository.default_branch}`

    /* Ignore changes on non-default ref. */
    if (masterRef !== ref) {
      context.log.info(`Ignoring ref: ${ref}. Default ref: ${masterRef}`)
      return
    }

    /* Load configuration. */
    const configFile = await context.config(EmmaConfigurationFilePath)
    const eConfig = decodeConfiguration(configFile)

    /* Terminate faulty configuration. */
    if (e.isLeft(eConfig)) {
      const report = PathReporter.report(eConfig)
      context.log.debug(
        { report, errors: eConfig.left },
        `Couldn't load configuration.`,
      )
      return
    }

    const config = eConfig.right

    context.log.debug({ config, owner, repo }, 'received configuration')

    try {
      /* Loads starters. */
      const starters = await Promise.all(
        config.starters.map<Promise<EmmaStarter>>(s =>
          loadStarter(context.github, { repo, owner, ref }, s),
        ),
      )

      /* Syncs starters with database. */
      const syncRes = await Promise.all(
        starters.map(starter =>
          saveStarter(photon, algoliaStartersIndex, starter),
        ),
      )

      context.log.debug({ res: syncRes, starters }, `Synced starters.`)

      const cleanRes = await cleanRepositoryStarters(
        photon,
        algoliaStartersIndex,
        { repo, owner },
        starters,
      )

      context.log.debug(
        { repo, owner, res: cleanRes },
        `Cleaned starters in the database.`,
      )
    } catch (err) {
      /* Log error on failure. */
      context.log.warn(err)
    }
  })
}

/* Helper functions. */

/* SCHEMA */

const EmmaStarterConfiguration = t.intersection([
  t.type({
    name: t.string,
    path: t.string,
  }),
  t.partial({
    description: t.string,
  }),
])

interface EmmaStarterConfiguration
  extends t.TypeOf<typeof EmmaStarterConfiguration> {}

const EmmaConfiguration = t.type({
  starters: t.array(EmmaStarterConfiguration),
})

interface EmmaConfiguration extends t.TypeOf<typeof EmmaConfiguration> {}

/**
 * Decodes configurations. Returns error message as a first parameter,
 * or null meaning that configuration is valid.
 *
 * @param config
 */
function decodeConfiguration(
  config: any,
): e.Either<t.Errors, EmmaConfiguration> {
  return EmmaConfiguration.decode(config)
}

/* LOADER */

interface EmmaStarter {
  /* Meta */
  repo: string
  owner: string
  /* Info */
  signature: string
  path: string
  ref: string
  /* Search */
  name: string
  description?: string
  dependencies: string[]
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
  config: EmmaStarterConfiguration,
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
        signature: `${owner}/${repo}:${config.name}`,
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
  photon: Photon,
  algolia: AlgoliaIndex,
  starter: EmmaStarter,
): Promise<[Starter, AlgoliaTask]> {
  /* Save to database. */
  const prismaRes = await photon.starters.upsert({
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

  const algoliaRes = await algolia.addObject({
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
async function cleanRepositoryStarters(
  photon: Photon,
  index: AlgoliaIndex,
  { repo, owner }: { repo: string; owner: string },
  starters: EmmaStarter[],
): Promise<[Starter[], AlgoliaTask, BatchPayload]> {
  const startersNames = starters.map(starter => starter.name)

  const dbStarters = await photon.starters.findMany({
    where: {
      repo: repo,
      owner: owner,
      name: { notIn: startersNames },
    },
  })

  const algoliaRes = await index.deleteObjects(
    dbStarters.map(starter => starter.signature),
  )

  const prismaRes = await photon.starters.deleteMany({
    where: {
      repo: repo,
      owner: owner,
      name: { notIn: startersNames },
    },
  })

  return [dbStarters, algoliaRes, prismaRes]
}

/* UTILS */

/**
 * Uses a default fallback value on undefined or null.
 *
 * @param fallback
 * @param value
 */
function withDefault<T>(fallback: T, value: T | undefined | null): T {
  if (value === null || value === undefined) return fallback
  else return value
}
