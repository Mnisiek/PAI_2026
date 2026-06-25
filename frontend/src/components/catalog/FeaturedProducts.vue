<script setup lang="ts">
import { useCurrency } from '../../composables/useCurrency'
import type { CarouselProduct } from '../../types/catalog'

defineProps<{
  title: string
  subtitle?: string
  products: CarouselProduct[]
}>()

const { formatPrice } = useCurrency()
</script>

<template>
  <section v-if="products.length" class="featured">
    <header class="featured__head">
      <h3>{{ title }}</h3>
      <p v-if="subtitle">{{ subtitle }}</p>
    </header>

    <div class="featured__grid">
      <NuxtLink
        v-for="(product, index) in products"
        :key="product.id"
        :to="`/product/${product.slug}`"
        class="featured__card"
        :class="{ 'featured__card--lead': index === 0 }"
      >
        <img
          :src="product.mainImageUrl"
          :alt="product.name"
          class="featured__image"
          loading="lazy"
        />
        <div class="featured__content">
          <p class="featured__name">{{ product.name }}</p>
          <p class="featured__price">od {{ formatPrice(product.priceFrom.amount) }}</p>
        </div>
      </NuxtLink>
    </div>
  </section>
</template>

<style scoped>
.featured__head {
  margin-bottom: 0.7rem;
}

.featured__head h3 {
  margin: 0;
  font-family: var(--font-heading);
  font-size: 1.25rem;
  color: var(--color-text-primary);
}

.featured__head p {
  margin: 0.15rem 0 0;
  font-size: 0.84rem;
  color: var(--color-text-muted);
}

.featured__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.8rem;
}

.featured__card {
  display: flex;
  flex-direction: column;
  text-decoration: none;
  color: inherit;
  border: 1px solid var(--color-border-soft);
  border-radius: 18px;
  background: #fff;
  overflow: hidden;
  transition: border-color 0.16s ease, transform 0.16s ease, box-shadow 0.16s ease;
}

.featured__card:hover {
  border-color: rgba(15, 118, 110, 0.4);
  transform: translateY(-3px);
  box-shadow: 0 18px 34px -26px rgba(15, 23, 42, 0.8);
}

.featured__image {
  width: 100%;
  height: 200px;
  object-fit: cover;
  display: block;
}

.featured__content {
  padding: 0.8rem 0.9rem;
}

.featured__name {
  margin: 0;
  font-size: 1rem;
  line-height: 1.3;
  color: var(--color-text-primary);
}

.featured__price {
  margin: 0.35rem 0 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--color-brand-strong);
}

@media (min-width: 680px) {
  .featured__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1050px) {
  .featured__grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  /* The first pick is the hero: wider and taller. */
  .featured__card--lead {
    grid-column: span 2;
    grid-row: span 2;
  }

  .featured__card--lead .featured__image {
    height: 100%;
    min-height: 320px;
  }

  .featured__card--lead .featured__name {
    font-size: 1.2rem;
  }
}
</style>
