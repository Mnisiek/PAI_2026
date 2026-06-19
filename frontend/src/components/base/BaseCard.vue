<template>
  <article class="base-card">
    <slot />
  </article>
</template>

<style scoped>
.base-card {
  border: 1px solid var(--color-border-soft);
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 20px 35px -28px rgba(2, 6, 23, 0.65);
  border-radius: 20px;
}
</style>
