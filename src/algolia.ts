import algoliasearch from 'algoliasearch'

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
  name: string
  version: string
  description: string
  owner: string
  humanDownloadsLast30Days: string
}

/**
 *
 * Performs a search for the specified query and returns information
 * displayed in the UI.
 *
 * @param query
 * @param limit
 */
export const getSearch = async (
  query: string,
  limit?: number,
): Promise<IPackage[]> => {
  const { hits } = await client.search<IPackage>({
    query,
    attributesToRetrieve: [
      'name',
      'version',
      'description',
      'owner',
      'humanDownloadsLast30Days',
    ],
    offset: 0,
    length: limit,
  })

  return hits
}
