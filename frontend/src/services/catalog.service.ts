import { apolloClient } from './apolloClient'
import { GET_CATEGORIES, GET_PRODUCT, GET_PRODUCTS } from '../graphql/catalog.queries'
import type { CatalogFilterInput, Category, Product } from '../types/catalog'
import { useCatalogStore } from '../stores/catalog.store'

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

// Flatten the rootCategories tree into the flat (parentId-based) list the store expects.
const flattenCategories = (roots: Category[]): Category[] =>
  roots.flatMap((root) => [root, ...(root.children ?? [])])

export const catalogService = {
  async getCategories(): Promise<Category[]> {
    const { data } = await apolloClient.query<CategoriesResponse>({
      query: GET_CATEGORIES,
    })

    if (!data) {
      throw new Error('Categories query returned no data.')
    }

    return flattenCategories(data.offersModule.rootCategories)
  },

  async getProducts(filter: CatalogFilterInput): Promise<Product[]> {
    let categorySlug: string | null = null

    if (filter.categoryId) {
      try {
        const catalogStore = useCatalogStore()
        const found = catalogStore.categories.find((c) => c.id === filter.categoryId)
        if (found) {
          categorySlug = found.slug
        }
      } catch (e) {
        // Ignore store lookup error during initial loading if store is not fully initialized
      }
    }

    const { data } = await apolloClient.query<ProductsResponse, { search?: string | null; filter?: { categorySlug?: string | null } | null }>({
      query: GET_PRODUCTS,
      variables: {
        search: filter.search || null,
        filter: categorySlug ? { categorySlug } : null,
      },
    })

    if (!data) {
      throw new Error('Products query returned no data.')
    }

    return data.offersModule.products.items
  },

  async getProductBySlug(slug: string): Promise<Product | null> {
    const { data } = await apolloClient.query<ProductResponse, { slug: string }>({
      query: GET_PRODUCT,
      variables: { slug },
    })

    if (!data) {
      throw new Error('Product query returned no data.')
    }

    return data.offersModule.product
  },
}
