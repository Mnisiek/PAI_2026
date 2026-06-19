import { gql } from '@apollo/client/core'
import login from './auth/login.graphql?raw'

export const LOGIN_MUTATION = gql(login)
