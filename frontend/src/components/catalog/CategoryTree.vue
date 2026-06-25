<script setup lang="ts">
// Explicit self-import so the recursive <CategoryTree> below resolves reliably
// (Nuxt auto-imports this as `CatalogCategoryTree`, not the bare name).
import CategoryTree from './CategoryTree.vue'
import type { Category } from '../../types/catalog'

defineProps<{
  nodes: Category[]
  selectedId: string | null
}>()

const emit = defineEmits<{
  (event: 'select', categoryId: string): void
}>()
</script>

<template>
  <ul class="cat-tree">
    <li v-for="node in nodes" :key="node.id" class="cat-tree__item">
      <button
        type="button"
        class="cat-tree__link"
        :class="{ 'cat-tree__link--active': node.id === selectedId }"
        @click="emit('select', node.id)"
      >
        {{ node.name }}
      </button>

      <CategoryTree
        v-if="node.children && node.children.length > 0"
        :nodes="node.children"
        :selected-id="selectedId"
        @select="emit('select', $event)"
      />
    </li>
  </ul>
</template>

<style scoped>
.cat-tree {
  list-style: none;
  margin: 0;
  padding: 0;
}

/* Nested levels indent and gain a guide line. */
.cat-tree .cat-tree {
  margin-left: 0.7rem;
  padding-left: 0.5rem;
  border-left: 1px solid var(--color-border-soft);
}

.cat-tree__item {
  margin: 0.05rem 0;
}

.cat-tree__link {
  width: 100%;
  text-align: left;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  padding: 0.3rem 0.45rem;
  border-radius: 8px;
  font-size: 0.85rem;
  cursor: pointer;
}

.cat-tree__link:hover {
  background: rgba(20, 184, 166, 0.1);
  color: var(--color-brand-strong);
}

.cat-tree__link--active {
  color: var(--color-brand-strong);
  font-weight: 600;
}
</style>
