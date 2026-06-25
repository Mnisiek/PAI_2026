import { gql } from '@apollo/client/core'
import login from './auth/login.graphql?raw'
import me from './auth/me.graphql?raw'

export const LOGIN_MUTATION = gql(login)
export const ME_QUERY = gql(me)
