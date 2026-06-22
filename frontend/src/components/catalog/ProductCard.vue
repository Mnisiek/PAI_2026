<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import BaseCard from '../base/BaseCard.vue'
import { useCurrency } from '../../composables/useCurrency'
import type { Product } from '../../types/catalog'
import { useCartStore } from '../../stores/cart.store'
import { activityService } from '../../services/activity.service'

interface ProductCardProps {
  product: Product
}

const props = defineProps<ProductCardProps>()

const { formatPrice } = useCurrency()
const cartStore = useCartStore()
const isConfirmOpen = ref(false)

const addToCart = (): void => {
  cartStore.addToCart(props.product)
  isConfirmOpen.value = true
}

const trackDetailClick = (): void => {
  activityService.trackProductClick(props.product)
}

const closeConfirm = (): void => {
  isConfirmOpen.value = false
}

const goToCart = (): void => {
  cartStore.openCart()
  closeConfirm()
}

const handleKeydown = (event: KeyboardEvent): void => {
  if (event.key === 'Escape' && isConfirmOpen.value) {
    closeConfirm()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
  activityService.trackProductView(props.product)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div class="product-card-shell">
    <BaseCard class="product-card">
      <NuxtLink
        class="product-card__media"
        :to="`/product/${props.product.slug}`"
        @click="trackDetailClick"
      >
        <img
          :src="props.product.mainImageUrl"
          :alt="props.product.name"
          class="product-card__image"
          loading="lazy"
        />
      </NuxtLink>

      <div class="product-card__content">
        <h3 class="product-card__title">
          <NuxtLink
            class="product-card__title-link"
            :to="`/product/${props.product.slug}`"
            @click="trackDetailClick"
          >
            {{ props.product.name }}
          </NuxtLink>
        </h3>
        <p class="product-card__description">{{ props.product.description }}</p>
        <p class="product-card__price">{{ formatPrice(props.product.priceFrom.amount) }}</p>
        <button class="product-card__action" type="button" @click="addToCart">
          Dodaj do koszyka
        </button>
      </div>
    </BaseCard>

    <Teleport to="body">
      <Transition name="cart-confirm-fade">
        <div v-if="isConfirmOpen" class="cart-confirm-overlay" @click.self="closeConfirm">
          <div
            class="cart-confirm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cart-confirm-title"
          >
            <p class="cart-confirm__eyebrow">Koszyk</p>
            <h4 id="cart-confirm-title">Produkt dodany</h4>
            <p class="cart-confirm__message">
              Dodano "{{ props.product.name }}" do koszyka. Czy chcesz przejść teraz do koszyka?
            </p>

            <div class="cart-confirm__actions">
              <button type="button" class="cart-confirm__secondary" @click="closeConfirm">
                Kontynuuj zakupy
              </button>
              <button type="button" class="cart-confirm__primary" @click="goToCart">
                Przejdź do koszyka
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.product-card-shell {
  height: 100%;
}

.product-card {
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.product-card__media {
  display: block;
}

.product-card__image {
  width: 100%;
  height: 198px;
  object-fit: cover;
  display: block;
}

.product-card__title-link {
  color: inherit;
  text-decoration: none;
}

.product-card__title-link:hover {
  text-decoration: underline;
}

.product-card__content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
}

.product-card__title {
  margin: 0;
  font-size: 1.04rem;
  line-height: 1.25;
  color: var(--color-text-primary);
}

.product-card__description {
  margin: 0;
  font-size: 0.9rem;
  color: var(--color-text-secondary);
  min-height: 2.5rem;
  /* Keep cards uniform — the full prose lives on the product page. */
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-card__price {
  margin: 0.1rem 0 0;
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--color-brand-strong);
}

.product-card__action {
  margin-top: 0.35rem;
  border: none;
  border-radius: 12px;
  background: var(--color-brand-strong);
  color: #fff;
  padding: 0.65rem 0.82rem;
  font-size: 0.88rem;
  cursor: pointer;
  transition: background-color 0.16s ease;
}

.product-card__action:hover {
  background: #0d6660;
}

.cart-confirm-overlay {
  position: fixed;
  inset: 0;
  z-index: 70;
  display: grid;
  place-items: center;
  background: rgba(15, 23, 42, 0.44);
  backdrop-filter: blur(3px);
  padding: 1rem;
}

.cart-confirm {
  width: min(460px, 100%);
  border: 1px solid var(--color-border-soft);
  border-radius: 22px;
  background: linear-gradient(165deg, rgba(255, 255, 255, 0.96), rgba(240, 253, 250, 0.9));
  box-shadow: 0 35px 55px -35px rgba(15, 23, 42, 0.7);
  padding: 1.1rem;
}

.cart-confirm__eyebrow {
  margin: 0;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--color-text-muted);
  font-size: 0.73rem;
}

.cart-confirm h4 {
  margin: 0.4rem 0 0;
  font-size: 1.15rem;
  color: var(--color-text-primary);
}

.cart-confirm__message {
  margin: 0.75rem 0 0;
  color: var(--color-text-secondary);
  font-size: 0.94rem;
}

.cart-confirm__actions {
  margin-top: 1rem;
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.5rem;
}

.cart-confirm__secondary,
.cart-confirm__primary {
  border-radius: 11px;
  font-size: 0.86rem;
  padding: 0.55rem 0.88rem;
  cursor: pointer;
}

.cart-confirm__secondary {
  border: 1px solid var(--color-border-soft);
  background: #ffffff;
  color: var(--color-text-secondary);
}

.cart-confirm__primary {
  border: none;
  background: var(--color-brand-strong);
  color: #ffffff;
}

.cart-confirm-fade-enter-active,
.cart-confirm-fade-leave-active {
  transition: opacity 0.2s ease;
}

.cart-confirm-fade-enter-from,
.cart-confirm-fade-leave-to {
  opacity: 0;
}
</style>
