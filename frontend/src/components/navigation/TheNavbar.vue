<script setup lang="ts">
import { computed, onBeforeUnmount, ref, useSlots } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../../stores/auth.store'
import { useCartStore } from '../../stores/cart.store'

const slots = useSlots()
const route = useRoute()
const authStore = useAuthStore()
const cartStore = useCartStore()
const guestMenuOpen = ref(false)
let closeTimer: ReturnType<typeof setTimeout> | null = null

const hasSearchSlot = computed(() => Boolean(slots.search))
const isAuthPage = computed(() => route.path === '/login' || route.path === '/register')

const accountLabel = computed(() => {
  if (!authStore.user) {
    return 'Zaloguj'
  }

  return authStore.user.name
})

const openCart = (): void => {
  cartStore.openCart()
}

const cancelClose = (): void => {
  if (closeTimer) {
    clearTimeout(closeTimer)
    closeTimer = null
  }
}

const openGuestMenu = (): void => {
  cancelClose()
  guestMenuOpen.value = true
}

const closeGuestMenu = (): void => {
  cancelClose()
  closeTimer = setTimeout(() => {
    guestMenuOpen.value = false
    closeTimer = null
  }, 160)
}

const toggleGuestMenu = (): void => {
  guestMenuOpen.value = !guestMenuOpen.value
}

const onGuestMenuFocusOut = (event: FocusEvent): void => {
  const nextTarget = event.relatedTarget

  if (nextTarget instanceof Node && event.currentTarget instanceof Node && event.currentTarget.contains(nextTarget)) {
    return
  }

  cancelClose()
  guestMenuOpen.value = false
}

onBeforeUnmount(() => {
  cancelClose()
})
</script>

<template>
  <header class="top-nav">
    <NuxtLink class="top-nav__logo" to="/" aria-label="Strona główna — ofero">
      <svg class="top-nav__logo-mark" viewBox="0 0 32 32" aria-hidden="true">
        <path
          d="M8.4 12h15.2a2 2 0 0 1 1.99 2.2l-.93 9.6A3 3 0 0 1 21.68 26.5H10.32a3 3 0 0 1-2.98-2.7L6.4 14.2A2 2 0 0 1 8.4 12Z"
          fill="currentColor"
        />
        <path
          d="M12 12.5v-1.6a4 4 0 0 1 8 0v1.6"
          fill="none"
          stroke="currentColor"
          stroke-width="2.3"
          stroke-linecap="round"
        />
        <circle cx="16" cy="18.6" r="2.3" fill="#fff" />
      </svg>
      <span class="top-nav__logo-word">ofero</span>
    </NuxtLink>

    <div v-if="!isAuthPage && hasSearchSlot" class="top-nav__search-wrap">
      <slot name="search" />
    </div>

    <div v-if="!isAuthPage" class="top-nav__actions">
      <NuxtLink
        v-if="authStore.isAdmin"
        class="top-nav__account-link top-nav__link--wide"
        to="/admin"
        >Panel administracyjny</NuxtLink
      >

      <div
        v-if="!authStore.isAuthenticated"
        class="top-nav__account-menu"
        :class="{ 'top-nav__account-menu--open': guestMenuOpen }"
        @mouseenter="openGuestMenu"
        @mouseleave="closeGuestMenu"
        @focusout="onGuestMenuFocusOut"
      >
        <button
          type="button"
          class="top-nav__account-link top-nav__account-trigger"
          aria-haspopup="true"
          :aria-expanded="guestMenuOpen"
          @focus="openGuestMenu"
          @click="toggleGuestMenu"
          @keydown.esc="closeGuestMenu"
        >
          Zaloguj
        </button>

        <div v-if="guestMenuOpen" class="top-nav__account-popover">
          <NuxtLink class="top-nav__account-cta top-nav__account-cta--primary" to="/login" @click="closeGuestMenu">
            Zaloguj się
          </NuxtLink>

          
          <div class="top-nav__account-separator" aria-hidden="true">
            <span>Nie masz konta?</span>
          </div>

          <NuxtLink
            class="top-nav__account-cta top-nav__account-cta--secondary"
            to="/register"
            @click="closeGuestMenu"
          >
            Załóż konto
          </NuxtLink>
        </div>
      </div>

      <NuxtLink v-else class="top-nav__account-link" to="/">
        {{ accountLabel }}
      </NuxtLink>

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

.top-nav__account-menu {
  position: relative;
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

.top-nav__account-trigger {
  cursor: pointer;
}

.top-nav__account-menu--open .top-nav__account-trigger {
  border-color: rgba(20, 184, 166, 0.26);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(236, 253, 245, 0.88));
  color: var(--color-text-primary);
  box-shadow: 0 14px 26px -24px rgba(15, 23, 42, 0.75);
}

.top-nav__account-popover {
  position: absolute;
  top: calc(100% + 0.7rem);
  right: 0;
  z-index: 20;
  min-width: 250px;
  border: 1px solid rgba(20, 184, 166, 0.16);
  border-radius: 20px;
  background:
    radial-gradient(circle at top right, rgba(20, 184, 166, 0.12), transparent 34%),
    linear-gradient(145deg, rgba(255, 255, 255, 0.97), rgba(240, 253, 250, 0.93));
  box-shadow: 0 28px 44px -30px rgba(15, 23, 42, 0.42);
  backdrop-filter: blur(14px);
  padding: 0.9rem;
}

.top-nav__account-popover::before {
  content: '';
  position: absolute;
  top: -7px;
  right: 28px;
  width: 14px;
  height: 14px;
  background: rgba(248, 252, 251, 0.96);
  border-top: 1px solid rgba(20, 184, 166, 0.16);
  border-left: 1px solid rgba(20, 184, 166, 0.16);
  transform: rotate(45deg);
}

.top-nav__account-cta {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  border-radius: 14px;
  padding: 0.8rem 1rem;
  text-decoration: none;
  font-size: 0.96rem;
  transition: transform 0.18s ease, background-color 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
}

.top-nav__account-cta:hover {
  transform: translateY(-1px);
}

.top-nav__account-cta--primary {
  /*background: linear-gradient(135deg, var(--color-brand-strong), var(--color-brand-soft));*/
  background: var(--color-brand-strong);
  color: #fff;
  font-weight: 600;
  box-shadow: 0 18px 28px -22px rgba(15, 118, 110, 0.7);
  border-radius: 999px;
}

.top-nav__account-cta--secondary {
  border-color: rgba(148, 163, 184, 0.22);
  background: rgba(255, 255, 255, 0.82);
  color: var(--color-text-secondary);
  border-radius: 999px;
}

.top-nav__account-cta--secondary:hover {
  border-color: rgba(20, 184, 166, 0.22);
  background: rgba(240, 253, 250, 0.96);
}

.top-nav__account-separator {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  margin: 0.95rem 0;
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.top-nav__account-separator::before,
.top-nav__account-separator::after {
  content: '';
  flex: 1;
  height: 1px;
  background: rgba(148, 163, 184, 0.26);
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

.top-nav__logo {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  text-decoration: none;
  color: var(--color-brand-strong);
}

.top-nav__logo-mark {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
}

.top-nav__logo-word {
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 1.5rem;
  letter-spacing: -0.01em;
  color: var(--color-text-primary);
}

/* Declutter on phones: drop the badge and the secondary text links, keep the
   brand (links to the catalog), search, account/login and cart. */
@media (max-width: 767px) {
  .top-nav {
    padding: 0.85rem;
    gap: 0.75rem;
  }

  .top-nav__logo-word {
    font-size: 1.3rem;
  }

  .top-nav__link--wide {
    display: none;
  }

  .top-nav__actions {
    width: 100%;
    justify-content: space-between;
  }

  .top-nav__account-popover {
    right: auto;
    left: 0;
    min-width: min(280px, calc(100vw - 2rem));
  }

  .top-nav__account-popover::before {
    left: 28px;
    right: auto;
  }
}

@media (min-width: 900px) {
  .top-nav {
    grid-template-columns: minmax(260px, 1fr) minmax(280px, 1fr) auto;
    align-items: center;
  }
}
</style>
