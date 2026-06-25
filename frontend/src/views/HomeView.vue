<script setup lang="ts">
import { computed, ref } from 'vue'
import MainLayout from '../layouts/MainLayout.vue'
import SearchBar from '../components/catalog/SearchBar.vue'
import CategoryNavBar from '../components/catalog/CategoryNavBar.vue'
import ProductCarousel from '../components/catalog/ProductCarousel.vue'
import { useCatalogStore } from '../stores/catalog.store'

const catalogStore = useCatalogStore()
const router = useRouter()
const searchQuery = ref(catalogStore.searchQuery)
const isNavigatingToOffers = ref(false)

await useAsyncData('home-init', async () => {
  await catalogStore.loadInitialData()
  return true
})

const homeProductsList = computed(() => catalogStore.products)
const featuredProducts = computed(() => homeProductsList.value.slice(0, 8))
const newOffers = computed(() => homeProductsList.value.slice(0, 10))
const hasHomeProducts = computed(() => homeProductsList.value.length > 0)
const errorMessage = computed(() =>
  catalogStore.error && !hasHomeProducts.value ? catalogStore.error : null,
)

// Selecting a category jumps to the offers page at that category's slug path.
const goToCategory = (categoryId: string | null): void => {
  if (!categoryId) {
    void router.push('/offers')
    return
  }
  const byId = new Map(catalogStore.categories.map((category) => [category.id, category]))
  const segments: string[] = []
  let current = byId.get(categoryId) ?? null
  while (current) {
    segments.unshift(current.slug)
    current = current.parentId ? byId.get(current.parentId) ?? null : null
  }
  void router.push(segments.length ? `/offers/${segments.join('/')}` : '/offers')
}

const applySearch = async (): Promise<void> => {
  isNavigatingToOffers.value = true

  try {
    await catalogStore.setCategory(null)
    await catalogStore.setSearchQuery(searchQuery.value)
    await navigateTo('/offers')
  } finally {
    isNavigatingToOffers.value = false
  }
}
</script>

<template>
  <MainLayout>
    <template #search>
      <SearchBar v-model="searchQuery" :loading="isNavigatingToOffers" @search="applySearch" />
    </template>

    <NuxtLink to="/offers" class="sale-banner">
      <span class="sale-banner__tag">Wyprzedaż</span>
      <span class="sale-banner__text">
        Sezonowe okazje do <strong>-50%</strong> — sprawdź najlepsze oferty
      </span>
      <span class="sale-banner__cta">Zobacz oferty →</span>
    </NuxtLink>

    <CategoryNavBar @select-category="goToCategory" />

    <p v-if="errorMessage" class="home-error" role="alert">{{ errorMessage }}</p>

    <section v-if="hasHomeProducts" class="showcase" aria-label="Polecane i nowości">
      <div class="showcase__rows">
        <ProductCarousel
          title="Polecane"
          subtitle="Najczęściej wybierane"
          :products="featuredProducts"
          :auto-rotate="false"
        />
        <ProductCarousel title="Nowości" subtitle="Najnowsze produkty" :products="newOffers" />
      </div>
    </section>
  </MainLayout>
</template>

<style scoped>
.sale-banner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 0.9rem;
  text-decoration: none;
  border: 1px solid rgba(244, 63, 94, 0.35);
  border-radius: 16px;
  background: linear-gradient(110deg, #f43f5e, #fb7185 55%, #fbbf24);
  color: #fff;
  padding: 0.75rem 1rem;
  margin-bottom: 0.95rem;
  box-shadow: 0 16px 32px -22px rgba(244, 63, 94, 0.85);
}

.sale-banner:hover {
  filter: brightness(1.03);
}

.sale-banner__tag {
  font-family: var(--font-heading);
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-size: 0.76rem;
  background: rgba(255, 255, 255, 0.22);
  border-radius: 999px;
  padding: 0.25rem 0.7rem;
}

.sale-banner__text {
  flex: 1 1 auto;
  font-size: 0.92rem;
}

.sale-banner__text strong {
  font-size: 1.04rem;
}

.sale-banner__cta {
  font-weight: 600;
  font-size: 0.88rem;
  white-space: nowrap;
}

.home-error {
  margin: 0 0 0.95rem;
  border: 1px solid rgba(220, 38, 38, 0.25);
  border-radius: 14px;
  background: rgba(254, 242, 242, 0.88);
  color: #991b1b;
  padding: 0.7rem 0.9rem;
}

.showcase__rows {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 0.9rem;
}
</style>
