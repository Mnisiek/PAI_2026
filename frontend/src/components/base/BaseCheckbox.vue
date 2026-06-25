<script setup lang="ts">
withDefaults(
  defineProps<{
    modelValue: boolean
    label: string
    /** Optional trailing hint, e.g. a facet count. */
    count?: number | null
    disabled?: boolean
  }>(),
  {
    count: null,
    disabled: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()
</script>

<template>
  <label class="checkbox" :class="{ 'checkbox--disabled': disabled }">
    <input
      type="checkbox"
      class="checkbox__input"
      :checked="modelValue"
      :disabled="disabled"
      @change="emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
    />
    <span class="checkbox__label">{{ label }}</span>
    <span v-if="count != null" class="checkbox__count">{{ count }}</span>
  </label>
</template>

<style scoped>
.checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.86rem;
  color: var(--color-text-primary);
  cursor: pointer;
  padding: 0.2rem 0;
}

.checkbox--disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.checkbox__input {
  width: 1rem;
  height: 1rem;
  accent-color: var(--color-brand-strong);
  cursor: inherit;
}

.checkbox__label {
  flex: 1;
}

.checkbox__count {
  font-size: 0.76rem;
  color: var(--color-text-muted);
}
</style>
