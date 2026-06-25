import { getApolloClient } from '../apollo clients/apolloClient'
import { LOGIN_MUTATION, ME_QUERY, REGISTER_MUTATION } from '../graphql/auth.queries'
import type { AuthPayload, LoginInput, RegisterInput, User } from '../types/auth'

interface LoginResponse {
  login: AuthPayload | null
}

interface RegisterResponse {
  register: AuthPayload | null
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

    if (!data.login) {
      throw new Error('Login mutation returned no payload.')
    }

    return data.login
  },

  async register(input: RegisterInput): Promise<AuthPayload> {
    const client = getApolloClient()

    const { data } = await client.mutate<RegisterResponse, { input: RegisterInput }>({
      mutation: REGISTER_MUTATION,
      variables: { input },
    })

    if (!data) {
      throw new Error('Register mutation returned no data.')
    }

    if (!data.register) {
      throw new Error('Register mutation returned no payload.')
    }

    return data.register
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
