import { gql } from '@apollo/client/core'

export const GET_CATEGORIES = gql`
  query GetCategories {
    categories {
      id
      name
      slug
      parentId
      children {
        id
        name
        slug
        parentId
      }
    }
  }
`

export const GET_PRODUCTS = gql`
  query GetProducts($filter: ProductFilterInput) {
    products(filter: $filter) {
      id
      title
      price
      imageUrl
      categoryId
      description
    }
  }
`
