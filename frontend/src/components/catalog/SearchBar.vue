<script setup lang="ts">
import { ref, watch } from 'vue'
import BaseInput from '../base/BaseInput.vue'

interface SearchBarProps {
  modelValue: string
  loading?: boolean
}

const props = withDefaults(defineProps<SearchBarProps>(), {
  loading: false,
})

const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void
  (event: 'search'): void
}>()

const localValue = ref(props.modelValue)

watch(
  () => props.modelValue,
  (nextValue) => {
    if (nextValue !== localValue.value) {
      localValue.value = nextValue
    }
  },
)

const submitSearch = (): void => {
  emit('update:modelValue', localValue.value)
  emit('search')
}
</script>

<template>
  <form class="search-shell" @submit.prevent="submitSearch">
    <BaseInput
      v-model="localValue"
      type="search"
      placeholder="Szukaj po nazwie produktu lub opisie..."
    />

    <button type="submit" class="search-shell__button" :disabled="loading">Szukaj</button>
  </form>
</template>

<style scoped>
.search-shell {
  position: relative;
  display: flex;
  align-items: stretch;
  gap: 0.5rem;
}

.search-shell > :first-child {
  flex: 1 1 auto;
  min-width: 0;
}

.search-shell__button {
  flex: 0 0 auto;
  align-self: stretch;
  border: none;
  border-radius: 12px;
  background: var(--color-brand-strong);
  color: #fff;
  padding: 0 1.2rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
}

.search-shell__button:hover:not(:disabled) {
  background: #0d6660;
}

.search-shell__button:disabled {
  cursor: wait;
  opacity: 0.75;
}

/* On phones the icon button reads awkwardly — drop it; Enter still submits. */
@media (max-width: 640px) {
  .search-shell__button {
    display: none;
  }
}
</style>
