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
  selectedParentCategoryId: string | null
  selectedSubcategoryId: string | null
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
    selectedParentCategoryId: null,
    selectedSubcategoryId: null,
    initialized: false,
    requestToken: 0,
  }),

  getters: {
    hasFilters: (state): boolean =>
      Boolean(state.searchQuery || state.selectedParentCategoryId || state.selectedSubcategoryId),
    selectedCategoryId: (state): string | null =>
      state.selectedSubcategoryId ?? state.selectedParentCategoryId,
    parentCategories: (state): Category[] =>
      state.categories.filter((category) => category.parentId === null),
    activeSubcategories: (state): Category[] =>
      state.selectedParentCategoryId
        ? state.categories.filter((category) => category.parentId === state.selectedParentCategoryId)
        : [],
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

    async setParentCategory(categoryId: string | null): Promise<void> {
      this.selectedParentCategoryId = categoryId
      this.selectedSubcategoryId = null
      await this.refreshProducts()
    },

    async setSubcategory(categoryId: string | null): Promise<void> {
      this.selectedSubcategoryId = categoryId
      await this.refreshProducts()
    },
  },
})
