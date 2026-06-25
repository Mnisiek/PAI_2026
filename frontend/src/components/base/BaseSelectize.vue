<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

export interface SelectizeOption {
  value: string
  label: string
}

const props = withDefaults(
  defineProps<{
    modelValue: string
    options: SelectizeOption[]
    /** Shown on the control when nothing is selected. */
    placeholder?: string
    /** When set, adds a permanent first option with value '' (e.g. "no parent"). */
    emptyLabel?: string
    /** Accessible name for the control. */
    ariaLabel?: string
    disabled?: boolean
  }>(),
  {
    placeholder: 'Wybierz…',
    emptyLabel: undefined,
    ariaLabel: undefined,
    disabled: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const root = ref<HTMLElement | null>(null)
const searchInput = ref<HTMLInputElement | null>(null)
const listEl = ref<HTMLUListElement | null>(null)

const isOpen = ref(false)
const search = ref('')
const highlighted = ref(0)

// Diacritic-insensitive fold so "lampa" matches "Lámpa", "oswietlenie" → "Oświetlenie".
const fold = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()

const allOptions = computed<SelectizeOption[]>(() =>
  props.emptyLabel != null
    ? [{ value: '', label: props.emptyLabel }, ...props.options]
    : props.options,
)

const filtered = computed<SelectizeOption[]>(() => {
  const query = fold(search.value.trim())
  if (!query) return allOptions.value
  return allOptions.value.filter((option) => fold(option.label).includes(query))
})

const selectedLabel = computed<string>(() => {
  const match = allOptions.value.find((option) => option.value === props.modelValue)
  return match?.label ?? ''
})

const open = (): void => {
  if (props.disabled) return
  isOpen.value = true
  // Highlight the current selection if it survives the (empty) filter.
  const current = filtered.value.findIndex((option) => option.value === props.modelValue)
  highlighted.value = current >= 0 ? current : 0
  void nextTick(() => searchInput.value?.focus())
}

const close = (): void => {
  isOpen.value = false
  search.value = ''
}

const toggle = (): void => {
  if (isOpen.value) close()
  else open()
}

const select = (option: SelectizeOption): void => {
  emit('update:modelValue', option.value)
  close()
}

const move = (delta: number): void => {
  const count = filtered.value.length
  if (count === 0) return
  highlighted.value = (highlighted.value + delta + count) % count
}

const onSearchKeydown = (event: KeyboardEvent): void => {
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      move(1)
      break
    case 'ArrowUp':
      event.preventDefault()
      move(-1)
      break
    case 'Enter': {
      event.preventDefault()
      const option = filtered.value[highlighted.value]
      if (option) select(option)
      break
    }
    case 'Escape':
      event.preventDefault()
      close()
      break
    case 'Tab':
      close()
      break
  }
}

// Reset the highlight to the top whenever the filter changes the result set.
watch(search, () => {
  highlighted.value = 0
})

// Keep the highlighted option in view while navigating with the keyboard.
watch(highlighted, () => {
  void nextTick(() => {
    const node = listEl.value?.children[highlighted.value] as HTMLElement | undefined
    node?.scrollIntoView({ block: 'nearest' })
  })
})

const onDocumentPointerDown = (event: MouseEvent): void => {
  if (root.value && !root.value.contains(event.target as Node)) {
    close()
  }
}

onMounted(() => document.addEventListener('mousedown', onDocumentPointerDown))
onBeforeUnmount(() => document.removeEventListener('mousedown', onDocumentPointerDown))
</script>

<template>
  <div ref="root" class="selectize" :class="{ 'selectize--open': isOpen, 'selectize--disabled': disabled }">
    <button
      type="button"
      class="selectize__control"
      role="combobox"
      aria-haspopup="listbox"
      :aria-expanded="isOpen"
      :aria-label="ariaLabel"
      :disabled="disabled"
      @click="toggle"
    >
      <span class="selectize__value" :class="{ 'selectize__value--placeholder': !selectedLabel }">
        {{ selectedLabel || placeholder }}
      </span>
      <span class="selectize__caret" aria-hidden="true">▾</span>
    </button>

    <div v-if="isOpen" class="selectize__panel">
      <input
        ref="searchInput"
        v-model="search"
        type="text"
        class="selectize__search"
        placeholder="Szukaj…"
        autocomplete="off"
        @keydown="onSearchKeydown"
      />
      <ul ref="listEl" class="selectize__list" role="listbox">
        <li
          v-for="(option, index) in filtered"
          :key="option.value"
          class="selectize__option"
          :class="{
            'selectize__option--active': index === highlighted,
            'selectize__option--selected': option.value === modelValue,
          }"
          role="option"
          :aria-selected="option.value === modelValue"
          @mouseenter="highlighted = index"
          @click="select(option)"
        >
          {{ option.label }}
        </li>
        <li v-if="filtered.length === 0" class="selectize__empty">Brak wyników.</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.selectize {
  position: relative;
  width: 100%;
}

.selectize__control {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  width: 100%;
  border: 1px solid var(--color-border-soft);
  border-radius: 10px;
  padding: 0.5rem 0.6rem;
  font: inherit;
  color: var(--color-text-primary);
  background: #fff;
  cursor: pointer;
  text-align: left;
}

.selectize__control:focus,
.selectize--open .selectize__control {
  outline: none;
  border-color: var(--color-brand-strong);
}

.selectize--disabled .selectize__control {
  cursor: not-allowed;
  opacity: 0.6;
}

.selectize__value {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.selectize__value--placeholder {
  color: var(--color-text-muted);
}

.selectize__caret {
  flex-shrink: 0;
  font-size: 0.7rem;
  color: var(--color-text-secondary);
}

.selectize__panel {
  position: absolute;
  z-index: 20;
  top: calc(100% + 0.3rem);
  left: 0;
  right: 0;
  background: #fff;
  border: 1px solid var(--color-border-soft);
  border-radius: 10px;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.12);
  padding: 0.4rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.selectize__search {
  border: 1px solid var(--color-border-soft);
  border-radius: 8px;
  padding: 0.4rem 0.55rem;
  font: inherit;
  color: var(--color-text-primary);
  background: #fff;
}

.selectize__search:focus {
  outline: none;
  border-color: var(--color-brand-strong);
}

.selectize__list {
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 240px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.selectize__option {
  padding: 0.45rem 0.55rem;
  border-radius: 8px;
  font-size: 0.86rem;
  color: var(--color-text-primary);
  cursor: pointer;
}

.selectize__option--active {
  background: rgba(20, 184, 166, 0.12);
}

.selectize__option--selected {
  color: var(--color-brand-strong);
  font-weight: 600;
}

.selectize__empty {
  padding: 0.45rem 0.55rem;
  font-size: 0.84rem;
  color: var(--color-text-muted);
}
</style>
