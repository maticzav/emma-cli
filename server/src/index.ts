import probot from 'probot'

import { starter } from './endpoints/starters/'

import { syncRepository } from './events/sync/repository'

import { getSources } from './sources'

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

  api.get('/starters/:signature/', starter(sources))

  /* Events */

  app.on('push', syncRepository(sources))
}
