import { Photon } from '@prisma/photon'
import algoliasearch, { Index } from 'algoliasearch'

export interface Sources {
  algolia: {
    indices: {
      starters: Index
    }
  }
  prisma: {
    photon: Photon
    url: string
  }
  constants: {
    configurationFilePath: string
    configurationBranch: string
  }
}

export interface SourcesConfig {
  algolia: {
    appId: string
    apiKey: string
    indices: {
      starters: string
    }
  }
  prisma: {
    url: string
  }
}

/**
 * Initiates all the sources that the app will
 * grab and push data from and to.
 *
 * @param config
 */
export function getSources(config: SourcesConfig): Sources {
  /* Prisma */

  const photon = new Photon({})

  /* Algolia */

  const algolia = algoliasearch(config.algolia.appId, config.algolia.apiKey)

  /* Sources */

  return {
    algolia: {
      indices: {
        starters: algolia.initIndex(config.algolia.indices.starters),
      },
    },
    prisma: {
      photon,
      url: config.prisma.url,
    },
    constants: {
      configurationFilePath: 'emma.yml',
      configurationBranch: 'emma/configuration',
    },
  }
}

// /**
//  * Wraps a function insides sources provider.
//  *
//  * @param fn
//  */
// export function withSources<T, A extends Array<T>>(
//   fn: (s: Sources, ...args: A) => T,
// ): (sources: Sources) => (...args: A) => T {
//   return sources => (...args) => fn(sources, ...args)
// }
