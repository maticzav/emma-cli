import { getSources, Sources } from '../../src/sources'

/**
 * Populates Sources with sources used for testing.
 */
export function getMockSources(): Sources {
  return getSources({
    algolia: {
      apiKey: 'apiKey',
      appId: 'appId',
      indices: {
        starters: 'dev_STARTERS',
      },
    },
    prisma: {
      url: 'postgresql://prisma:prisma@localhost:5432/prisma',
    },
  })
}
