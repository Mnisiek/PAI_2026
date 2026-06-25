<script setup lang="ts">
import type { Category } from '../../types/catalog'

interface CategoryPillsProps {
  currentCategories: Category[]
  selectedCategoryId: string | null
  canGoUp: boolean
  loading?: boolean
}

withDefaults(defineProps<CategoryPillsProps>(), {
  loading: false,
})

const emit = defineEmits<{
  (event: 'select-category', categoryId: string | null): void
  (event: 'go-up'): void
}>()
</script>

<template>
  <section class="category-section" aria-label="Kategorie produktów">
    <div class="category-section__actions">
      <button
        class="category-section__up"
        type="button"
        :disabled="loading || !canGoUp"
        @click="emit('go-up')"
      >
        <span class="category-section__up-icon" aria-hidden="true">◀</span>
        <span>Wróć poziom wyżej</span>
      </button>
    </div>

    <h3 class="category-section__subtitle">
      {{ selectedCategoryId ? 'Podkategorie' : 'Kategorie główne' }}
    </h3>

    <div class="category-pills" role="tablist" aria-label="Filtruj po kategorii">
      <button
        v-for="category in currentCategories"
        :key="category.id"
        class="category-pills__item"
        :class="{ 'category-pills__item--active': selectedCategoryId === category.id }"
        type="button"
        :disabled="loading"
        @click="emit('select-category', category.id)"
      >
        {{ category.name }}
      </button>
    </div>

    <p v-if="selectedCategoryId && currentCategories.length === 0" class="category-section__leaf">
      Brak dalszych podkategorii.
    </p>
  </section>
</template>

<style scoped>
.category-section__actions {
  margin-bottom: 0.2rem;
}

.category-section__up {
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  padding: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.76rem;
  line-height: 1.2;
  cursor: pointer;
  text-underline-offset: 2px;
}

.category-section__up-icon {
  display: inline-flex;
  width: 0.8rem;
  justify-content: center;
  color: var(--color-text-muted);
  font-size: 0.62rem;
  line-height: 1;
}

.category-section__up:hover {
  color: var(--color-brand-strong);
}

.category-section__up:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  text-decoration: none;
}

.category-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin-top: 0.65rem;
}

.category-pills__item {
  border: 1px solid var(--color-border-soft);
  background: #ffffff;
  border-radius: 999px;
  color: var(--color-text-primary);
  padding: 0.48rem 0.9rem;
  font-size: 0.88rem;
  cursor: pointer;
  transition: transform 0.16s ease, border-color 0.16s ease, background-color 0.16s ease;
}

.category-pills__item:hover {
  transform: translateY(-1px);
  border-color: rgba(15, 118, 110, 0.42);
}

.category-pills__item:disabled {
  cursor: wait;
  opacity: 0.72;
}

.category-pills__item--active {
  border-color: var(--color-brand-strong);
  background: rgba(20, 184, 166, 0.1);
  color: var(--color-brand-strong);
}

.category-section__subtitle {
  margin: 0.6rem 0 0;
  font-size: 0.82rem;
  color: var(--color-text-muted);
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.category-section__leaf {
  margin: 0.8rem 0 0;
  font-size: 0.82rem;
  color: var(--color-text-secondary);
}
</style>
