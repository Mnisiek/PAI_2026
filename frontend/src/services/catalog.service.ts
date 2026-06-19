import { apolloClient } from './apolloClient'
import { GET_CATEGORIES, GET_PRODUCTS } from '../graphql/catalog.queries'
import type { CatalogFilterInput, Category, Product } from '../types/catalog'
import { useCatalogStore } from '../stores/catalog.store'

interface RootCategoryResponse {
  id: string
  name: string
  slug: string
  children: Array<{
    id: string
    name: string
    slug: string
  }>
}

interface CategoriesResponse {
  offersModule: {
    rootCategories: RootCategoryResponse[]
  }
}

interface ProductsResponse {
  offersModule: {
    products: {
      items: Array<{
        id: string
        name: string
        description: string
        mainImageUrl: string
        priceFrom?: {
          amount: number
          currency: string
        }
        category: {
          id: string
        }
      }>
    }
  }
}

export const catalogService = {
  async getCategories(): Promise<Category[]> {
    const { data } = await apolloClient.query<CategoriesResponse>({
      query: GET_CATEGORIES,
    })

    if (!data || !data.offersModule || !data.offersModule.rootCategories) {
      throw new Error('Categories query returned no data.')
    }

    const flatCategories: Category[] = []
    for (const root of data.offersModule.rootCategories) {
      flatCategories.push({
        id: root.id,
        name: root.name,
        slug: root.slug,
        parentId: null,
      })
      if (root.children) {
        for (const child of root.children) {
          flatCategories.push({
            id: child.id,
            name: child.name,
            slug: child.slug,
            parentId: root.id,
          })
        }
      }
    }

    return flatCategories;
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

    const backendFilter = {
      categorySlug: categorySlug,
    }

    const { data } = await apolloClient.query<ProductsResponse, { search?: string; filter?: any }>({
      query: GET_PRODUCTS,
      variables: {
        search: filter.search || null,
        filter: categorySlug ? backendFilter : null,
      },
    })

    if (!data || !data.offersModule || !data.offersModule.products) {
      throw new Error('Products query returned no data.')
    }

    return data.offersModule.products.items.map((item) => ({
      id: item.id,
      title: item.name,
      description: item.description || '',
      imageUrl: item.mainImageUrl || '',
      price: item.priceFrom ? item.priceFrom.amount : 0.0,
      categoryId: item.category ? item.category.id : '',
    }))
  },
}
