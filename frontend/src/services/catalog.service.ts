import { getApolloClient } from '../apollo clients/apolloClient'
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

const asId = (value: unknown): string | null => {
  if (value === null || value === undefined) {
    return null
  }
  return String(value)
}

const normalizeCategory = (category: Category): Category => ({
  ...category,
  id: asId(category.id) ?? '',
  parentId: asId(category.parentId),
  children: category.children?.map(normalizeCategory),
})

const normalizeProduct = (product: Product): Product => ({
  ...product,
  id: asId(product.id) ?? '',
  category: normalizeCategory(product.category),
  offers: product.offers.map((offer) => ({
    ...offer,
    id: asId(offer.id) ?? '',
  })),
})

// Flatten the full rootCategories tree into a flat (parentId-based) list.
const flattenCategories = (roots: Category[]): Category[] => {
  const flattened: Category[] = []

  const visit = (node: Category): void => {
    const normalizedNode = normalizeCategory(node)
    flattened.push(normalizedNode)

    for (const child of normalizedNode.children ?? []) {
      visit(child)
    }
  }

  for (const root of roots) {
    visit(root)
  }

  return flattened
}

export const catalogService = {
  async getCategories(): Promise<Category[]> {
    const client = getApolloClient()
    

    const { data } = await client.query<CategoriesResponse>({
      query: GET_CATEGORIES,
    })

    if (!data) {
      throw new Error('Categories query returned no data.')
    }

    return flattenCategories(data.offersModule.rootCategories)
  },

  async getProducts(filter: any): Promise<any[]> {
    const client = getApolloClient()
    await sleep(randomLatency())
    
      let categorySlug = undefined;

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

    

    const { data } = await client.query<ProductsResponse, { search?: string | null; filter?: { categorySlug?: string | null } | null }>({
      query: GET_PRODUCTS,
      variables: { filter: { categorySlug: filter.categoryId ? categorySlug : undefined } },
    })

    if (!data) {
      throw new Error('Products query returned no data.')
    }

    return data.offersModule.products.items.map(normalizeProduct)
  },

  async getProductBySlug(slug: string): Promise<Product | null> {
    const client = getApolloClient()
    

    const { data } = await client.query<ProductResponse, { slug: string }>({
      query: GET_PRODUCT,
      variables: { slug },
    })

    if (!data) {
      throw new Error('Product query returned no data.')
    }

    return data.offersModule.product ? normalizeProduct(data.offersModule.product) : null
  },
}
