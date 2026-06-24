import { ApolloClient, InMemoryCache, type NormalizedCacheObject } from '@apollo/client/core'
import { HttpLink } from '@apollo/client/link/http'
import { useRuntimeConfig } from '#imports'

const clients = new Map<string, ApolloClient<NormalizedCacheObject>>()

export const getActivityClient = (): ApolloClient<NormalizedCacheObject> => {
  const config = useRuntimeConfig()
  // SSR runs in Node where a relative `/graphql` can't be fetched, so use the
  // absolute internal URL on the server and the proxied path in the browser.
  const uri = import.meta.server
    ? config.activityApiInternal || 'http://localhost:8080/graphql'
    : config.public.activityApi || '/graphql'
  const cached = clients.get(uri)

  if (cached) {
    return cached
  }

  const client = new ApolloClient({
    link: new HttpLink({ uri }),
    cache: new InMemoryCache(),
    defaultOptions: {
      mutate: {
        fetchPolicy: 'no-cache',
      },
    },
  })

  clients.set(uri, client)
  return client
}
