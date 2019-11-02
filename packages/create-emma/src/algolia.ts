import React from 'react'
import algoliasearch, { Response } from 'algoliasearch'

/* Config */

const algolia = {
  appId: 'M0TXMKQA8U',
  apiKey: 'a73f705885dd5341ab59e7a7c8e3d870',
}

const client = algoliasearch(algolia.appId, algolia.apiKey)
const startersIndex = client.initIndex('prod_STARTERS')

/* Client */

export interface IStarter {
  objectID: string
  owner: string
  repo: string
  name: string
  description?: string
  signature: string
  dependencies: IStarterDependency[]
}

export interface IStarterDependency {
  name: string
}

export interface IStarterDependencyFacet {
  value: string
  count: number
}

/**
 * Performs starters search based on provided dependencies.
 * @param dependencies
 */
export async function searchStarters(
  query: string,
  dependencies: IStarterDependency[],
  page: number = 0,
): Promise<Response<IStarter>> {
  const filters = dependencies
    .map(dependency => `dependencies:${dependency.name}`)
    .join(' AND ')

  return startersIndex.search<IStarter>({
    query: query,
    filters: filters,
    page: page,
    hitsPerPage: 10,
  })
}

/**
 *
 * Performs a facet search on starters' dependencies.
 *
 * @param query
 * @param dependencies
 */
export async function searchDependencies(
  query: string,
  dependencies: IStarterDependency[],
): Promise<IStarterDependencyFacet[]> {
  const filters = dependencies
    .map(dependency => `dependencies:${dependency.name}`)
    .join(' AND ')

  const res = await startersIndex.searchForFacetValues({
    facetName: 'dependencies',
    facetQuery: query,
    filters: filters,
  })

  return res.facetHits
}

/* Algolia Context */

export type WithSearchContext<X> = X & {
  starters: IStarter[]
  facets: IStarterDependencyFacet[]
}

export const SearchContext = React.createContext<{
  starters: IStarter[]
  facets: IStarterDependencyFacet[]
}>({ starters: [], facets: [] })
