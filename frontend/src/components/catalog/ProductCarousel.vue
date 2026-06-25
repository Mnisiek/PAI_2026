<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useCurrency } from '../../composables/useCurrency'
import type { CarouselProduct } from '../../types/catalog'

// Renders nothing when there are no products, so optional sections (e.g. "picked
// for you") simply disappear when empty.
const props = withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    products: CarouselProduct[]
    /** Auto-advance over time. Disable for a stationary carousel (arrows only). */
    autoRotate?: boolean
  }>(),
  {
    subtitle: '',
    autoRotate: true,
  },
)

const { formatPrice } = useCurrency()

const track = ref<HTMLElement | null>(null)
const canScrollLeft = ref(false)
const canScrollRight = ref(false)

const updateArrows = (): void => {
  const el = track.value
  if (!el) {
    return
  }
  canScrollLeft.value = el.scrollLeft > 2
  canScrollRight.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 2
}

const scrollByPage = (direction: 1 | -1): void => {
  const el = track.value
  if (!el) {
    return
  }
  // Scroll roughly one viewport of cards at a time.
  el.scrollBy({ left: direction * Math.max(el.clientWidth * 0.85, 200), behavior: 'smooth' })
}

// --- Auto-rotation: advance one card every few seconds, loop at the end,
// pause on hover/focus, and stay off when motion is reduced or nothing overflows.
const AUTO_INTERVAL_MS = 3500
const paused = ref(false)
let autoTimer: ReturnType<typeof setInterval> | null = null

const autoAdvance = (): void => {
  const el = track.value
  if (!el || paused.value) {
    return
  }
  if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 2) {
    el.scrollTo({ left: 0, behavior: 'smooth' })
    return
  }
  const firstCard = el.firstElementChild as HTMLElement | null
  const step = firstCard ? firstCard.offsetWidth + 10 : el.clientWidth * 0.85
  el.scrollBy({ left: step, behavior: 'smooth' })
}

const stopAuto = (): void => {
  if (autoTimer) {
    clearInterval(autoTimer)
    autoTimer = null
  }
}

const startAuto = (): void => {
  stopAuto()
  const el = track.value
  if (!el || el.scrollWidth <= el.clientWidth) {
    return
  }
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return
  }
  autoTimer = setInterval(autoAdvance, AUTO_INTERVAL_MS)
}

onMounted(() => {
  void nextTick(() => {
    updateArrows()
    startAuto()
  })
  window.addEventListener('resize', updateArrows)
})
onBeforeUnmount(() => {
  stopAuto()
  window.removeEventListener('resize', updateArrows)
})

// Recompute reachability and restart rotation when the product set changes.
watch(
  () => props.products,
  () =>
    void nextTick(() => {
      updateArrows()
      startAuto()
    }),
)
</script>

<template>
  <section
    v-if="products.length"
    class="collection"
    @mouseenter="paused = true"
    @mouseleave="paused = false"
    @focusin="paused = true"
    @focusout="paused = false"
  >
    <header class="collection__head">
      <div>
        <h3>{{ title }}</h3>
        <p v-if="subtitle">{{ subtitle }}</p>
      </div>
      <div class="collection__nav">
        <button
          type="button"
          class="collection__nav-btn"
          :disabled="!canScrollLeft"
          aria-label="Przewiń w lewo"
          @click="scrollByPage(-1)"
        >
          ‹
        </button>
        <button
          type="button"
          class="collection__nav-btn"
          :disabled="!canScrollRight"
          aria-label="Przewiń w prawo"
          @click="scrollByPage(1)"
        >
          ›
        </button>
      </div>
    </header>

    <div ref="track" class="carousel" @scroll="updateArrows">
      <NuxtLink
        v-for="product in products"
        :key="product.id"
        :to="`/product/${product.slug}`"
        class="carousel__card"
      >
        <img
          :src="product.mainImageUrl"
          :alt="product.name"
          class="carousel__image"
          loading="lazy"
        />
        <div class="carousel__content">
          <p class="carousel__name">{{ product.name }}</p>
          <p class="carousel__price">od {{ formatPrice(product.priceFrom.amount) }}</p>
        </div>
      </NuxtLink>
    </div>
  </section>
</template>

<style scoped>
.collection {
  /* min-width:0 lets this shrink within its grid/flex parent so the carousel
     scrolls internally instead of stretching the page. */
  min-width: 0;
  border: 1px solid var(--color-border-soft);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.82);
  padding: 0.8rem;
}

.collection__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.7rem;
  margin-bottom: 0.6rem;
}

.collection__head h3 {
  margin: 0;
  font-size: 1rem;
  color: var(--color-text-primary);
}

.collection__head p {
  margin: 0.1rem 0 0;
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.collection__nav {
  display: inline-flex;
  gap: 0.35rem;
  flex-shrink: 0;
}

.collection__nav-btn {
  width: 2rem;
  height: 2rem;
  border-radius: 999px;
  border: 1px solid var(--color-border-soft);
  background: #fff;
  color: var(--color-text-secondary);
  font-size: 1.2rem;
  line-height: 1;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.16s ease, color 0.16s ease, opacity 0.16s ease;
}

.collection__nav-btn:hover:not(:disabled) {
  border-color: var(--color-brand-strong);
  color: var(--color-brand-strong);
}

.collection__nav-btn:disabled {
  opacity: 0.35;
  cursor: default;
}

.carousel {
  display: flex;
  min-width: 0;
  gap: 0.6rem;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  /* Hidden scrollbar — navigation is via the arrow buttons (touch swipe still works). */
  scrollbar-width: none;
  -ms-overflow-style: none;
  -webkit-overflow-scrolling: touch;
}

.carousel::-webkit-scrollbar {
  display: none;
}

.carousel__card {
  flex: 0 0 auto;
  width: 168px;
  scroll-snap-align: start;
  text-decoration: none;
  border: 1px solid var(--color-border-soft);
  border-radius: 14px;
  background: #fff;
  overflow: hidden;
  color: inherit;
  transition: border-color 0.16s ease, transform 0.16s ease;
}

.carousel__card:hover {
  border-color: rgba(15, 118, 110, 0.36);
  transform: translateY(-2px);
}

.carousel__image {
  width: 100%;
  height: 120px;
  object-fit: cover;
  display: block;
}

.carousel__content {
  padding: 0.55rem 0.65rem;
}

.carousel__name {
  margin: 0;
  color: var(--color-text-primary);
  font-size: 0.86rem;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.carousel__price {
  margin: 0.32rem 0 0;
  color: var(--color-brand-strong);
  font-size: 0.82rem;
  font-weight: 600;
}
</style>
