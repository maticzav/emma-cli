import test from 'ava';
import { search } from './dist/algolia';

test('Algolia search', async t => {
  const res = await search({
    query: 'graphql-shield',
    attributesToRetrieve: ['name'],
    attributesToHighlight: [],
    offset: 0,
    length: 1
  });

  t.is(res.hits[0].name, 'graphql-shield');
});
