import { ApolloClient, InMemoryCache } from '@apollo/client/core'
import { HttpLink } from '@apollo/client/link/http'
import { setContext } from '@apollo/client/link/context'
import { useRuntimeConfig } from '#imports'

type PersistedAuthState = {
  token?: string | null
}

const AUTH_STORAGE_KEY = 'ecommerce-auth-state'
const clients = new Map<string, ApolloClient>()

const isLikelyJwt = (token: string): boolean => {
  if (!token || token.startsWith('mock-token-')) {
    return false
  }

  // Basic shape check. Backend JWTs should have 3 base64url segments.
  const segments = token.split('.')
  return segments.length === 3 && segments.every((segment) => segment.length > 0)
}

const getTokenFromStorage = (): string | null => {
  if (!import.meta.client) {
    return null
  }

  try {
    const rawValue = window.localStorage.getItem(AUTH_STORAGE_KEY)
    if (!rawValue) {
      return null
    }

    const parsed = JSON.parse(rawValue) as PersistedAuthState
    const token = parsed.token ?? null
    if (!token || !isLikelyJwt(token)) {
      return null
    }

    return token
  } catch {
    return null
  }
}

export const getApolloClient = (): ApolloClient => {
  const config = useRuntimeConfig()
  const uri = import.meta.server
    ? config.internalGraphqlApi
    : (config.public.graphqlApi || '/graphql')
  const cached = clients.get(uri)

  if (cached) {
    return cached
  }

  const httpLink = new HttpLink({ uri })
  const authLink = setContext((_, previousContext) => {
    const token = getTokenFromStorage()
    const headers = previousContext.headers ?? {}

    if (!token) {
      return { headers }
    }

    return {
      headers: {
        ...headers,
        authorization: `Bearer ${token}`,
      },
    }
  })

  const client = new ApolloClient({
    link: authLink.concat(httpLink),
    cache: new InMemoryCache(),
    defaultOptions: {
      query: {
        fetchPolicy: 'no-cache',
      },
      mutate: {
        fetchPolicy: 'no-cache',
      },
    },
  })

  clients.set(uri, client)
  return client
}
