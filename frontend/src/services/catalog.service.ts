import { apolloClient } from '../apollo clients/apolloClient'
import { GET_CATEGORIES, GET_PRODUCT, GET_PRODUCTS } from '../graphql/catalog.queries'
import type { CatalogFilterInput, Category, Product } from '../types/catalog'

interface CategoriesResponse {
  offersModule: {
    rootCategories: Category[]
  }
}

interface ProductsResponse {
  offersModule: {
    products: {
      items: Product[]
    }
  }
}

interface ProductResponse {
  offersModule: {
    product: Product | null
  }
}

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms)
  })

const randomLatency = (): number => 250 + Math.floor(Math.random() * 550)

// Flatten the rootCategories tree into the flat (parentId-based) list the store expects.
const flattenCategories = (roots: Category[]): Category[] =>
  roots.flatMap((root) => [root, ...(root.children ?? [])])

export const catalogService = {
  async getCategories(): Promise<Category[]> {
    await sleep(randomLatency())
    const client = getApolloClient()

    const { data } = await client.query<CategoriesResponse>({
      query: GET_CATEGORIES,
    })

    if (!data) {
      throw new Error('Categories query returned no data.')
    }

    return flattenCategories(data.offersModule.rootCategories)
  },

  async getProducts(filter: CatalogFilterInput): Promise<Product[]> {
    await sleep(randomLatency())
    const client = getApolloClient()

    const { data } = await client.query<ProductsResponse, { filter: CatalogFilterInput }>({
      query: GET_PRODUCTS,
      variables: { filter },
    })

    if (!data) {
      throw new Error('Products query returned no data.')
    }

    return data.offersModule.products.items
  },

  async getProductBySlug(slug: string): Promise<Product | null> {
    await sleep(randomLatency())
    const client = getApolloClient()

    const { data } = await client.query<ProductResponse, { slug: string }>({
      query: GET_PRODUCT,
      variables: { slug },
    })

    if (!data) {
      throw new Error('Product query returned no data.')
    }

    return data.offersModule.product
  },
}
