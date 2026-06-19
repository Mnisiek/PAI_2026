<script setup lang="ts">
import { computed } from 'vue'

interface BaseInputProps {
  modelValue: string
  placeholder?: string
  disabled?: boolean
  type?: 'text' | 'email' | 'password' | 'search'
  autocomplete?: string
}

const props = withDefaults(defineProps<BaseInputProps>(), {
  placeholder: '',
  disabled: false,
  type: 'text',
  autocomplete: 'off',
})

const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void
}>()

const value = computed({
  get: () => props.modelValue,
  set: (nextValue: string) => emit('update:modelValue', nextValue),
})
</script>

<template>
  <input
    v-model="value"
    :placeholder="placeholder"
    :disabled="disabled"
    :type="type"
    :autocomplete="autocomplete"
    class="base-input"
  />
</template>

<style scoped>
.base-input {
  width: 100%;
  border: 1px solid var(--color-border-soft);
  background: rgba(248, 250, 252, 0.88);
  color: var(--color-text-primary);
  border-radius: 999px;
  padding: 0.72rem 1rem;
  font-size: 0.98rem;
  line-height: 1.2;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.base-input::placeholder {
  color: var(--color-text-muted);
}

.base-input:focus-visible {
  outline: none;
  border-color: var(--color-brand-strong);
  box-shadow: 0 0 0 4px rgba(15, 118, 110, 0.18);
  background: #fff;
}

.base-input:disabled {
  cursor: wait;
  opacity: 0.72;
}
</style>
