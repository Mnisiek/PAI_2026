<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import MainLayout from '../layouts/MainLayout.vue'
import SearchBar from '../components/catalog/SearchBar.vue'
import CategoryNavBar from '../components/catalog/CategoryNavBar.vue'
import CategoryBreadcrumbs from '../components/catalog/CategoryBreadcrumbs.vue'
import CategoryPills from '../components/catalog/CategoryPills.vue'
import FilterPanel from '../components/catalog/FilterPanel.vue'
import ProductGrid from '../components/catalog/ProductGrid.vue'
import { useCatalogStore } from '../stores/catalog.store'

const catalogStore = useCatalogStore()
const route = useRoute()
const router = useRouter()

const searchQuery = ref(catalogStore.searchQuery)

// Combined category+filter sidebar. Collapsed by default on narrow screens; on
// desktop the body is always shown and the toggle is hidden (see styles).
const sidebarCollapsed = ref(true)

const selectedCategoryId = computed(() => catalogStore.selectedCategoryId)
const categoryPath = computed(() => catalogStore.categoryPath)
const currentCategories = computed(() => catalogStore.activeSubcategories)
const canGoUp = computed(() => catalogStore.canGoUp)

// Show the catalog grid only inside a category or while searching — never a bare
// "all offers" dump at the base level.
const showProducts = computed(() => Boolean(selectedCategoryId.value || catalogStore.searchQuery))

// --- URL <-> store sync. The URL (slug path) is the source of truth: handlers
// push routes, and the watcher below applies the route to the store. ---

const slugSegments = (): string[] => {
  const raw = route.params.slug
  if (Array.isArray(raw)) return raw.filter(Boolean)
  return raw ? [String(raw)] : []
}

// Build the /offers/<root>/…/<leaf> path for a category id (or /offers for root).
const pathForCategory = (categoryId: string | null): string => {
  if (!categoryId) return '/offers'
  const byId = new Map(catalogStore.categories.map((category) => [category.id, category]))
  const segments: string[] = []
  let current = byId.get(categoryId) ?? null
  while (current) {
    segments.unshift(current.slug)
    current = current.parentId ? byId.get(current.parentId) ?? null : null
  }
  return segments.length > 0 ? `/offers/${segments.join('/')}` : '/offers'
}

const navigateToCategory = (categoryId: string | null): void => {
  void router.push(pathForCategory(categoryId))
}

const applyRouteToStore = async (): Promise<void> => {
  const segments = slugSegments()
  const deepest = segments[segments.length - 1] ?? null
  const target = deepest
    ? (catalogStore.categories.find((category) => category.slug === deepest) ?? null)
    : null
  const targetId = target?.id ?? null

  if (targetId === catalogStore.selectedCategoryId) {
    return
  }
  await catalogStore.setCategory(targetId)
}

watch(
  () => route.params.slug,
  () => {
    void applyRouteToStore()
  },
)

// --- Category navigation handlers (all route through the URL) ---

const selectCategory = (categoryId: string | null): void => {
  navigateToCategory(categoryId)
}

const goRoot = (): void => {
  navigateToCategory(null)
}

const goUp = (): void => {
  const path = categoryPath.value
  navigateToCategory(path.length > 1 ? path[path.length - 2].id : null)
}

const goToPathIndex = (index: number): void => {
  navigateToCategory(categoryPath.value[index]?.id ?? null)
}

const applySearch = (): void => {
  void catalogStore.setSearchQuery(searchQuery.value)
}

await useAsyncData('catalog-initial-data', async () => {
  await catalogStore.loadInitialData()
  return true
})

// Apply the URL on every mount — `useAsyncData` is cached and won't re-run its
// handler when navigating between the index and the catch-all page, so the
// category must be applied here (after categories are loaded). The watch above
// then handles subsequent in-page route changes.
await applyRouteToStore()
</script>

<template>
  <MainLayout>
    <template #search>
      <SearchBar v-model="searchQuery" :loading="catalogStore.isLoading" @search="applySearch" />
    </template>

    <CategoryNavBar @select-category="selectCategory" />

    <CategoryBreadcrumbs
      v-if="selectedCategoryId"
      :category-path="categoryPath"
      :selected-category-id="selectedCategoryId"
      :loading="catalogStore.isLoading"
      @go-root="goRoot"
      @go-path-index="goToPathIndex"
    />

    <section v-if="showProducts" class="offers-layout">
      <aside class="offers-sidebar" :class="{ 'is-collapsed': sidebarCollapsed }">
        <header class="offers-sidebar__head">
          <h2 class="offers-sidebar__title">Kategorie i filtry</h2>
          <button
            type="button"
            class="offers-sidebar__toggle"
            :aria-expanded="!sidebarCollapsed"
            @click="sidebarCollapsed = !sidebarCollapsed"
          >
            {{ sidebarCollapsed ? 'Pokaż' : 'Ukryj' }}
            <span aria-hidden="true">{{ sidebarCollapsed ? '▾' : '▴' }}</span>
          </button>
        </header>

        <div class="offers-sidebar__body">
          <CategoryPills
            :current-categories="currentCategories"
            :selected-category-id="selectedCategoryId"
            :can-go-up="canGoUp"
            :loading="catalogStore.isLoading"
            @select-category="selectCategory"
            @go-up="goUp"
          />

          <FilterPanel />
        </div>
      </aside>

      <ProductGrid
        :products="catalogStore.products"
        :loading="catalogStore.isLoading"
        :error="catalogStore.error"
      />
    </section>

    <section v-else class="offers-empty">
      <p class="offers-empty__title">Wybierz kategorię</p>
      <p class="offers-empty__hint">
        Skorzystaj z paska kategorii powyżej, aby przeglądać oferty, lub wyszukaj produkt.
      </p>
    </section>
  </MainLayout>
</template>

<style scoped>
.offers-layout {
  display: grid;
  gap: 1rem;
}

.offers-sidebar {
  border: 1px solid var(--color-border-soft);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.88);
  padding: 1.1rem;
}

.offers-sidebar__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
}

.offers-sidebar__title {
  margin: 0;
  font-family: var(--font-heading);
  font-size: 0.95rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.offers-sidebar__toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  border: 1px solid var(--color-border-soft);
  background: #fff;
  border-radius: 999px;
  color: var(--color-text-secondary);
  font-size: 0.8rem;
  padding: 0.3rem 0.7rem;
  cursor: pointer;
}

.offers-sidebar__body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 0.9rem;
}

/* Divider between the category section and the filter section. */
.offers-sidebar__body > * + * {
  border-top: 1px solid var(--color-border-soft);
  padding-top: 1rem;
}

@media (min-width: 1050px) {
  /* On desktop the sidebar is always expanded; the toggle is unnecessary. */
  .offers-sidebar__toggle {
    display: none;
  }
}

@media (max-width: 1049px) {
  .offers-sidebar.is-collapsed .offers-sidebar__body {
    display: none;
  }
}

.offers-empty {
  border: 1px dashed var(--color-border-soft);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.7);
  padding: 2.4rem 1.5rem;
  text-align: center;
}

.offers-empty__title {
  margin: 0;
  font-family: var(--font-heading);
  font-size: 1.15rem;
  color: var(--color-text-primary);
}

.offers-empty__hint {
  margin: 0.4rem 0 0;
  font-size: 0.9rem;
  color: var(--color-text-secondary);
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
