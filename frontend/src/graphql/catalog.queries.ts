import { gql } from '@apollo/client/core'
import getCategories from './catalog/getCategories.graphql?raw'
import getProducts from './catalog/getProducts.graphql?raw'
import getProduct from './catalog/getProduct.graphql?raw'
import getFacets from './catalog/getFacets.graphql?raw'

export const GET_CATEGORIES = gql(getCategories)
export const GET_PRODUCTS = gql(getProducts)
export const GET_PRODUCT = gql(getProduct)
export const GET_FACETS = gql(getFacets)
