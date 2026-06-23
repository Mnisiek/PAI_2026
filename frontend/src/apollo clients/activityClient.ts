import { ApolloClient, InMemoryCache } from '@apollo/client/core'
import { HttpLink } from '@apollo/client/link/http'
import { useRuntimeConfig } from '#imports'

const clients = new Map<string, ApolloClient>()

export const getActivityClient = (): ApolloClient => {
  const config = useRuntimeConfig()
  const uri = import.meta.server
    ? config.internalGraphqlApi
    : (config.public.activityApi || '/graphql')
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
