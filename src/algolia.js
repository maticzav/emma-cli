import algoliasearch from 'algoliasearch'

export const algolia = {
   appId: 'OFCNCOG2CU',
   apiKey: 'f54e21fa3a2a0160595bb058179bfb1e',
   indexName: 'npm-search'
}

const client = algoliasearch(algolia.appId, algolia.apiKey).initIndex(algolia.indexName)

export const search = query => new Promise((resolve, reject) => {
   client.search(query, (err, res) => {
      if (err) {
         reject(err)
      } else {
         resolve(res)
      }
   })
})
