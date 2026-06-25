import { getApolloClient } from '../apollo clients/apolloClient'
import {
  GET_CATEGORIES,
  GET_FACETS,
  GET_PRODUCT,
  GET_PRODUCTS,
  GET_RECENTLY_VIEWED,
  GET_RECOMMENDED,
} from '../graphql/catalog.queries'
import type { CarouselProduct, CatalogFilterInput, Category, Facet, Product } from '../types/catalog'
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

interface FacetsResponse {
  offersModule: {
    facets: Facet[]
  }
}

// Mirrors the backend `ProductFilter` GraphQL input.
interface GqlProductFilter {
  categorySlug?: string | null
  priceMin?: number | null
  priceMax?: number | null
  inStock?: boolean | null
  attributes?: { code: string; values?: string[] | null; min?: number | null; max?: number | null }[] | null
}

// Build the GraphQL ProductFilter from the store-facing filter, dropping empty
// parts so the query stays minimal. Returns null when nothing is constrained.
const buildProductFilter = (
  filter: CatalogFilterInput,
  categorySlug: string | null,
): GqlProductFilter | null => {
  const attributes = (filter.attributes ?? [])
    .map((attr) => ({
      code: attr.code,
      values: attr.values && attr.values.length > 0 ? attr.values : null,
      min: attr.min ?? null,
      max: attr.max ?? null,
    }))
    .filter((attr) => (attr.values && attr.values.length > 0) || attr.min != null || attr.max != null)

  const productFilter: GqlProductFilter = {}
  if (categorySlug) productFilter.categorySlug = categorySlug
  if (filter.priceMin != null) productFilter.priceMin = filter.priceMin
  if (filter.priceMax != null) productFilter.priceMax = filter.priceMax
  if (filter.inStock) productFilter.inStock = true
  if (attributes.length > 0) productFilter.attributes = attributes

  return Object.keys(productFilter).length > 0 ? productFilter : null
}

const resolveCategorySlug = (categoryId?: string | null): string | null => {
  if (!categoryId) return null
  try {
    const catalogStore = useCatalogStore()
    return catalogStore.categories.find((category) => category.id === categoryId)?.slug ?? null
  } catch {
    // Store not ready during initial load — fall back to no category.
    return null
  }
}

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

  async getProducts(filter: CatalogFilterInput): Promise<Product[]> {
    const client = getApolloClient()
    const categorySlug = resolveCategorySlug(filter.categoryId)
    const productFilter = buildProductFilter(filter, categorySlug)

    const { data } = await client.query<
      ProductsResponse,
      { search?: string | null; filter?: GqlProductFilter | null }
    >({
      query: GET_PRODUCTS,
      variables: {
        search: filter.search || null,
        filter: productFilter,
      },
      fetchPolicy: 'no-cache',
    })

    if (!data) {
      throw new Error('Products query returned no data.')
    }

    return data.offersModule.products.items.map(normalizeProduct)
  },

  async getFacets(categorySlug: string, search?: string): Promise<Facet[]> {
    const client = getApolloClient()

    const { data } = await client.query<
      FacetsResponse,
      { categorySlug: string; search?: string | null; filter?: GqlProductFilter | null }
    >({
      query: GET_FACETS,
      variables: {
        categorySlug,
        search: search || null,
        // Facets describe the category+search context, independent of the
        // attribute/price filters the user is currently applying.
        filter: null,
      },
      fetchPolicy: 'no-cache',
    })

    return data?.offersModule.facets ?? []
  },

  // Recommendation rails (require an authenticated bearer; call client-side only).
  async getRecentlyViewed(
    userId: string | null,
    sessionId: string | null,
    limit: number,
  ): Promise<CarouselProduct[]> {
    const client = getApolloClient()
    const { data } = await client.query<
      { offersModule: { recentlyViewedProducts: CarouselProduct[] } },
      { userId: string | null; sessionId: string | null; limit: number }
    >({
      query: GET_RECENTLY_VIEWED,
      variables: { userId, sessionId, limit },
      fetchPolicy: 'no-cache',
    })
    return data?.offersModule.recentlyViewedProducts ?? []
  },

  async getRecommended(
    userId: string | null,
    sessionId: string | null,
    limit: number,
  ): Promise<CarouselProduct[]> {
    const client = getApolloClient()
    const { data } = await client.query<
      { offersModule: { recommendedProducts: CarouselProduct[] } },
      { userId: string | null; sessionId: string | null; limit: number }
    >({
      query: GET_RECOMMENDED,
      variables: { userId, sessionId, limit },
      fetchPolicy: 'no-cache',
    })
    return data?.offersModule.recommendedProducts ?? []
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
