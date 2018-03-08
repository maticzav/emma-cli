import algoliasearch from 'algoliasearch'

export const algolia = {
   appId: 'OFCNCOG2CU',
   apiKey: '6fe4476ee5a1832882e326b506d14126',
   indexName: 'npm-search'
}

const client = algoliasearch(algolia.appId, algolia.apiKey).initIndex(algolia.indexName)

export const search = query => client.search({ query })
