<script setup lang="ts">
import { computed } from 'vue'
import { useCurrency } from '../../composables/useCurrency'
import { useCartStore } from '../../stores/cart.store'

const cartStore = useCartStore()
const { formatPrice } = useCurrency()

const isEmpty = computed(() => cartStore.items.length === 0)

const closeDrawer = (): void => {
  cartStore.closeCart()
}

const decreaseQuantity = (productId: string): void => {
  cartStore.updateQuantity(productId, -1)
}

const increaseQuantity = (productId: string): void => {
  cartStore.updateQuantity(productId, 1)
}
</script>

<template>
  <Transition name="drawer-fade">
    <div v-if="cartStore.isOpen" class="cart-overlay" @click.self="closeDrawer">
      <aside class="cart-drawer" aria-label="Koszyk zakupowy">
        <header class="cart-drawer__header">
          <h2>Twój koszyk</h2>
          <button type="button" class="cart-drawer__close" @click="closeDrawer">Zamknij</button>
        </header>

        <p v-if="isEmpty" class="cart-drawer__empty">Koszyk jest pusty.</p>

        <ul v-else class="cart-list">
          <li v-for="item in cartStore.items" :key="item.id" class="cart-item">
            <img :src="item.imageUrl" :alt="item.title" class="cart-item__image" loading="lazy" />

            <div class="cart-item__meta">
              <h3>{{ item.title }}</h3>
              <p>{{ formatPrice(item.price) }}</p>
            </div>

            <div class="cart-item__quantity">
              <button type="button" @click="decreaseQuantity(item.id)">-</button>
              <span>{{ item.quantity }}</span>
              <button type="button" @click="increaseQuantity(item.id)">+</button>
            </div>
          </li>
        </ul>

        <footer class="cart-footer">
          <p>Razem: <strong>{{ formatPrice(cartStore.totalPrice) }}</strong></p>
          <button
            type="button"
            class="cart-footer__checkout"
            :disabled="isEmpty"
            @click="cartStore.clearCart"
          >
            Mock checkout
          </button>
        </footer>
      </aside>
    </div>
  </Transition>
</template>

<style scoped>
.cart-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(2px);
  display: flex;
  justify-content: flex-end;
}

.cart-drawer {
  width: min(420px, 100%);
  height: 100%;
  background: #ffffff;
  border-left: 1px solid var(--color-border-soft);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.cart-drawer__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.cart-drawer__header h2 {
  margin: 0;
  font-size: 1.2rem;
}

.cart-drawer__close {
  border: 1px solid var(--color-border-soft);
  background: #fff;
  color: var(--color-text-secondary);
  border-radius: 999px;
  padding: 0.35rem 0.8rem;
  cursor: pointer;
}

.cart-drawer__empty {
  margin: 0;
  color: var(--color-text-secondary);
}

.cart-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  overflow: auto;
}

.cart-item {
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr) auto;
  gap: 0.7rem;
  align-items: center;
  border: 1px solid var(--color-border-soft);
  border-radius: 14px;
  padding: 0.45rem;
}

.cart-item__image {
  width: 64px;
  height: 64px;
  object-fit: cover;
  border-radius: 10px;
}

.cart-item__meta h3 {
  margin: 0;
  font-size: 0.92rem;
}

.cart-item__meta p {
  margin: 0.35rem 0 0;
  color: var(--color-text-secondary);
  font-size: 0.84rem;
}

.cart-item__quantity {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
}

.cart-item__quantity button {
  width: 24px;
  height: 24px;
  border: 1px solid var(--color-border-soft);
  background: #fff;
  border-radius: 6px;
  cursor: pointer;
}

.cart-footer {
  margin-top: auto;
  border-top: 1px solid var(--color-border-soft);
  padding-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}

.cart-footer p {
  margin: 0;
}

.cart-footer__checkout {
  border: none;
  border-radius: 12px;
  background: var(--color-brand-strong);
  color: #fff;
  padding: 0.7rem 0.95rem;
  font-size: 0.92rem;
  cursor: pointer;
}

.cart-footer__checkout:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.drawer-fade-enter-active,
.drawer-fade-leave-active {
  transition: opacity 0.2s ease;
}

.drawer-fade-enter-from,
.drawer-fade-leave-to {
  opacity: 0;
}
</style>
