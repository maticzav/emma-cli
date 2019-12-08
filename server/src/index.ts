import probot from 'probot'

import { orderBy } from 'lodash'

import { downloadStarter } from './endpoints/starters/download'

import { syncRepository } from './events/sync/repository'

import { getSources } from './sources'
import { fetchRepos } from './github'
import { discoverStarters } from './events/discover/starters'

/* Webhooks */

module.exports = (app: probot.Application) => {
  /* Info */
  app.log.info('Emma server up 🚀')

  const sources = getSources({
    algolia: {
      appId: process.env.ALGOLIA_APP_ID!,
      apiKey: process.env.ALGOLIA_API_KEY!,
      indices: {
        starters: process.env.ALGOLIA_STARTERS_INDEX!,
      },
    },
    prisma: {
      url: process.env.PHOTON_POSTGRESQL_URL!,
    },
  })

  app.log.info('Sources ready...')

  /* API */

  const api = app.route('/api')

  api.get('/starters/:signature/', downloadStarter(sources))

  /* Events */

  app.on('push', syncRepository(sources))

  app.on('installation_repositories.added', async ctx => {
    const repos = await fetchRepos(
      ctx.github,
      ctx.payload.repositories_added,
    ).then(repos =>
      /* Prevent flooding */
      orderBy(
        repos.filter(repo => repo.stargazers_count >= 100),
        'stargazers_count',
        'desc',
      ).slice(0, 2),
    )

    for (const repo of repos) {
      await discoverStarters(sources)(
        ctx,
        repo.owner.login,
        repo.name,
        repo.default_branch,
      )
    }
  })
}
