import { defineStore } from 'pinia'
import { catalogService } from '../services/catalog.service'
import { activityService } from '../services/activity.service'
import type { Category, Product } from '../types/catalog'

interface CatalogState {
  categories: Category[]
  products: Product[]
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
    isLoading: false,
    error: null,
    searchQuery: '',
    selectedCategoryPathIds: [],
    initialized: false,
    requestToken: 0,
  }),

  getters: {
    hasFilters: (state): boolean =>
      Boolean(state.searchQuery || state.selectedCategoryPathIds.length > 0),
    selectedCategoryId: (state): string | null =>
      state.selectedCategoryPathIds[state.selectedCategoryPathIds.length - 1] ?? null,
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
    async loadInitialData(): Promise<void> {
      if (this.initialized) {
        return
      }

      this.error = null
      this.isLoading = true

      try {
        const [categories, products] = await Promise.all([
          catalogService.getCategories(),
          catalogService.getProducts({
            search: this.searchQuery,
            categoryId: this.selectedCategoryId,
          }),
        ])

        this.categories = categories
        this.products = products
        this.initialized = true
      } catch (error) {
        this.error = errorToMessage(error)
      } finally {
        this.isLoading = false
      }
    },

    async refreshProducts(): Promise<void> {
      const currentRequestToken = ++this.requestToken
      this.error = null
      this.isLoading = true

      try {
        const products = await catalogService.getProducts({
          search: this.searchQuery,
          categoryId: this.selectedCategoryId,
        })

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

    async setSearchQuery(query: string): Promise<void> {
      this.searchQuery = query
      activityService.trackSearch(query)
      await this.refreshProducts()
    },

    async setCategory(categoryId: string | null): Promise<void> {
      if (!categoryId) {
        this.selectedCategoryPathIds = []
        await this.refreshProducts()
        return
      }

      const byId = new Map(this.categories.map((category) => [category.id, category]))
      const path: string[] = []

      let current = byId.get(categoryId) ?? null
      while (current) {
        path.push(current.id)
        current = current.parentId ? byId.get(current.parentId) ?? null : null
      }

      this.selectedCategoryPathIds = path.reverse()
      await this.refreshProducts()
    },

    async goToPathIndex(index: number): Promise<void> {
      if (index < 0) {
        this.selectedCategoryPathIds = []
        await this.refreshProducts()
        return
      }

      this.selectedCategoryPathIds = this.selectedCategoryPathIds.slice(0, index + 1)
      await this.refreshProducts()
    },

    async goUpCategory(): Promise<void> {
      if (this.selectedCategoryPathIds.length === 0) {
        return
      }

      this.selectedCategoryPathIds = this.selectedCategoryPathIds.slice(0, -1)
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
