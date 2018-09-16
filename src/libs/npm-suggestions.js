import { ApolloClient } from 'apollo-client';
import { InMemoryCache } from 'apollo-cache-inmemory';
import fetch from 'node-fetch';
import { HttpLink } from 'apollo-link-http';
import gql from 'graphql-tag';

const client = new ApolloClient({
  link: new HttpLink({
    uri: 'https://npm-suggestions.now.sh',
    fetch
  }),
  cache: new InMemoryCache()
});

export const suggestionsQuery = gql`
  query Suggestions($dependencies: [String!]!, $devDependencies: [String!]!) {
    suggestions(
      dependencies: $dependencies
      devDependencies: $devDependencies
    ) {
      suggestions {
        name
        description
        version
        owner {
          name
        }
        humanDownloadsLast30Days
        objectID
      }
      devSuggestions {
        name
        description
        version
        owner {
          name
        }
        humanDownloadsLast30Days
        objectID
      }
    }
  }
`;

export async function getSuggestions(dependencies, dev) {
  const res = await client.query({
    query: suggestionsQuery,
    variables: {
      dependencies: dev ? [] : dependencies,
      devDependencies: dev ? dependencies : []
    }
  });

  const hits = dev
    ? res.data.suggestions.devSuggestions
    : res.data.suggestions.suggestions;
  return hits;
}
