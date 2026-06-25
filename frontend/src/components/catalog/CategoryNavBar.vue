<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import CategoryTree from './CategoryTree.vue'
import { useCatalogStore } from '../../stores/catalog.store'
import type { Category } from '../../types/catalog'

const store = useCatalogStore()

const emit = defineEmits<{
  (event: 'select-category', categoryId: string | null): void
}>()

// Root entries keep their nested `children` (the catalog service preserves the tree).
const roots = computed(() => store.categories.filter((category) => !category.parentId))
const selectedId = computed(() => store.selectedCategoryId)
const activePathIds = computed(() => new Set(store.categoryPath.map((category) => category.id)))

const openId = ref<string | null>(null)
const root = ref<HTMLElement | null>(null)

// Hover-to-open is for fine pointers; touch devices open with a double-tap instead.
const canHover = ref(true)

// A short close delay tolerates brief pointer excursions between the root and its
// panel, so the dropdown doesn't vanish before a subcategory can be reached.
let closeTimer: ReturnType<typeof setTimeout> | null = null
const cancelClose = (): void => {
  if (closeTimer) {
    clearTimeout(closeTimer)
    closeTimer = null
  }
}

const hasChildren = (category: Category): boolean => Boolean(category.children?.length)

const onEnter = (category: Category): void => {
  if (!canHover.value) return
  cancelClose()
  if (hasChildren(category)) openId.value = category.id
}

const onLeave = (): void => {
  if (!canHover.value) return
  cancelClose()
  closeTimer = setTimeout(() => {
    openId.value = null
  }, 160)
}

// Single click/tap navigates to the category; the tree opens via hover or dbl-tap.
const onRootClick = (category: Category): void => {
  emit('select-category', category.id)
}

// Touch: double-tap toggles the subtree without navigating.
const onRootDblclick = (category: Category): void => {
  if (!hasChildren(category)) return
  openId.value = openId.value === category.id ? null : category.id
}

const onTreeSelect = (categoryId: string): void => {
  emit('select-category', categoryId)
  openId.value = null
}

const onDocumentPointerDown = (event: MouseEvent): void => {
  if (root.value && !root.value.contains(event.target as Node)) {
    openId.value = null
  }
}

onMounted(() => {
  canHover.value = window.matchMedia('(hover: hover) and (pointer: fine)').matches
  document.addEventListener('mousedown', onDocumentPointerDown)
})
onBeforeUnmount(() => {
  cancelClose()
  document.removeEventListener('mousedown', onDocumentPointerDown)
})
</script>

<template>
  <nav ref="root" class="category-nav" aria-label="Kategorie główne">
    <div
      v-for="category in roots"
      :key="category.id"
      class="category-nav__group"
      @mouseenter="onEnter(category)"
      @mouseleave="onLeave"
    >
      <button
        type="button"
        class="category-nav__root"
        :class="{
          'category-nav__root--active': activePathIds.has(category.id),
          'category-nav__root--open': openId === category.id,
        }"
        :aria-expanded="hasChildren(category) ? openId === category.id : undefined"
        @click="onRootClick(category)"
        @dblclick="onRootDblclick(category)"
      >
        {{ category.name }}
        <span v-if="hasChildren(category)" class="category-nav__caret" aria-hidden="true">▾</span>
      </button>

      <div v-if="openId === category.id && hasChildren(category)" class="category-nav__dropdown">
        <CategoryTree
          :nodes="category.children ?? []"
          :selected-id="selectedId"
          @select="onTreeSelect"
        />
      </div>
    </div>
  </nav>
</template>

<style scoped>
.category-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  padding: 0.5rem;
  border: 1px solid var(--color-border-soft);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.9);
  margin-bottom: 0.95rem;
}

.category-nav__group {
  position: relative;
}

.category-nav__root {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border: 1px solid transparent;
  background: transparent;
  border-radius: 999px;
  color: var(--color-text-primary);
  padding: 0.45rem 0.9rem;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background-color 0.16s ease, border-color 0.16s ease, color 0.16s ease;
}

.category-nav__root:hover {
  border-color: rgba(15, 118, 110, 0.42);
  color: var(--color-brand-strong);
}

.category-nav__root--active {
  background: rgba(20, 184, 166, 0.1);
  border-color: var(--color-brand-strong);
  color: var(--color-brand-strong);
}

.category-nav__root--open {
  background: rgba(20, 184, 166, 0.08);
}

.category-nav__caret {
  font-size: 0.65rem;
  color: var(--color-text-muted);
}

.category-nav__dropdown {
  position: absolute;
  z-index: 30;
  /* Flush with the button (no dead gap), with the visual spacing as inner padding
     so hovering from the root into the panel never leaves the group. */
  top: 100%;
  left: 0;
  min-width: 220px;
  max-width: min(320px, 90vw);
  max-height: 60vh;
  overflow-y: auto;
  background: #fff;
  border: 1px solid var(--color-border-soft);
  border-radius: 14px;
  box-shadow: 0 16px 34px rgba(15, 23, 42, 0.14);
  padding: 0.85rem 0.5rem 0.5rem;
}
</style>
