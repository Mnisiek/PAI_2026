import { apolloClient } from './apolloClient'
import { LOGIN_MUTATION } from '../graphql/auth.queries'
import type { AuthPayload, LoginInput } from '../types/auth'

interface LoginResponse {
  login: AuthPayload
}

export const authService = {
  async login(input: LoginInput): Promise<AuthPayload> {
    const { data } = await apolloClient.mutate<LoginResponse, { input: LoginInput }>({
      mutation: LOGIN_MUTATION,
      variables: { input },
    })

    if (!data) {
      throw new Error('Login mutation returned no data.')
    }

    return data.login
  },
}
