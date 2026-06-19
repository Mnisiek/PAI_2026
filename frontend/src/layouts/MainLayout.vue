<script setup lang="ts">
import { useSlots } from 'vue'
import TheNavbar from '../components/navigation/TheNavbar.vue'
import CartDrawer from '../components/cart/CartDrawer.vue'

const slots = useSlots()
</script>

<template>
  <div class="main-layout">
    <TheNavbar>
      <template v-if="slots.search" #search>
        <slot name="search" />
      </template>
    </TheNavbar>

    <main class="main-layout__content">
      <slot />
    </main>

    <CartDrawer />
  </div>
</template>

<style scoped>
.main-layout {
  max-width: 1220px;
  margin: 0 auto;
  padding: 1.2rem 1rem 2.2rem;
}

.main-layout__content {
  margin-top: 1rem;
}

@media (min-width: 800px) {
  .main-layout {
    padding-inline: 1.5rem;
  }
}
</style>
