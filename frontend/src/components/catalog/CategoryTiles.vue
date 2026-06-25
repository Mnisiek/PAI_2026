<script setup lang="ts">
import type { Category } from '../../types/catalog'

defineProps<{
  title: string
  subtitle?: string
  categories: Category[]
}>()

const GRADIENTS = [
  'linear-gradient(135deg, #0f766e, #14b8a6)',
  'linear-gradient(135deg, #2563eb, #38bdf8)',
  'linear-gradient(135deg, #db2777, #fb7185)',
  'linear-gradient(135deg, #d97706, #fbbf24)',
  'linear-gradient(135deg, #7c3aed, #a78bfa)',
  'linear-gradient(135deg, #0891b2, #22d3ee)',
]

const tileStyle = (index: number) => ({ background: GRADIENTS[index % GRADIENTS.length] })
</script>

<template>
  <section v-if="categories.length" class="cat-tiles">
    <header class="cat-tiles__head">
      <h3>{{ title }}</h3>
      <p v-if="subtitle">{{ subtitle }}</p>
    </header>

    <div class="cat-tiles__grid">
      <NuxtLink
        v-for="(category, index) in categories"
        :key="category.id"
        :to="`/offers/${category.slug}`"
        class="cat-tile"
        :style="tileStyle(index)"
      >
        <span class="cat-tile__name">{{ category.name }}</span>
        <span class="cat-tile__arrow" aria-hidden="true">→</span>
      </NuxtLink>
    </div>
  </section>
</template>

<style scoped>
.cat-tiles {
  margin-bottom: 0.95rem;
}

.cat-tiles__head {
  margin-bottom: 0.7rem;
}

.cat-tiles__head h3 {
  margin: 0;
  font-family: var(--font-heading);
  font-size: 1.25rem;
  color: var(--color-text-primary);
}

.cat-tiles__head p {
  margin: 0.15rem 0 0;
  font-size: 0.84rem;
  color: var(--color-text-muted);
}

.cat-tiles__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.6rem;
}

.cat-tile {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  min-height: 84px;
  padding: 0.9rem 1rem;
  border-radius: 16px;
  color: #fff;
  text-decoration: none;
  font-weight: 600;
  box-shadow: 0 12px 26px -20px rgba(15, 23, 42, 0.9);
  transition: transform 0.16s ease;
}

.cat-tile:hover {
  transform: translateY(-2px);
}

.cat-tile__name {
  font-size: 1rem;
}

.cat-tile__arrow {
  font-size: 1.1rem;
  opacity: 0.85;
}

@media (min-width: 680px) {
  .cat-tiles__grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (min-width: 1050px) {
  .cat-tiles__grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
</style>
