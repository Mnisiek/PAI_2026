<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    image?: string
    eyebrow?: string
    title?: string
    text?: string
    ctaLabel?: string
    ctaTo?: string
  }>(),
  {
    image:
      'https://images.unsplash.com/photo-1607083206968-13611e3d76db?auto=format&fit=crop&w=1600&q=80',
    eyebrow: 'Wyprzedaż',
    title: 'Letnie okazje do -50%',
    text: 'Wybrane produkty w wyjątkowych cenach — tylko przez ograniczony czas.',
    ctaLabel: 'Zobacz oferty',
    ctaTo: '/offers',
  },
)

const backgroundStyle = computed(() => ({ backgroundImage: `url('${props.image}')` }))
</script>

<template>
  <NuxtLink :to="ctaTo" class="hero" :style="backgroundStyle">
    <div class="hero__overlay">
      <p class="hero__eyebrow">{{ eyebrow }}</p>
      <h2 class="hero__title">{{ title }}</h2>
      <p class="hero__text">{{ text }}</p>
      <span class="hero__cta">{{ ctaLabel }}</span>
    </div>
  </NuxtLink>
</template>

<style scoped>
.hero {
  position: relative;
  display: block;
  text-decoration: none;
  min-height: clamp(240px, 40vw, 400px);
  border-radius: 24px;
  overflow: hidden;
  background-color: #0f172a;
  background-size: cover;
  background-position: center;
  margin-bottom: 0.95rem;
}

.hero__overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.35rem;
  padding: clamp(1.2rem, 5vw, 3rem);
  color: #fff;
  background: linear-gradient(
    90deg,
    rgba(15, 23, 42, 0.78) 0%,
    rgba(15, 23, 42, 0.45) 45%,
    rgba(15, 23, 42, 0.05) 100%
  );
}

.hero__eyebrow {
  margin: 0;
  font-family: var(--font-heading);
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  font-size: 0.82rem;
  color: #fbbf24;
}

.hero__title {
  margin: 0.3rem 0 0;
  font-size: clamp(1.8rem, 5vw, 3rem);
  line-height: 1.05;
  max-width: 18ch;
  text-shadow: 0 2px 18px rgba(0, 0, 0, 0.45);
}

.hero__text {
  margin: 0.55rem 0 0;
  font-size: clamp(0.9rem, 2vw, 1.05rem);
  max-width: 38ch;
  color: rgba(255, 255, 255, 0.92);
}

.hero__cta {
  margin-top: 1.1rem;
  display: inline-flex;
  align-self: flex-start;
  border-radius: 12px;
  background: #fff;
  color: var(--color-text-primary);
  padding: 0.7rem 1.3rem;
  font-size: 0.95rem;
  font-weight: 600;
}

.hero:hover .hero__cta {
  background: #fbbf24;
}
</style>
