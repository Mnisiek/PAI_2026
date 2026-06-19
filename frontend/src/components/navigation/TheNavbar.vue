<script setup lang="ts">
import { computed, useSlots } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '../../stores/auth.store'
import { useCartStore } from '../../stores/cart.store'

const slots = useSlots()
const authStore = useAuthStore()
const cartStore = useCartStore()

const hasSearchSlot = computed(() => Boolean(slots.search))

const accountLabel = computed(() => {
  if (!authStore.user) {
    return 'Zaloguj'
  }

  return authStore.user.name
})

const openCart = (): void => {
  cartStore.openCart()
}
</script>

<template>
  <header class="top-nav">
    <div class="top-nav__brand-wrap">
      <p class="top-nav__badge">E-commerce</p>
      <h1 class="top-nav__brand">Oferty i kategorie</h1>
    </div>

    <div v-if="hasSearchSlot" class="top-nav__search-wrap">
      <slot name="search" />
    </div>

    <div class="top-nav__actions">
      <RouterLink class="top-nav__account-link" :to="authStore.isAuthenticated ? '/' : '/login'">
        {{ accountLabel }}
      </RouterLink>

      <button type="button" class="top-nav__cart-button" @click="openCart">
        Koszyk
        <span class="top-nav__cart-badge">{{ cartStore.totalItems }}</span>
      </button>

      <button
        v-if="authStore.isAuthenticated"
        type="button"
        class="top-nav__logout"
        @click="authStore.logout"
      >
        Wyloguj
      </button>
    </div>
  </header>
</template>

<style scoped>
.top-nav {
  display: grid;
  gap: 1rem;
  border: 1px solid var(--color-border-soft);
  border-radius: 26px;
  background: linear-gradient(125deg, rgba(255, 255, 255, 0.93), rgba(236, 253, 245, 0.78));
  box-shadow: 0 24px 45px -38px rgba(15, 23, 42, 0.85);
  padding: 1.1rem;
}

.top-nav__actions {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-start;
  gap: 0.5rem;
}

.top-nav__account-link,
.top-nav__logout {
  border: 1px solid var(--color-border-soft);
  background: #fff;
  border-radius: 999px;
  color: var(--color-text-secondary);
  padding: 0.46rem 0.85rem;
  font-size: 0.84rem;
}

.top-nav__logout {
  cursor: pointer;
}

.top-nav__cart-button {
  border: none;
  border-radius: 999px;
  background: var(--color-brand-strong);
  color: #fff;
  padding: 0.45rem 0.9rem;
  font-size: 0.84rem;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  cursor: pointer;
}

.top-nav__cart-badge {
  min-width: 1.25rem;
  height: 1.25rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.28);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
}

.top-nav__badge {
  margin: 0;
  font-size: 0.76rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.top-nav__brand {
  margin: 0.36rem 0 0;
  font-family: var(--font-heading);
  font-size: clamp(1.5rem, 4vw, 2rem);
  line-height: 1.1;
  color: var(--color-text-primary);
}

@media (min-width: 900px) {
  .top-nav {
    grid-template-columns: minmax(260px, 1fr) minmax(280px, 1fr) auto;
    align-items: center;
  }
}
</style>
