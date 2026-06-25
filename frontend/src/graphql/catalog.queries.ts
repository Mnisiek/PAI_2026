import { gql } from '@apollo/client/core'
import getCategories from './catalog/getCategories.graphql?raw'
import getProducts from './catalog/getProducts.graphql?raw'
import getProduct from './catalog/getProduct.graphql?raw'
import getFacets from './catalog/getFacets.graphql?raw'
import getRecentlyViewed from './catalog/getRecentlyViewed.graphql?raw'
import getRecommended from './catalog/getRecommended.graphql?raw'
import getRecommendedCategories from './catalog/getRecommendedCategories.graphql?raw'

export const GET_CATEGORIES = gql(getCategories)
export const GET_PRODUCTS = gql(getProducts)
export const GET_PRODUCT = gql(getProduct)
export const GET_FACETS = gql(getFacets)
export const GET_RECENTLY_VIEWED = gql(getRecentlyViewed)
export const GET_RECOMMENDED = gql(getRecommended)
export const GET_RECOMMENDED_CATEGORIES = gql(getRecommendedCategories)
