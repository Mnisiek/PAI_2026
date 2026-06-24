import { getApolloClient } from '../apollo clients/apolloClient'
import { LOGIN_MUTATION } from '../graphql/auth.queries'
import type { AuthPayload, LoginInput } from '../types/auth'

interface LoginResponse {
  login: AuthPayload
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
}
