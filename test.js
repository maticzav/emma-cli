import test from 'ava'
import { getSearch } from './dist/libs/algoliaSearch'

test('Algolia search', async t => {
  const hits = await getSearch('graphql-shield')

  t.is(hits[0].name, 'graphql-shield')
})
