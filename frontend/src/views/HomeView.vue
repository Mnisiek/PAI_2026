<script setup lang="ts">
import { computed, ref } from 'vue'
import MainLayout from '../layouts/MainLayout.vue'
import SearchBar from '../components/catalog/SearchBar.vue'
import { useCurrency } from '../composables/useCurrency'
import { catalogService } from '../services/catalog.service'
import { useCatalogStore } from '../stores/catalog.store'
import type { Product } from '../types/catalog'

const { formatPrice } = useCurrency()
const catalogStore = useCatalogStore()
const searchQuery = ref(catalogStore.searchQuery)
const isNavigatingToOffers = ref(false)
const navigatingCategoryId = ref<string | null>(null)

const {
  data: homeProducts,
  error,
} = await useAsyncData<Product[]>(
  'home-products',
  () => catalogService.getProducts({ search: '', categoryId: null }),
  {
    default: () => [],
  },
)

const {
  data: allCategories,
} = await useAsyncData<import('../types/catalog').Category[]>(
  'home-categories',
  () => catalogService.getCategories(),
  { default: () => [] },
)

const rootCategories = computed(() =>
  (allCategories.value ?? []).filter((c) => c.parentId === null),
)

const homeProductsList = computed(() => homeProducts.value ?? [])

const featuredProducts = computed(() => homeProductsList.value.slice(0, 4))

const promoProducts = computed(() => {
  return [...homeProductsList.value]
    .sort((first, second) => first.priceFrom.amount - second.priceFrom.amount)
    .slice(0, 3)
})

const newArrivalProducts = computed(() => homeProductsList.value.slice(0, 6))
const hasHomeProducts = computed(() => homeProductsList.value.length > 0)

// Symulowane źródła danych dla sekcji "Wybrane dla ciebie".
// getRetargetedOffers: produkty z najwyższą ceną (retargeting).
// getOptimizedOffers: co trzeci produkt z listy (symulacja rekomendacji ML).
const retargetedOffers = computed<Product[]>(() =>
  [...homeProductsList.value]
    .sort((a, b) => b.priceFrom.amount - a.priceFrom.amount)
    .slice(0, 4),
)

const optimizedOffers = computed<Product[]>(() =>
  homeProductsList.value.filter((_, i) => i % 3 === 1).slice(0, 4),
)

const hasPersonalized = computed(
  () => retargetedOffers.value.length > 0 || optimizedOffers.value.length > 0,
)
const errorMessage = computed(() => {
  if (!error.value || hasHomeProducts.value) {
    return null
  }

  if (error.value instanceof Error && error.value.message) {
    return error.value.message
  }

  return 'Nie udało się pobrać ofert.'
})

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

const goToCategory = async (categoryId: string): Promise<void> => {
  navigatingCategoryId.value = categoryId

  try {
    catalogStore.searchQuery = ''
    await catalogStore.setCategory(categoryId)
    await navigateTo('/offers')
  } finally {
    navigatingCategoryId.value = null
  }
}
</script>

<template>
  <MainLayout>
    <template #search>
      <SearchBar v-model="searchQuery" :loading="isNavigatingToOffers" @search="applySearch" />
    </template>

    <section class="home-categories">
      <header class="home-categories__head">
        <p class="home-categories__eyebrow">Strona główna</p>
        <h2 class="home-categories__title">Kategorie</h2>
      </header>
      <div class="home-categories__grid">
        <button
          v-for="category in rootCategories"
          :key="category.id"
          type="button"
          class="home-category-card"
          :class="{ 'home-category-card--loading': navigatingCategoryId === category.id }"
          :disabled="navigatingCategoryId !== null"
          @click="goToCategory(category.id)"
        >
          <span class="home-category-card__name">{{ category.name }}</span>
          <span class="home-category-card__arrow">▶</span>
        </button>
      </div>
    </section>

    <p v-if="errorMessage" class="home-error" role="alert">{{ errorMessage }}</p>

    <section v-if="hasHomeProducts" class="showcase" aria-label="Polecane i promocje">
      <div class="showcase__rows">
        <section class="collection">
          <header class="collection__head">
            <h3>Polecane</h3>
            <p>Najczęściej wybierane</p>
          </header>
          <div class="collection__grid collection__grid--four">
            <NuxtLink
              v-for="product in featuredProducts"
              :key="`featured-${product.id}`"
              :to="`/product/${product.slug}`"
              class="collection-card"
            >
              <img
                :src="product.mainImageUrl"
                :alt="product.name"
                class="collection-card__image"
                loading="lazy"
              />
              <div class="collection-card__content">
                <p class="collection-card__name">{{ product.name }}</p>
                <p class="collection-card__price">od {{ formatPrice(product.priceFrom.amount) }}</p>
              </div>
            </NuxtLink>
          </div>
        </section>

        <section class="collection">
          <header class="collection__head">
            <h3>Wybrane dla ciebie</h3>
            <p>Spersonalizowane propozycje</p>
          </header>
          <template v-if="hasPersonalized">
            <div class="collection__grid collection__grid--four">
              <NuxtLink
                v-for="product in retargetedOffers"
                :key="`retargeted-${product.id}`"
                :to="`/product/${product.slug}`"
                class="collection-card"
              >
                <img
                  :src="product.mainImageUrl"
                  :alt="product.name"
                  class="collection-card__image"
                  loading="lazy"
                />
                <div class="collection-card__content">
                  <p class="collection-card__name">{{ product.name }}</p>
                  <p class="collection-card__price">od {{ formatPrice(product.priceFrom.amount) }}</p>
                </div>
              </NuxtLink>
            </div>
          </template>
          <p v-else class="collection__empty">Brak propozycji w tej chwili.</p>
        </section>
      </div>
    </section>
  </MainLayout>
</template>

<style scoped>
.home-categories {
  border: 1px solid var(--color-border-soft);
  border-radius: 24px;
  background:
    radial-gradient(1000px 240px at 15% -40%, rgba(20, 184, 166, 0.16), transparent),
    radial-gradient(700px 240px at 90% -30%, rgba(251, 191, 36, 0.18), transparent),
    rgba(255, 255, 255, 0.84);
  padding: 1rem;
}

.home-categories__head {
  margin-bottom: 0.8rem;
}

.home-categories__eyebrow {
  margin: 0;
  font-size: 0.74rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.home-categories__title {
  margin: 0.3rem 0 0;
  font-size: clamp(1.1rem, 2.5vw, 1.5rem);
  color: var(--color-text-primary);
}

.home-categories__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.55rem;
}

.home-category-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  border: 1px solid var(--color-border-soft);
  border-radius: 14px;
  background: #fff;
  padding: 0.7rem 0.9rem;
  cursor: pointer;
  text-align: left;
  transition: border-color 0.15s, opacity 0.15s;
}

.home-category-card:hover:not(:disabled) {
  border-color: rgba(15, 118, 110, 0.4);
}

.home-category-card:disabled {
  opacity: 0.6;
  cursor: default;
}

.home-category-card--loading {
  opacity: 0.5;
}

.home-category-card__name {
  font-size: 0.88rem;
  color: var(--color-text-primary);
  font-weight: 500;
}

.home-category-card__arrow {
  font-size: 0.85rem;
  color: var(--color-text-muted);
  flex-shrink: 0;
}

@media (min-width: 600px) {
  .home-categories__grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (min-width: 1050px) {
  .home-categories__grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

.home-error {
  margin: 1rem 0 0;
  border: 1px solid rgba(220, 38, 38, 0.25);
  border-radius: 14px;
  background: rgba(254, 242, 242, 0.88);
  color: #991b1b;
  padding: 0.7rem 0.9rem;
}

.showcase {
  margin-top: 1rem;
}

.showcase__rows {
  display: grid;
  gap: 0.9rem;
}

.collection {
  border: 1px solid var(--color-border-soft);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.82);
  padding: 0.8rem;
}

.collection__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.7rem;
  margin-bottom: 0.6rem;
}

.collection__head h3 {
  margin: 0;
  font-size: 1rem;
  color: var(--color-text-primary);
}

.collection__head p {
  margin: 0;
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.collection__grid {
  display: grid;
  gap: 0.6rem;
}

.collection__grid--four {
  grid-template-columns: repeat(1, minmax(0, 1fr));
}

.collection__grid--three {
  grid-template-columns: repeat(1, minmax(0, 1fr));
}

.collection-card {
  text-decoration: none;
  border: 1px solid var(--color-border-soft);
  border-radius: 14px;
  background: #fff;
  overflow: hidden;
  color: inherit;
}

.collection-card__image {
  width: 100%;
  height: 120px;
  object-fit: cover;
  display: block;
}

.collection-card__content {
  padding: 0.55rem 0.65rem;
}

.collection-card__name {
  margin: 0;
  color: var(--color-text-primary);
  font-size: 0.86rem;
  line-height: 1.3;
}

.collection-card__price {
  margin: 0.32rem 0 0;
  color: var(--color-brand-strong);
  font-size: 0.82rem;
  font-weight: 600;
}

.collection-card__badge {
  margin: 0 0 0.3rem;
  display: inline-block;
  font-size: 0.72rem;
  border-radius: 999px;
  padding: 0.13rem 0.45rem;
  background: rgba(251, 191, 36, 0.22);
  color: #92400e;
}

.collection__subsection {
  margin-top: 0.7rem;
}

.collection__subsection:first-child {
  margin-top: 0;
}

.collection__sublabel {
  margin: 0 0 0.45rem;
  font-size: 0.78rem;
  color: var(--color-text-muted);
  font-weight: 500;
  letter-spacing: 0.03em;
}

.collection__empty {
  margin: 0.3rem 0 0;
  font-size: 0.84rem;
  color: var(--color-text-muted);
}

.collection__ticker {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.collection__ticker-item {
  text-decoration: none;
  border: 1px solid var(--color-border-soft);
  border-radius: 999px;
  background: #fff;
  color: var(--color-text-secondary);
  padding: 0.32rem 0.65rem;
  font-size: 0.8rem;
}

.collection__ticker-item:hover,
.collection-card:hover {
  border-color: rgba(15, 118, 110, 0.36);
}

@media (min-width: 1050px) {
  .collection__grid--four {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .collection__grid--three {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>