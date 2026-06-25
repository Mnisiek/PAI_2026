<script setup lang="ts">
withDefaults(
  defineProps<{
    eyebrow?: string
    title?: string
    text?: string
    ctaLabel?: string
    ctaTo?: string
  }>(),
  {
    eyebrow: 'Sklep online',
    title: 'Wszystko, czego potrzebujesz — w jednym miejscu',
    text: 'Elektronika, dom, moda i więcej. Przeglądaj kategorie i znajdź najlepsze oferty.',
    ctaLabel: 'Przeglądaj oferty',
    ctaTo: '/offers',
  },
)
</script>

<template>
  <section class="hero-banner">
    <p class="hero-banner__eyebrow">{{ eyebrow }}</p>
    <h2 class="hero-banner__title">{{ title }}</h2>
    <p class="hero-banner__text">{{ text }}</p>
    <NuxtLink :to="ctaTo" class="hero-banner__cta">{{ ctaLabel }}</NuxtLink>
  </section>
</template>

<style scoped>
.hero-banner {
  border: 1px solid var(--color-border-soft);
  border-radius: 24px;
  background:
    radial-gradient(900px 240px at 12% -40%, rgba(20, 184, 166, 0.22), transparent),
    radial-gradient(700px 220px at 90% -30%, rgba(56, 189, 248, 0.18), transparent),
    linear-gradient(120deg, rgba(255, 255, 255, 0.9), rgba(236, 253, 245, 0.8));
  padding: clamp(1.2rem, 4vw, 2.4rem);
  margin-bottom: 0.95rem;
}

.hero-banner__eyebrow {
  margin: 0;
  font-size: 0.74rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.hero-banner__title {
  margin: 0.4rem 0 0;
  font-size: clamp(1.4rem, 4vw, 2.1rem);
  line-height: 1.15;
  color: var(--color-text-primary);
  max-width: 34ch;
}

.hero-banner__text {
  margin: 0.5rem 0 0;
  color: var(--color-text-secondary);
  max-width: 46ch;
}

.hero-banner__cta {
  margin-top: 1rem;
  display: inline-flex;
  text-decoration: none;
  border-radius: 12px;
  background: var(--color-brand-strong);
  color: #fff;
  padding: 0.65rem 1.2rem;
  font-size: 0.92rem;
}

.hero-banner__cta:hover {
  background: #0d6660;
}
</style>
