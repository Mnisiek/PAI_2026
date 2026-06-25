import { getApolloClient } from '../apollo clients/apolloClient'
import { LOGIN_MUTATION, ME_QUERY } from '../graphql/auth.queries'
import type { AuthPayload, LoginInput, User } from '../types/auth'

interface LoginResponse {
  login: AuthPayload
}

interface MeResponse {
  me: User | null
}

export const authService = {
  async login(input: LoginInput): Promise<AuthPayload> {
    const client = getApolloClient()

    const { data } = await client.mutate<LoginResponse, { input: LoginInput }>({
      mutation: LOGIN_MUTATION,
      variables: { input },
    })

    if (!data) {
      throw new Error('Login mutation returned no data.')
    }

    return data.login
  },

  // Resolves the current user from the bearer token (null if not authenticated).
  async me(): Promise<User | null> {
    const client = getApolloClient()

    const { data } = await client.query<MeResponse>({
      query: ME_QUERY,
      fetchPolicy: 'no-cache',
    })

    return data?.me ?? null
  },
}
