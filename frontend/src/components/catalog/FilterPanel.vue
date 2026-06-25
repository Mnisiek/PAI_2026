<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import BaseCheckbox from '../base/BaseCheckbox.vue'
import { useCatalogStore } from '../../stores/catalog.store'

const store = useCatalogStore()

// Price inputs are applied on change (not per keystroke); mirror the store so a
// category switch / "clear" resets them.
const priceMin = ref<number | null>(store.priceMin)
const priceMax = ref<number | null>(store.priceMax)

watch(
  () => [store.priceMin, store.priceMax] as const,
  ([min, max]) => {
    priceMin.value = min
    priceMax.value = max
  },
)

// Local numeric-range inputs per NUMBER facet, keyed by attribute code.
const numRanges = reactive<Record<string, { min: number | null; max: number | null }>>({})

// Rebuild local ranges when the facet set changes (i.e. on category change).
watch(
  () => store.facets,
  (facets) => {
    for (const key of Object.keys(numRanges)) delete numRanges[key]
    for (const facet of facets) {
      if (facet.dataType === 'NUMBER') {
        const selection = store.attributeFilters[facet.code]
        numRanges[facet.code] = { min: selection?.min ?? null, max: selection?.max ?? null }
      }
    }
  },
  { immediate: true },
)

const applyPrice = (): void => {
  void store.setPriceRange(priceMin.value, priceMax.value)
}

const applyRange = (code: string): void => {
  const range = numRanges[code]
  void store.setAttributeRange(code, range?.min ?? null, range?.max ?? null)
}

const isChecked = (code: string, value: string): boolean =>
  store.attributeFilters[code]?.values?.includes(value) ?? false

const toggleValue = (code: string, value: string, checked: boolean): void => {
  const current = store.attributeFilters[code]?.values ?? []
  const next = checked ? [...current, value] : current.filter((existing) => existing !== value)
  void store.setAttributeValues(code, next)
}

// BOOL facets come back as 'true'/'false' string options.
const optionLabel = (dataType: string, value: string): string => {
  if (dataType === 'BOOL') return value === 'true' ? 'Tak' : 'Nie'
  return value
}
</script>

<template>
  <section class="filters" aria-label="Filtry">
    <header class="filters__head">
      <h3 class="filters__subtitle">Filtry</h3>
      <button
        v-if="store.hasActiveFacetFilters"
        type="button"
        class="filters__clear"
        :disabled="store.isLoading"
        @click="store.clearFilters()"
      >
        Wyczyść
      </button>
    </header>

    <div class="filters__group">
      <h4 class="filters__label">Cena (PLN)</h4>
      <div class="filters__range">
        <input
          v-model.number="priceMin"
          type="number"
          min="0"
          step="0.01"
          placeholder="od"
          aria-label="Cena od"
          @change="applyPrice"
        />
        <span class="filters__dash">–</span>
        <input
          v-model.number="priceMax"
          type="number"
          min="0"
          step="0.01"
          placeholder="do"
          aria-label="Cena do"
          @change="applyPrice"
        />
      </div>
    </div>

    <div class="filters__group">
      <BaseCheckbox
        :model-value="store.inStock"
        label="Tylko dostępne"
        @update:model-value="store.setInStock($event)"
      />
    </div>

    <div v-for="facet in store.facets" :key="facet.code" class="filters__group">
      <h4 class="filters__label">
        {{ facet.name }}<span v-if="facet.unit" class="filters__unit"> ({{ facet.unit }})</span>
      </h4>

      <div v-if="facet.dataType === 'NUMBER'" class="filters__range">
        <input
          v-model.number="numRanges[facet.code].min"
          type="number"
          step="any"
          :placeholder="facet.min != null ? String(facet.min) : 'od'"
          :aria-label="`${facet.name} od`"
          @change="applyRange(facet.code)"
        />
        <span class="filters__dash">–</span>
        <input
          v-model.number="numRanges[facet.code].max"
          type="number"
          step="any"
          :placeholder="facet.max != null ? String(facet.max) : 'do'"
          :aria-label="`${facet.name} do`"
          @change="applyRange(facet.code)"
        />
      </div>

      <div v-else class="filters__options">
        <BaseCheckbox
          v-for="option in facet.options"
          :key="option.value"
          :model-value="isChecked(facet.code, option.value)"
          :label="optionLabel(facet.dataType, option.value)"
          :count="option.count"
          @update:model-value="toggleValue(facet.code, option.value, $event)"
        />
      </div>
    </div>
  </section>
</template>

<style scoped>
.filters {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.filters__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.6rem;
}

.filters__subtitle {
  margin: 0;
  font-size: 0.82rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.filters__clear {
  border: none;
  background: transparent;
  color: var(--color-brand-strong);
  font-size: 0.78rem;
  cursor: pointer;
  padding: 0;
}

.filters__clear:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.filters__group {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.filters__label {
  margin: 0;
  font-size: 0.84rem;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.filters__unit {
  color: var(--color-text-muted);
  font-weight: 400;
}

.filters__range {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.filters__range input {
  width: 100%;
  min-width: 0;
  border: 1px solid var(--color-border-soft);
  border-radius: 10px;
  padding: 0.4rem 0.55rem;
  font: inherit;
  color: var(--color-text-primary);
  background: #fff;
}

.filters__range input:focus {
  outline: none;
  border-color: var(--color-brand-strong);
}

.filters__dash {
  color: var(--color-text-muted);
}

.filters__options {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}
</style>
