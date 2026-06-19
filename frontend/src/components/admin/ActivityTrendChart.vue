<script setup lang="ts">
import { computed } from 'vue'
import type { DailyCount } from '../../types/activity'

const props = defineProps<{ points: DailyCount[] }>()

const W = 720
const H = 260
const padL = 40
const padR = 16
const padT = 16
const padB = 28
const innerW = W - padL - padR
const innerH = H - padT - padB

const count = computed(() => props.points.length)
const yMax = computed(() => Math.max(1, ...props.points.map((point) => point.count)))

const xAt = (index: number): number =>
  count.value <= 1 ? padL + innerW / 2 : padL + (index / (count.value - 1)) * innerW

const yAt = (value: number): number => padT + innerH - (value / yMax.value) * innerH

const formatDay = (day: string): string => {
  const parts = day.split('-')
  return parts.length === 3 ? `${parts[2]}.${parts[1]}` : day
}

const coords = computed(() =>
  props.points.map((point, index) => ({
    x: xAt(index),
    y: yAt(point.count),
    day: point.day,
    countValue: point.count,
  })),
)

const linePath = computed(() =>
  coords.value
    .map((coord, index) => `${index === 0 ? 'M' : 'L'}${coord.x.toFixed(1)},${coord.y.toFixed(1)}`)
    .join(' '),
)

const areaPath = computed(() => {
  if (!coords.value.length) {
    return ''
  }
  const baseline = padT + innerH
  const first = coords.value[0]
  const last = coords.value[coords.value.length - 1]
  const middle = coords.value.map((coord) => `L${coord.x.toFixed(1)},${coord.y.toFixed(1)}`).join(' ')
  return `M${first.x.toFixed(1)},${baseline} ${middle} L${last.x.toFixed(1)},${baseline} Z`
})

const gridLines = computed(() => {
  const steps = 4
  const lines = []
  for (let step = 0; step <= steps; step += 1) {
    const value = (yMax.value / steps) * step
    lines.push({ y: yAt(value), value: Math.round(value) })
  }
  return lines
})

const xLabels = computed(() => {
  if (!coords.value.length) {
    return []
  }
  const maxLabels = 6
  const stride = Math.max(1, Math.ceil(coords.value.length / maxLabels))
  return coords.value
    .filter((_, index) => index % stride === 0 || index === coords.value.length - 1)
    .map((coord) => ({ x: coord.x, label: formatDay(coord.day) }))
})
</script>

<template>
  <div class="trend">
    <p v-if="!points.length" class="trend__empty">Brak danych w wybranym okresie.</p>

    <svg
      v-else
      class="trend__svg"
      :viewBox="`0 0 ${W} ${H}`"
      preserveAspectRatio="none"
      role="img"
      aria-label="Liczba zdarzeń w czasie"
    >
      <defs>
        <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="rgba(20, 184, 166, 0.35)" />
          <stop offset="100%" stop-color="rgba(20, 184, 166, 0)" />
        </linearGradient>
      </defs>

      <!-- gridlines + y labels -->
      <g class="trend__grid">
        <line
          v-for="line in gridLines"
          :key="`g-${line.value}`"
          :x1="padL"
          :x2="W - padR"
          :y1="line.y"
          :y2="line.y"
        />
        <text
          v-for="line in gridLines"
          :key="`t-${line.value}`"
          class="trend__y-label"
          :x="padL - 6"
          :y="line.y + 3"
          text-anchor="end"
        >
          {{ line.value }}
        </text>
      </g>

      <path :d="areaPath" fill="url(#trend-fill)" />
      <path :d="linePath" class="trend__line" fill="none" />

      <circle
        v-for="coord in coords"
        :key="`p-${coord.day}`"
        class="trend__dot"
        :cx="coord.x"
        :cy="coord.y"
        r="3"
      >
        <title>{{ coord.day }}: {{ coord.countValue }}</title>
      </circle>

      <text
        v-for="label in xLabels"
        :key="`x-${label.label}`"
        class="trend__x-label"
        :x="label.x"
        :y="H - 8"
        text-anchor="middle"
      >
        {{ label.label }}
      </text>
    </svg>
  </div>
</template>

<style scoped>
.trend {
  width: 100%;
}

.trend__svg {
  width: 100%;
  height: auto;
  display: block;
}

.trend__empty {
  margin: 0;
  padding: 2rem 0;
  text-align: center;
  color: var(--color-text-secondary);
}

.trend__grid line {
  stroke: rgba(148, 163, 184, 0.3);
  stroke-width: 1;
  stroke-dasharray: 3 4;
}

.trend__y-label,
.trend__x-label {
  fill: var(--color-text-muted);
  font-size: 11px;
}

.trend__line {
  stroke: var(--color-brand-strong);
  stroke-width: 2.5;
  stroke-linejoin: round;
  stroke-linecap: round;
}

.trend__dot {
  fill: var(--color-brand-strong);
  stroke: #fff;
  stroke-width: 1.5;
}
</style>
