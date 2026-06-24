<script setup lang="ts">
import type { Category } from '../../types/catalog'

interface CategoryPillsProps {
  categoryPath: Category[]
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
  (event: 'go-root'): void
  (event: 'go-up'): void
  (event: 'go-path-index', index: number): void
}>()
</script>

<template>
  <section class="category-panel" aria-label="Kategorie produktów">
  
    <h2 class="category-panel__title">Kategorie</h2>

    <div class="category-breadcrumbs" role="navigation" aria-label="Ścieżka kategorii">
      <button
        class="category-breadcrumbs__item"
        :class="{ 'category-breadcrumbs__item--active': !selectedCategoryId }"
        type="button"
        :disabled="loading"
        @click="emit('go-root')"
      >
        Wszystkie
      </button>

      <span
        v-if="categoryPath.length > 0"
        class="category-breadcrumbs__separator"
        aria-hidden="true"
      >
        ▶
      </span>

      <span
        v-for="(category, index) in categoryPath"
        :key="category.id"
        class="category-breadcrumbs__segment"
      >
        <button
          class="category-breadcrumbs__item"
          :class="{ 'category-breadcrumbs__item--active': index === categoryPath.length - 1 }"
          type="button"
          :disabled="loading"
          @click="emit('go-path-index', index)"
        >
          {{ category.name }}
        </button>

        <span
          v-if="index < categoryPath.length - 1"
          class="category-breadcrumbs__separator"
          aria-hidden="true"
        >
          ▶
        </span>
      </span>
    </div>

    <div class="category-panel__actions">
      <button
        class="category-panel__up"
        type="button"
        :disabled="loading || !canGoUp"
        @click="emit('go-up')"
      >
        <span class="category-panel__up-icon" aria-hidden="true">◀</span>
        <span>Wróć poziom wyżej</span>
      </button>
    </div>

    <h3 class="category-panel__subtitle">
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

    <p v-if="selectedCategoryId && currentCategories.length === 0" class="category-panel__leaf">
      Brak dalszych podkategorii.
    </p>
  </section>
</template>

<style scoped>
.category-panel {
  border: 1px solid var(--color-border-soft);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.88);
  padding: 1.1rem;
}

.category-panel__title {
  margin: 0;
  font-family: var(--font-heading);
  font-size: 0.95rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.category-breadcrumbs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin-top: 0.65rem;
}

.category-breadcrumbs__item {
  border: 1px solid var(--color-border-soft);
  background: #ffffff;
  border-radius: 999px;
  color: var(--color-text-secondary);
  padding: 0.3rem 0.7rem;
  font-size: 0.78rem;
  cursor: pointer;
}

.category-breadcrumbs__item--active {
  border-color: rgba(15, 118, 110, 0.5);
  background: rgba(20, 184, 166, 0.12);
  color: var(--color-brand-strong);
}

.category-breadcrumbs__separator {
  color: var(--color-text-muted);
  font-size: 0.6rem;
  line-height: 1;
  align-self: center;
}

.category-breadcrumbs__segment {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
}

.category-panel__actions {
  margin-top: 0.7rem;
}

.category-panel__up {
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

.category-panel__up-icon {
  display: inline-flex;
  width: 0.8rem;
  justify-content: center;
  color: var(--color-text-muted);
  font-size: 0.62rem;
  line-height: 1;
}

.category-panel__up:hover {
  color: var(--color-brand-strong);
}

.category-panel__up:disabled {
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

.category-panel__subtitle {
  margin: 0.95rem 0 0;
  font-size: 0.82rem;
  color: var(--color-text-muted);
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.category-panel__leaf {
  margin: 0.8rem 0 0;
  font-size: 0.82rem;
  color: var(--color-text-secondary);
}
</style>
