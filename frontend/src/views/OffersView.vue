<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import MainLayout from '../layouts/MainLayout.vue'
import SearchBar from '../components/catalog/SearchBar.vue'
import CategoryPills from '../components/catalog/CategoryPills.vue'
import ProductGrid from '../components/catalog/ProductGrid.vue'
import { useCatalogStore } from '../stores/catalog.store'

const catalogStore = useCatalogStore()

const searchQuery = ref(catalogStore.searchQuery)

const selectedParentCategoryId = computed(() => catalogStore.selectedParentCategoryId)
const selectedSubcategoryId = computed(() => catalogStore.selectedSubcategoryId)
const parentCategories = computed(() => catalogStore.parentCategories)
const subcategories = computed(() => catalogStore.activeSubcategories)

const productsCounterLabel = computed(() => {
  if (catalogStore.isLoading) {
    return 'Ładuję produkty...'
  }

  return `Liczba ofert: ${catalogStore.products.length}`
})

const selectParentCategory = (categoryId: string | null): void => {
  void catalogStore.setParentCategory(categoryId)
}

const selectSubcategory = (categoryId: string | null): void => {
  void catalogStore.setSubcategory(categoryId)
}

const applySearch = (): void => {
  void catalogStore.setSearchQuery(searchQuery.value)
}

onMounted(() => {
  void catalogStore.loadInitialData()
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
        :parent-categories="parentCategories"
        :subcategories="subcategories"
        :selected-parent-category-id="selectedParentCategoryId"
        :selected-subcategory-id="selectedSubcategoryId"
        :loading="catalogStore.isLoading"
        @select-parent="selectParentCategory"
        @select-subcategory="selectSubcategory"
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
