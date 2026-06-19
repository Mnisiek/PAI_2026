import { gql } from '@apollo/client/core'

export const GET_CATEGORIES = gql`
  query GetCategories {
    offersModule {
      rootCategories {
        id
        name
        slug
        children {
          id
          name
          slug
        }
      }
    }
  }
`

export const GET_PRODUCTS = gql`
  query GetProducts($search: String, $filter: ProductFilter) {
    offersModule {
      products(search: $search, filter: $filter, page: 0, size: 100) {
        items {
          id
          name
          description
          mainImageUrl
          priceFrom {
            amount
            currency
          }
          category {
            id
          }
        }
      }
    }
  }
`
