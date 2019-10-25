import React from 'react'
import algoliasearch, { Response } from 'algoliasearch'

/* Config */

const algolia = {
  appId: 'OFCNCOG2CU',
  apiKey: '6fe4476ee5a1832882e326b506d14126',
  indexName: 'npm-search',
}

const client = algoliasearch(algolia.appId, algolia.apiKey).initIndex(
  algolia.indexName,
)

/* Client */

export interface IPackage {
  objectID: string
  name: string
  version: string
  description: string
  repository?: IPackageRepository
  owner: IPackageOwner
  humanDownloadsLast30Days: string
}

export interface IPackageRepository {
  url: string
}

export interface IPackageOwner {
  name: string
  email?: string
  avatar: string
  link: string
}

/**
 *
 * Performs a search for the specified query and returns information
 * displayed in the UI.
 *
 * @param query
 * @param limit
 */
export const search = async (
  query: string,
  page: number = 0,
): Promise<Response<IPackage>> => {
  const res = await client.search<IPackage>({
    query,
    attributesToRetrieve: [
      'name',
      'version',
      'description',
      'owner',
      'repository',
      'humanDownloadsLast30Days',
    ],
    page: page,
    hitsPerPage: 10,
  })

  return res
}

/* Algolia Context */

export type WithSearchContext<X> = X & { hits: IPackage[] }

export const SearchContext = React.createContext<IPackage[]>([])
