<script setup lang="ts">
import type { Category } from '../../types/catalog'

withDefaults(
  defineProps<{
    categoryPath: Category[]
    selectedCategoryId: string | null
    loading?: boolean
  }>(),
  {
    loading: false,
  },
)

const emit = defineEmits<{
  (event: 'go-root'): void
  (event: 'go-path-index', index: number): void
}>()
</script>

<template>
  <nav class="breadcrumbs" aria-label="Ścieżka kategorii">
    <button
      class="breadcrumbs__item"
      :class="{ 'breadcrumbs__item--active': !selectedCategoryId }"
      type="button"
      :disabled="loading"
      @click="emit('go-root')"
    >
      Wszystkie
    </button>

    <template v-for="(category, index) in categoryPath" :key="category.id">
      <span class="breadcrumbs__separator" aria-hidden="true">▶</span>
      <button
        class="breadcrumbs__item"
        :class="{ 'breadcrumbs__item--active': index === categoryPath.length - 1 }"
        type="button"
        :disabled="loading"
        @click="emit('go-path-index', index)"
      >
        {{ category.name }}
      </button>
    </template>
  </nav>
</template>

<style scoped>
.breadcrumbs {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.95rem;
}

.breadcrumbs__item {
  border: 1px solid var(--color-border-soft);
  background: #ffffff;
  border-radius: 999px;
  color: var(--color-text-secondary);
  padding: 0.3rem 0.75rem;
  font-size: 0.8rem;
  cursor: pointer;
}

.breadcrumbs__item:hover:not(:disabled) {
  border-color: rgba(15, 118, 110, 0.42);
  color: var(--color-brand-strong);
}

.breadcrumbs__item:disabled {
  cursor: wait;
  opacity: 0.7;
}

.breadcrumbs__item--active {
  border-color: rgba(15, 118, 110, 0.5);
  background: rgba(20, 184, 166, 0.12);
  color: var(--color-brand-strong);
}

.breadcrumbs__separator {
  color: var(--color-text-muted);
  font-size: 0.6rem;
  line-height: 1;
}
</style>
