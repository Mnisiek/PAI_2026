import { apolloClient } from './apolloClient'
import { GET_CATEGORIES, GET_PRODUCTS } from '../graphql/catalog.queries'
import type { CatalogFilterInput, Category, Product } from '../types/catalog'

interface CategoriesResponse {
  categories: Category[]
}

interface ProductsResponse {
  products: Product[]
}

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })

const randomLatency = (): number => 250 + Math.floor(Math.random() * 550)

export const catalogService = {
  async getCategories(): Promise<Category[]> {
    await sleep(randomLatency())

    const { data } = await apolloClient.query<CategoriesResponse>({
      query: GET_CATEGORIES,
    })

    if (!data) {
      throw new Error('Categories query returned no data.')
    }

    return data.categories
  },

  async getProducts(filter: CatalogFilterInput): Promise<Product[]> {
    await sleep(randomLatency())

    const { data } = await apolloClient.query<ProductsResponse, { filter: CatalogFilterInput }>({
      query: GET_PRODUCTS,
      variables: { filter },
    })

    if (!data) {
      throw new Error('Products query returned no data.')
    }

    return data.products
  },
}
