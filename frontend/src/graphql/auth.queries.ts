import { gql } from '@apollo/client/core'
import login from './auth/login.graphql?raw'
import me from './auth/me.graphql?raw'
import register from './auth/register.graphql?raw'

export const LOGIN_MUTATION = gql(login)
export const REGISTER_MUTATION = gql(register)
export const ME_QUERY = gql(me)
