<script setup lang="ts">
import { computed, ref } from 'vue'
import MainLayout from '../layouts/MainLayout.vue'
import SearchBar from '../components/catalog/SearchBar.vue'
import CategoryPills from '../components/catalog/CategoryPills.vue'
import ProductGrid from '../components/catalog/ProductGrid.vue'
import { useCatalogStore } from '../stores/catalog.store'

const catalogStore = useCatalogStore()

const searchQuery = ref(catalogStore.searchQuery)

const selectedCategoryId = computed(() => catalogStore.selectedCategoryId)
const categoryPath = computed(() => catalogStore.categoryPath)
const currentCategories = computed(() => catalogStore.activeSubcategories)
const canGoUp = computed(() => catalogStore.canGoUp)

const productsCounterLabel = computed(() => {
  if (catalogStore.isLoading) {
    return 'Ładuję produkty...'
  }

  return `Liczba ofert: ${catalogStore.products.length}`
})

const selectCategory = (categoryId: string | null): void => {
  void catalogStore.setCategory(categoryId)
}

const goRoot = (): void => {
  void catalogStore.setCategory(null)
}

const goUp = (): void => {
  void catalogStore.goUpCategory()
}

const goToPathIndex = (index: number): void => {
  void catalogStore.goToPathIndex(index)
}

const applySearch = (): void => {
  void catalogStore.setSearchQuery(searchQuery.value)
}

await useAsyncData('catalog-initial-data', async () => {
  await catalogStore.loadInitialData()
  return true
})
</script>

<template>
  <MainLayout>
    <template #search>
      <SearchBar v-model="searchQuery" :loading="catalogStore.isLoading" @search="applySearch" />
    </template>

    <section class="offers-meta" aria-live="polite">
      <p class="offers-meta__counter">{{ productsCounterLabel }}</p>
      <p class="offers-meta__filters" v-if="catalogStore.hasFilters">Aktywne filtry są włączone</p>
    </section>

    <section class="offers-layout">
      <CategoryPills
        :category-path="categoryPath"
        :current-categories="currentCategories"
        :selected-category-id="selectedCategoryId"
        :can-go-up="canGoUp"
        :loading="catalogStore.isLoading"
        @select-category="selectCategory"
        @go-root="goRoot"
        @go-up="goUp"
        @go-path-index="goToPathIndex"
      />

      <ProductGrid
        :products="catalogStore.products"
        :loading="catalogStore.isLoading"
        :error="catalogStore.error"
      />
    </section>
  </MainLayout>
</template>

<style scoped>
.offers-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  align-items: center;
  margin-bottom: 0.95rem;
}

.offers-meta__counter,
.offers-meta__filters {
  margin: 0;
  border-radius: 999px;
  font-size: 0.83rem;
  padding: 0.35rem 0.78rem;
}

.offers-meta__counter {
  color: #0f766e;
  background: rgba(20, 184, 166, 0.14);
}

.offers-meta__filters {
  color: #334155;
  background: rgba(148, 163, 184, 0.16);
}

.offers-layout {
  display: grid;
  gap: 1rem;
}

@media (min-width: 1050px) {
  .offers-layout {
    grid-template-columns: 280px minmax(0, 1fr);
    align-items: start;
  }

  .offers-layout > :first-child {
    position: sticky;
    top: 1rem;
  }
}
</style>
