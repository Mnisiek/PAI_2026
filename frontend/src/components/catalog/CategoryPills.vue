<script setup lang="ts">
import type { Category } from '../../types/catalog'

interface CategoryPillsProps {
  parentCategories: Category[]
  subcategories: Category[]
  selectedParentCategoryId: string | null
  selectedSubcategoryId: string | null
  loading?: boolean
}

withDefaults(defineProps<CategoryPillsProps>(), {
  loading: false,
})

const emit = defineEmits<{
  (event: 'select-parent', categoryId: string | null): void
  (event: 'select-subcategory', categoryId: string | null): void
}>()
</script>

<template>
  <section class="category-panel" aria-label="Kategorie produktów">
    <h2 class="category-panel__title">Kategorie główne</h2>

    <div class="category-pills" role="tablist" aria-label="Filtruj po kategorii">
      <button
        class="category-pills__item"
        :class="{ 'category-pills__item--active': selectedParentCategoryId === null }"
        type="button"
        :disabled="loading"
        @click="emit('select-parent', null)"
      >
        Wszystkie
      </button>

      <button
        v-for="category in parentCategories"
        :key="category.id"
        class="category-pills__item"
        :class="{ 'category-pills__item--active': selectedParentCategoryId === category.id }"
        type="button"
        :disabled="loading"
        @click="emit('select-parent', category.id)"
      >
        {{ category.name }}
      </button>
    </div>

    <template v-if="selectedParentCategoryId">
      <h3 class="category-panel__subtitle">Podkategorie</h3>

      <div class="subcategory-pills" role="tablist" aria-label="Filtruj po podkategorii">
        <button
          class="subcategory-pills__item"
          :class="{ 'subcategory-pills__item--active': selectedSubcategoryId === null }"
          type="button"
          :disabled="loading"
          @click="emit('select-subcategory', null)"
        >
          Wszystkie z tej kategorii
        </button>

        <button
          v-for="subcategory in subcategories"
          :key="subcategory.id"
          class="subcategory-pills__item"
          :class="{ 'subcategory-pills__item--active': selectedSubcategoryId === subcategory.id }"
          type="button"
          :disabled="loading"
          @click="emit('select-subcategory', subcategory.id)"
        >
          {{ subcategory.name }}
        </button>
      </div>
    </template>
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

.category-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin-top: 0.9rem;
}

.subcategory-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
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

.subcategory-pills__item {
  border: 1px solid var(--color-border-soft);
  background: rgba(255, 255, 255, 0.76);
  border-radius: 999px;
  color: var(--color-text-secondary);
  padding: 0.4rem 0.78rem;
  font-size: 0.82rem;
  cursor: pointer;
  transition: border-color 0.16s ease, background-color 0.16s ease;
}

.category-pills__item:hover {
  transform: translateY(-1px);
  border-color: rgba(15, 118, 110, 0.42);
}

.subcategory-pills__item:hover {
  border-color: rgba(15, 118, 110, 0.38);
}

.category-pills__item:disabled {
  cursor: wait;
  opacity: 0.72;
}

.subcategory-pills__item:disabled {
  cursor: wait;
  opacity: 0.72;
}

.category-pills__item--active {
  border-color: var(--color-brand-strong);
  background: rgba(20, 184, 166, 0.1);
  color: var(--color-brand-strong);
}

.category-panel__subtitle {
  margin: 1rem 0 0;
  font-size: 0.82rem;
  color: var(--color-text-muted);
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.subcategory-pills__item--active {
  border-color: rgba(15, 118, 110, 0.5);
  background: rgba(20, 184, 166, 0.12);
  color: var(--color-brand-strong);
}
</style>
