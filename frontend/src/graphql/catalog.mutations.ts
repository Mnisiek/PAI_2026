import { gql } from '@apollo/client/core'
import addCategory from './catalog/addCategory.graphql?raw'
import addProduct from './catalog/addProduct.graphql?raw'
import addOffer from './catalog/addOffer.graphql?raw'
import updateCategory from './catalog/updateCategory.graphql?raw'
import updateProduct from './catalog/updateProduct.graphql?raw'

export const ADD_CATEGORY_MUTATION = gql(addCategory)
export const ADD_PRODUCT_MUTATION = gql(addProduct)
export const ADD_OFFER_MUTATION = gql(addOffer)
export const UPDATE_CATEGORY_MUTATION = gql(updateCategory)
export const UPDATE_PRODUCT_MUTATION = gql(updateProduct)
