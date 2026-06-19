import { ApolloClient, InMemoryCache } from '@apollo/client/core'
import { HttpLink } from '@apollo/client/link/http'

// Real backend GraphQL endpoint. In dev, Vite proxies '/graphql' to the Spring API
// (see vite.config.ts), so this stays same-origin and needs no CORS.
const uri = (import.meta.env.VITE_ACTIVITY_API as string | undefined) ?? '/graphql'

export const activityClient = new ApolloClient({
  link: new HttpLink({ uri }),
  cache: new InMemoryCache(),
  defaultOptions: {
    mutate: {
      fetchPolicy: 'no-cache',
    },
  },
})
