import { defineStore } from 'pinia'
import { catalogService } from '../services/catalog.service'
import { activityService } from '../services/activity.service'
import type { CatalogFilterInput, Category, Facet, Product } from '../types/catalog'

// Per-attribute selection: chosen values (TEXT/BOOL) or a numeric range (NUMBER).
interface AttributeSelection {
  values?: string[]
  min?: number | null
  max?: number | null
}

interface CatalogState {
  categories: Category[]
  products: Product[]
  facets: Facet[]
  attributeFilters: Record<string, AttributeSelection>
  priceMin: number | null
  priceMax: number | null
  inStock: boolean
  isLoading: boolean
  error: string | null
  searchQuery: string
  selectedCategoryPathIds: string[]
  initialized: boolean
  requestToken: number
}

const defaultErrorMessage = 'Nie udało się pobrać danych. Spróbuj ponownie za chwilę.'

const errorToMessage = (error: unknown): string => {
  if (error instanceof Error && error.message) {
    return error.message
  }

  return defaultErrorMessage
}

export const useCatalogStore = defineStore('catalog', {
  state: (): CatalogState => ({
    categories: [],
    products: [],
    facets: [],
    attributeFilters: {},
    priceMin: null,
    priceMax: null,
    inStock: false,
    isLoading: false,
    error: null,
    searchQuery: '',
    selectedCategoryPathIds: [],
    initialized: false,
    requestToken: 0,
  }),

  getters: {
    hasFilters: (state): boolean =>
      Boolean(
        state.searchQuery ||
          state.selectedCategoryPathIds.length > 0 ||
          state.priceMin != null ||
          state.priceMax != null ||
          state.inStock ||
          Object.keys(state.attributeFilters).length > 0,
      ),
    hasActiveFacetFilters: (state): boolean =>
      Boolean(
        state.priceMin != null ||
          state.priceMax != null ||
          state.inStock ||
          Object.keys(state.attributeFilters).length > 0,
      ),
    selectedCategoryId: (state): string | null =>
      state.selectedCategoryPathIds[state.selectedCategoryPathIds.length - 1] ?? null,
    selectedCategorySlug: (state): string | null => {
      const id = state.selectedCategoryPathIds[state.selectedCategoryPathIds.length - 1] ?? null
      if (!id) return null
      return state.categories.find((category) => category.id === id)?.slug ?? null
    },
    categoryPath: (state): Category[] => {
      const byId = new Map(state.categories.map((category) => [category.id, category]))

      return state.selectedCategoryPathIds
        .map((categoryId) => byId.get(categoryId))
        .filter((category): category is Category => Boolean(category))
    },
    activeSubcategories: (state): Category[] => {
      const selectedCategoryId = state.selectedCategoryPathIds[state.selectedCategoryPathIds.length - 1] ?? null
      return state.categories.filter((category) => category.parentId === selectedCategoryId)
    },
    canGoUp: (state): boolean => state.selectedCategoryPathIds.length > 0,
  },

  actions: {
    // Assemble the store-facing filter the catalog service expects.
    buildFilterInput(): CatalogFilterInput {
      return {
        search: this.searchQuery,
        categoryId: this.selectedCategoryId,
        priceMin: this.priceMin,
        priceMax: this.priceMax,
        inStock: this.inStock,
        attributes: Object.entries(this.attributeFilters).map(([code, selection]) => ({
          code,
          values: selection.values ?? null,
          min: selection.min ?? null,
          max: selection.max ?? null,
        })),
      }
    },

    // Drop facet-driven filters (price/stock/attributes); keep search + category.
    resetFacetFilters(): void {
      this.attributeFilters = {}
      this.priceMin = null
      this.priceMax = null
      this.inStock = false
    },

    async loadInitialData(): Promise<void> {
      if (this.initialized) {
        return
      }

      this.error = null
      this.isLoading = true

      try {
        const [categories, products] = await Promise.all([
          catalogService.getCategories(),
          catalogService.getProducts(this.buildFilterInput()),
        ])

        this.categories = categories
        this.products = products
        this.initialized = true
      } catch (error) {
        this.error = errorToMessage(error)
      } finally {
        this.isLoading = false
      }

      await this.loadFacets()
    },

    async refreshProducts(): Promise<void> {
      const currentRequestToken = ++this.requestToken
      this.error = null
      this.isLoading = true

      try {
        const products = await catalogService.getProducts(this.buildFilterInput())

        if (currentRequestToken !== this.requestToken) {
          return
        }

        this.products = products
      } catch (error) {
        if (currentRequestToken !== this.requestToken) {
          return
        }

        this.error = errorToMessage(error)
      } finally {
        if (currentRequestToken === this.requestToken) {
          this.isLoading = false
        }
      }
    },

    // Facets describe the current category (+ search). Empty unless a leaf is selected.
    async loadFacets(): Promise<void> {
      const slug = this.selectedCategorySlug
      if (!slug) {
        this.facets = []
        return
      }

      try {
        this.facets = await catalogService.getFacets(slug, this.searchQuery)
      } catch {
        this.facets = []
      }
    },

    async setSearchQuery(query: string): Promise<void> {
      this.searchQuery = query
      activityService.trackSearch(query)
      await Promise.all([this.refreshProducts(), this.loadFacets()])
    },

    async setCategory(categoryId: string | null): Promise<void> {
      // Filters and facets are category-specific, so reset them on navigation.
      this.resetFacetFilters()

      if (!categoryId) {
        this.selectedCategoryPathIds = []
      } else {
        const byId = new Map(this.categories.map((category) => [category.id, category]))
        const path: string[] = []

        let current = byId.get(categoryId) ?? null
        while (current) {
          path.push(current.id)
          current = current.parentId ? byId.get(current.parentId) ?? null : null
        }

        this.selectedCategoryPathIds = path.reverse()
      }

      await Promise.all([this.refreshProducts(), this.loadFacets()])
    },

    async goToPathIndex(index: number): Promise<void> {
      this.resetFacetFilters()
      this.selectedCategoryPathIds =
        index < 0 ? [] : this.selectedCategoryPathIds.slice(0, index + 1)
      await Promise.all([this.refreshProducts(), this.loadFacets()])
    },

    async goUpCategory(): Promise<void> {
      if (this.selectedCategoryPathIds.length === 0) {
        return
      }

      this.resetFacetFilters()
      this.selectedCategoryPathIds = this.selectedCategoryPathIds.slice(0, -1)
      await Promise.all([this.refreshProducts(), this.loadFacets()])
    },

    // --- Facet filter actions (refresh products, but leave the facet list stable) ---

    async setAttributeValues(code: string, values: string[]): Promise<void> {
      if (values.length === 0) {
        delete this.attributeFilters[code]
      } else {
        this.attributeFilters[code] = { ...this.attributeFilters[code], values }
      }
      await this.refreshProducts()
    },

    async setAttributeRange(code: string, min: number | null, max: number | null): Promise<void> {
      if (min == null && max == null) {
        delete this.attributeFilters[code]
      } else {
        this.attributeFilters[code] = { ...this.attributeFilters[code], min, max }
      }
      await this.refreshProducts()
    },

    async setPriceRange(min: number | null, max: number | null): Promise<void> {
      this.priceMin = min
      this.priceMax = max
      await this.refreshProducts()
    },

    async setInStock(value: boolean): Promise<void> {
      this.inStock = value
      await this.refreshProducts()
    },

    async clearFilters(): Promise<void> {
      this.resetFacetFilters()
      await this.refreshProducts()
    },

    // Backward-compatible wrappers used by older views.
    async setParentCategory(categoryId: string | null): Promise<void> {
      await this.setCategory(categoryId)
    },

    async setSubcategory(categoryId: string | null): Promise<void> {
      await this.setCategory(categoryId)
    },
  },
})
