import { gql } from '@apollo/client/core'
import addCategory from './catalog/addCategory.graphql?raw'
import addProduct from './catalog/addProduct.graphql?raw'
import addOffer from './catalog/addOffer.graphql?raw'

export const ADD_CATEGORY_MUTATION = gql(addCategory)
export const ADD_PRODUCT_MUTATION = gql(addProduct)
export const ADD_OFFER_MUTATION = gql(addOffer)
