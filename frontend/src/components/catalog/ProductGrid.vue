<script setup lang="ts">
import ProductCard from './ProductCard.vue'
import SkeletonLoader from '../base/SkeletonLoader.vue'
import type { Product } from '../../types/catalog'

interface ProductGridProps {
  products: Product[]
  loading?: boolean
  error?: string | null
}

withDefaults(defineProps<ProductGridProps>(), {
  loading: false,
  error: null,
})

const skeletonItems = Array.from({ length: 8 }, (_, index) => index)
</script>

<template>
  <section aria-label="Lista ofert" class="products-section">
    <p v-if="error" class="products-section__error" role="alert">
      {{ error }}
    </p>

    <div v-if="loading" class="products-grid">
      <SkeletonLoader v-for="item in skeletonItems" :key="item" />
    </div>

    <div v-else-if="products.length" class="products-grid">
      <ProductCard v-for="product in products" :key="product.id" :product="product" />
    </div>

    <div v-else class="products-section__empty">
      <h2>Brak ofert pasujących do filtrów</h2>
      <p>Zmień frazę wyszukiwania albo wybierz inną kategorię.</p>
    </div>
  </section>
</template>

<style scoped>
.products-section__error {
  margin: 0 0 1rem;
  border: 1px solid rgba(220, 38, 38, 0.25);
  border-radius: 14px;
  background: rgba(254, 242, 242, 0.88);
  color: #991b1b;
  padding: 0.7rem 0.9rem;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap: 1rem;
}

.products-section__empty {
  border: 1px dashed var(--color-border-strong);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.72);
  padding: 2rem 1rem;
  text-align: center;
}

.products-section__empty h2 {
  margin: 0;
  font-size: 1.2rem;
  color: var(--color-text-primary);
}

.products-section__empty p {
  margin: 0.55rem 0 0;
  color: var(--color-text-secondary);
}

@media (min-width: 700px) {
  .products-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1100px) {
  .products-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
