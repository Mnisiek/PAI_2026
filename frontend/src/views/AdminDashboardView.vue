<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import MainLayout from '../layouts/MainLayout.vue'
import BaseCard from '../components/base/BaseCard.vue'
import SkeletonLoader from '../components/base/SkeletonLoader.vue'
import ActivityTrendChart from '../components/admin/ActivityTrendChart.vue'
import AdminNav from '../components/admin/AdminNav.vue'
import { analyticsService } from '../services/analytics.service'
import { catalogService } from '../services/catalog.service'
import type { ActivityStats } from '../types/activity'

const stats = ref<ActivityStats | null>(null)
const categoryNameById = ref(new Map<string, string>())
const isLoading = ref(true)
const isUpdating = ref(false)
const error = ref<string | null>(null)

const rangeDays = ref(7)
const RANGE_OPTIONS = [
  { label: 'Ostatnie 24h', days: 1 },
  { label: 'Ostatnie 7 dni', days: 7 },
  { label: 'Ostatnie 30 dni', days: 30 },
]

const EVENT_TYPE_LABELS: Record<string, string> = {
  VIEW: 'Wyświetlenia',
  CLICK: 'Kliknięcia',
  PRODUCT_DETAIL: 'Karta produktu',
  ADD_TO_CART: 'Do koszyka',
  PURCHASE: 'Zakupy',
  SEARCH: 'Wyszukiwania',
}

const eventTypeLabel = (type: string): string => EVENT_TYPE_LABELS[type] ?? type
const categoryLabel = (id: string): string => categoryNameById.value.get(id) ?? `Kategoria ${id}`

const numberFormat = new Intl.NumberFormat('pl-PL')
const fmt = (value: number): string => numberFormat.format(value)

const eventsByTypeMax = computed(() =>
  Math.max(1, ...(stats.value?.eventsByType.map((entry) => entry.count) ?? [])),
)
const topProductsMax = computed(() =>
  Math.max(1, ...(stats.value?.topProducts.map((entry) => entry.count) ?? [])),
)
const topCategoriesMax = computed(() =>
  Math.max(1, ...(stats.value?.topCategories.map((entry) => entry.count) ?? [])),
)

const pct = (value: number, max: number): string => `${Math.round((value / max) * 100)}%`

const dayInMs = 24 * 60 * 60 * 1000
const computeFrom = (days: number): string => new Date(Date.now() - days * dayInMs).toISOString()

const loadStats = async (isRangeChange = false): Promise<void> => {
  if (isRangeChange) {
    isUpdating.value = true
  } else {
    isLoading.value = true
  }
  error.value = null

  try {
    const [activityStats, categories] = await Promise.all([
      analyticsService.getActivityStats({
        from: computeFrom(rangeDays.value),
        to: new Date().toISOString(),
      }),
      catalogService.getCategories(),
    ])

    stats.value = activityStats
    categoryNameById.value = new Map(categories.map((category) => [category.id, category.name]))
  } catch (caught) {
    error.value =
      caught instanceof Error ? caught.message : 'Nie udało się pobrać statystyk aktywności.'
  } finally {
    isLoading.value = false
    isUpdating.value = false
  }
}

watch(rangeDays, () => {
  void loadStats(true)
})

onMounted(() => {
  void loadStats()
})
</script>

<template>
  <MainLayout>
    <div class="admin">
      <header class="admin__head">
        <div>
          <p class="admin__eyebrow">Panel administracyjny</p>
          <h1 class="admin__title">Statystyki aktywności</h1>
        </div>
      </header>

      <AdminNav />

      <div class="range" role="group" aria-label="Zakres czasu">
        <button
          v-for="option in RANGE_OPTIONS"
          :key="option.days"
          type="button"
          class="range__btn"
          :class="{ 'range__btn--active': rangeDays === option.days }"
          :aria-pressed="rangeDays === option.days"
          @click="rangeDays = option.days"
        >
          {{ option.label }}
        </button>
      </div>

      <SkeletonLoader v-if="isLoading && !stats" />

      <div v-else-if="error" class="admin__error" role="alert">
        <span>{{ error }}</span>
        <button type="button" class="admin__retry" @click="() => loadStats()">
          Spróbuj ponownie
        </button>
      </div>

      <Transition v-else-if="stats" name="stats" mode="out-in">
        <div :key="rangeDays" class="admin__content" :class="{ 'is-updating': isUpdating }">
        <section class="admin__summary">
          <BaseCard class="stat">
            <p class="stat__label">Zdarzenia</p>
            <p class="stat__value">{{ fmt(stats.summary.totalEvents) }}</p>
          </BaseCard>
          <BaseCard class="stat">
            <p class="stat__label">Sesje</p>
            <p class="stat__value">{{ fmt(stats.summary.uniqueSessions) }}</p>
          </BaseCard>
          <BaseCard class="stat">
            <p class="stat__label">Użytkownicy</p>
            <p class="stat__value">{{ fmt(stats.summary.uniqueUsers) }}</p>
          </BaseCard>
        </section>

        <BaseCard class="admin__panel">
          <h2 class="admin__panel-title">Aktywność w czasie</h2>
          <ActivityTrendChart :data="stats.eventsPerDayByType" :labels="EVENT_TYPE_LABELS" />
        </BaseCard>

        <section class="admin__columns">
          <BaseCard class="admin__panel">
            <h2 class="admin__panel-title">Zdarzenia wg typu</h2>
            <ul class="bars">
              <li v-for="entry in stats.eventsByType" :key="entry.type" class="bars__row">
                <span class="bars__label">{{ eventTypeLabel(entry.type) }}</span>
                <span class="bars__track">
                  <span class="bars__fill" :style="{ width: pct(entry.count, eventsByTypeMax) }" />
                </span>
                <span class="bars__value">{{ fmt(entry.count) }}</span>
              </li>
              <li v-if="!stats.eventsByType.length" class="bars__empty">Brak zdarzeń.</li>
            </ul>
          </BaseCard>

          <BaseCard class="admin__panel">
            <h2 class="admin__panel-title">Najczęściej oglądane produkty</h2>
            <ul class="bars">
              <li v-for="entry in stats.topProducts" :key="entry.productId" class="bars__row">
                <span class="bars__label">{{ entry.productName ?? `#${entry.productId}` }}</span>
                <span class="bars__track">
                  <span class="bars__fill" :style="{ width: pct(entry.count, topProductsMax) }" />
                </span>
                <span class="bars__value">{{ fmt(entry.count) }}</span>
              </li>
              <li v-if="!stats.topProducts.length" class="bars__empty">Brak danych.</li>
            </ul>
          </BaseCard>

          <BaseCard class="admin__panel">
            <h2 class="admin__panel-title">Najpopularniejsze kategorie</h2>
            <ul class="bars">
              <li v-for="entry in stats.topCategories" :key="entry.categoryId" class="bars__row">
                <span class="bars__label">{{ categoryLabel(entry.categoryId) }}</span>
                <span class="bars__track">
                  <span class="bars__fill" :style="{ width: pct(entry.count, topCategoriesMax) }" />
                </span>
                <span class="bars__value">{{ fmt(entry.count) }}</span>
              </li>
              <li v-if="!stats.topCategories.length" class="bars__empty">Brak danych.</li>
            </ul>
          </BaseCard>
        </section>
        </div>
      </Transition>
    </div>
  </MainLayout>
</template>

<style scoped>
.admin {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.admin__head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 0.5rem;
}

.admin__eyebrow {
  margin: 0;
  font-size: 0.76rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.admin__title {
  margin: 0.2rem 0 0;
  font-family: var(--font-heading);
  font-size: clamp(1.4rem, 4vw, 1.9rem);
  color: var(--color-text-primary);
}

.admin__head-actions {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
}

.admin__nav-link {
  font-size: 0.84rem;
  color: var(--color-brand-strong);
  text-decoration: none;
  border: 1px solid rgba(20, 184, 166, 0.4);
  border-radius: 999px;
  padding: 0.3rem 0.75rem;
}

.admin__nav-link:hover {
  background: rgba(20, 184, 166, 0.1);
}

.admin__error {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  border: 1px solid rgba(220, 38, 38, 0.25);
  border-radius: 14px;
  background: rgba(254, 242, 242, 0.88);
  color: #991b1b;
  padding: 0.9rem 1rem;
}

.admin__retry {
  flex: none;
  cursor: pointer;
  font-size: 0.84rem;
  font-weight: 600;
  color: #991b1b;
  background: transparent;
  border: 1px solid rgba(220, 38, 38, 0.4);
  border-radius: 999px;
  padding: 0.35rem 0.85rem;
}

.admin__retry:hover {
  background: rgba(220, 38, 38, 0.1);
}

.admin__content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  transition: opacity 0.2s ease;
}

.admin__content.is-updating {
  opacity: 0.6;
  pointer-events: none;
}

/* Crossfade the whole dashboard when the time range changes. */
.stats-enter-active,
.stats-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.stats-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.stats-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

@media (prefers-reduced-motion: reduce) {
  .admin__content,
  .stats-enter-active,
  .stats-leave-active {
    transition: none;
  }

  .stats-enter-from,
  .stats-leave-to {
    transform: none;
  }
}

.range {
  display: inline-flex;
  align-self: flex-start;
  gap: 0.25rem;
  padding: 0.25rem;
  border: 1px solid var(--color-border-soft);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.72);
}

.range__btn {
  cursor: pointer;
  font-size: 0.82rem;
  color: var(--color-text-secondary);
  background: transparent;
  border: none;
  border-radius: 999px;
  padding: 0.32rem 0.8rem;
  transition: background-color 0.16s ease, color 0.16s ease;
}

.range__btn:hover {
  color: var(--color-brand-strong);
}

.range__btn--active {
  background: var(--color-brand-strong);
  color: #fff;
}

.admin__summary {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.stat {
  padding: 1rem 1.1rem;
}

.stat__label {
  margin: 0;
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.stat__value {
  margin: 0.35rem 0 0;
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--color-brand-strong);
}

.admin__panel {
  padding: 1.1rem;
}

.admin__panel-title {
  margin: 0 0 0.9rem;
  font-size: 1rem;
  color: var(--color-text-primary);
}

.admin__columns {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(1, minmax(0, 1fr));
}

.bars {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.bars__row {
  display: grid;
  grid-template-columns: minmax(90px, 30%) minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.6rem;
}

.bars__label {
  font-size: 0.86rem;
  color: var(--color-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bars__track {
  height: 10px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.18);
  overflow: hidden;
}

.bars__fill {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #14b8a6, #0f766e);
  transition: width 0.3s ease;
}

.bars__value {
  font-size: 0.86rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.bars__empty {
  color: var(--color-text-secondary);
  font-size: 0.88rem;
}

@media (min-width: 760px) {
  .admin__columns {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .admin__summary {
    grid-template-columns: repeat(1, minmax(0, 1fr));
  }
}
</style>
