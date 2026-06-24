import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client/core'
import { setContext } from '@apollo/client/link/context'

// SSR (Node.js) requires an absolute URL — relative URLs are invalid outside the browser.
// The browser uses /graphql which Nuxt's routeRules proxy forwards to the backend.
const uri = import.meta.server
  ? (process.env.NUXT_GRAPHQL_INTERNAL ?? 'http://localhost:8080/graphql')
  : '/graphql'

const httpLink = createHttpLink({ uri })

const authLink = setContext((_, { headers }) => {
  let token: string | null = null
  try {
    const rawAuth = window.localStorage.getItem('ecommerce-auth-state')
    if (rawAuth) {
      const parsed = JSON.parse(rawAuth)
      token = parsed.token
    }
  } catch (e) {
    // Ignore error
  }

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  }
})

export const apolloClient = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
  defaultOptions: {
    query: {
      fetchPolicy: 'no-cache',
    },
  },
})
