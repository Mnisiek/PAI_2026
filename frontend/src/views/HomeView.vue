<script setup lang="ts">
import { computed, ref } from 'vue'
import MainLayout from '../layouts/MainLayout.vue'
import { useCurrency } from '../composables/useCurrency'
import { catalogService } from '../services/catalog.service'
import type { Product } from '../types/catalog'

const { formatPrice } = useCurrency()

const homeProducts = ref<Product[]>([])
const isLoading = ref(true)
const error = ref<string | null>(null)

const featuredProducts = computed(() => homeProducts.value.slice(0, 4))

const promoProducts = computed(() => {
  return [...homeProducts.value]
    .sort((first, second) => first.priceFrom.amount - second.priceFrom.amount)
    .slice(0, 3)
})

const newArrivalProducts = computed(() => homeProducts.value.slice(0, 6))
const hasHomeProducts = computed(() => homeProducts.value.length > 0)

await useAsyncData('home-products', async () => {
  isLoading.value = true
  error.value = null

  try {
    homeProducts.value = await catalogService.getProducts({ search: '', categoryId: null })
    return true
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'Nie udało się pobrać ofert.'
    return false
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <MainLayout>
    <section class="home-hero">
      <p class="home-hero__eyebrow">Strona główna</p>
      <h2 class="home-hero__title">Polecane, promocje i nowości</h2>
      <p class="home-hero__description">
        Odkrywaj inspiracje zakupowe i najlepsze okazje. Pełny katalog z filtrowaniem znajdziesz na
        dedykowanej stronie ofert.
      </p>
      <NuxtLink class="home-hero__cta" to="/offers">Przejdź do ofert</NuxtLink>
    </section>

    <p v-if="error && !hasHomeProducts" class="home-error" role="alert">{{ error }}</p>

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
            <h3>Promocje</h3>
            <p>Najlepsze ceny</p>
          </header>
          <div class="collection__grid collection__grid--three">
            <NuxtLink
              v-for="product in promoProducts"
              :key="`promo-${product.id}`"
              :to="`/product/${product.slug}`"
              class="collection-card collection-card--promo"
            >
              <img
                :src="product.mainImageUrl"
                :alt="product.name"
                class="collection-card__image"
                loading="lazy"
              />
              <div class="collection-card__content">
                <p class="collection-card__badge">Okazja</p>
                <p class="collection-card__name">{{ product.name }}</p>
                <p class="collection-card__price">od {{ formatPrice(product.priceFrom.amount) }}</p>
              </div>
            </NuxtLink>
          </div>
        </section>

        <section class="collection">
          <header class="collection__head">
            <h3>Nowości</h3>
            <p>Świeżo dodane produkty</p>
          </header>
          <div class="collection__ticker">
            <NuxtLink
              v-for="product in newArrivalProducts"
              :key="`new-${product.id}`"
              :to="`/product/${product.slug}`"
              class="collection__ticker-item"
            >
              {{ product.name }}
            </NuxtLink>
          </div>
        </section>
      </div>
    </section>
  </MainLayout>
</template>

<style scoped>
.home-hero {
  border: 1px solid var(--color-border-soft);
  border-radius: 24px;
  background:
    radial-gradient(1000px 240px at 15% -40%, rgba(20, 184, 166, 0.16), transparent),
    radial-gradient(700px 240px at 90% -30%, rgba(251, 191, 36, 0.18), transparent),
    rgba(255, 255, 255, 0.84);
  padding: 1rem;
}

.home-hero__eyebrow {
  margin: 0;
  font-size: 0.74rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.home-hero__title {
  margin: 0.4rem 0 0;
  font-size: clamp(1.3rem, 3vw, 1.8rem);
  color: var(--color-text-primary);
}

.home-hero__description {
  margin: 0.5rem 0 0;
  color: var(--color-text-secondary);
}

.home-hero__cta {
  margin-top: 0.8rem;
  display: inline-flex;
  text-decoration: none;
  border: none;
  border-radius: 12px;
  background: var(--color-brand-strong);
  color: #fff;
  padding: 0.6rem 1.1rem;
  font-size: 0.9rem;
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