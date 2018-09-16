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
  query Suggestions(
    $dependencies: [String!]!
    $devDependencies: [String!]!
    $limit: Int
  ) {
    suggestions(
      dependencies: $dependencies
      devDependencies: $devDependencies
      limit: $limit
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
    }
  }
`;

export const devSuggestionsQuery = gql`
  query Suggestions(
    $dependencies: [String!]!
    $devDependencies: [String!]!
    $limit: Int
  ) {
    suggestions(
      dependencies: $dependencies
      devDependencies: $devDependencies
      limit: $limit
    ) {
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

export async function getSuggestions(dependencies, limit, dev) {
  const res = await client.query({
    query: dev ? devSuggestionsQuery : suggestionsQuery,
    variables: {
      dependencies: dev ? [] : dependencies,
      devDependencies: dev ? dependencies : [],
      limit
    }
  });

  const hits = dev
    ? res.data.suggestions.devSuggestions
    : res.data.suggestions.suggestions;
  return hits;
}
