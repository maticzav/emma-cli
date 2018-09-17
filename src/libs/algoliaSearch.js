import algoliasearch from 'algoliasearch'

const algolia = {
  appId: 'OFCNCOG2CU',
  apiKey: '6fe4476ee5a1832882e326b506d14126',
  indexName: 'npm-search',
}

const client = algoliasearch(algolia.appId, algolia.apiKey).initIndex(
  algolia.indexName,
)

export const getSearch = async (query, limit) => {
  const res = await client.search({
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

  const hits = res.hits
  return hits
}
