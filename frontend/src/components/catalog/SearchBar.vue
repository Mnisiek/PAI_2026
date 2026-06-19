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

    <button type="submit" class="search-shell__button" :disabled="loading" aria-label="Szukaj">
      ⌕
    </button>
  </form>
</template>

<style scoped>
.search-shell {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

.search-shell__button {
  border: none;
  border-radius: 999px;
  background: var(--color-brand-strong);
  color: #fff;
  width: 2.5rem;
  height: 2.5rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1.05rem;
}

.search-shell__button:disabled {
  cursor: wait;
  opacity: 0.75;
}
</style>
