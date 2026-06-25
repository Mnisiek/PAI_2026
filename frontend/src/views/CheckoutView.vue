<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import MainLayout from '../layouts/MainLayout.vue'
import BaseInput from '../components/base/BaseInput.vue'
import { useAuthStore } from '../stores/auth.store'
import { useCartStore } from '../stores/cart.store'
import { useCurrency } from '../composables/useCurrency'

type ShippingMethod = 'courier' | 'parcel' | 'pickup'
type PaymentMethod = 'card' | 'blik' | 'transfer' | 'cash'

const cartStore = useCartStore()
const authStore = useAuthStore()
const router = useRouter()
const { formatPrice } = useCurrency()

const isSubmitting = ref(false)
const orderPlaced = ref(false)
const orderNumber = ref('')
const placedTotal = ref(0)
const validationError = ref<string | null>(null)

const shippingMethod = ref<ShippingMethod>('courier')
const paymentMethod = ref<PaymentMethod>('card')
const firstName = ref('')
const lastName = ref('')
const email = ref(authStore.user?.email ?? '')
const phone = ref('')
const street = ref('')
const postalCode = ref('')
const city = ref('')

const isCartEmpty = computed(() => cartStore.items.length === 0)

const shippingLabel = computed(() => {
  if (shippingMethod.value === 'courier') return 'Kurier'
  if (shippingMethod.value === 'parcel') return 'Paczkomat'
  return 'Odbior osobisty'
})

const paymentLabel = computed(() => {
  if (paymentMethod.value === 'card') return 'Karta online'
  if (paymentMethod.value === 'blik') return 'BLIK'
  if (paymentMethod.value === 'transfer') return 'Szybki przelew'
  return 'Platnosc przy odbiorze'
})

const validateForm = (): boolean => {
  if (!firstName.value.trim() || !lastName.value.trim()) {
    validationError.value = 'Podaj imie i nazwisko.'
    return false
  }

  if (!email.value.trim() || !email.value.includes('@')) {
    validationError.value = 'Podaj poprawny adres email.'
    return false
  }

  if (!phone.value.trim() || phone.value.trim().length < 9) {
    validationError.value = 'Podaj poprawny numer telefonu.'
    return false
  }

  if (!street.value.trim() || !postalCode.value.trim() || !city.value.trim()) {
    validationError.value = 'Uzupelnij dane adresowe.'
    return false
  }

  return true
}

const submitOrder = async (): Promise<void> => {
  validationError.value = null

  if (isCartEmpty.value) {
    validationError.value = 'Koszyk jest pusty.'
    return
  }

  if (!validateForm()) {
    return
  }

  isSubmitting.value = true

  try {
    placedTotal.value = cartStore.totalPrice
    cartStore.checkout()

    orderNumber.value = `PAI-${Date.now().toString().slice(-8)}`
    orderPlaced.value = true
  } finally {
    isSubmitting.value = false
  }
}

const goToOffers = async (): Promise<void> => {
  await router.push('/offers')
}
</script>

<template>
  <MainLayout>
    <section class="checkout-shell">
      <article v-if="orderPlaced" class="checkout-card checkout-card--success">
        <p class="checkout-card__eyebrow">Zamówienie przyjęte</p>
        <h2>Dziekujemy za zakupy</h2>
        <p class="checkout-card__hint">
          Numer zamówienia: <strong>{{ orderNumber }}</strong>
        </p>

        <dl class="checkout-summary">
          <div>
            <dt>Dostawa</dt>
            <dd>{{ shippingLabel }}</dd>
          </div>
          <div>
            <dt>Płatność</dt>
            <dd>{{ paymentLabel }}</dd>
          </div>
          <div>
            <dt>Kwota</dt>
            <dd>{{ formatPrice(placedTotal) }}</dd>
          </div>
        </dl>

        <div class="checkout-actions">
          <button type="button" class="checkout-actions__primary" @click="goToOffers">
            Kontynuuj zakupy
          </button>
          <NuxtLink class="checkout-actions__secondary" to="/">Wróć na stornę główną</NuxtLink>
        </div>
      </article>

      <article v-else class="checkout-card">
        <p class="checkout-card__eyebrow">Dostawa i płatność</p>
        <h2>Finalizacja zamówienia</h2>
        <p class="checkout-card__hint">Uzupełnij dane i wybierz opcje dostawy oraz płatności.</p>

        <p v-if="isCartEmpty" class="checkout-empty" role="status">
          Koszyk jest pusty. Dodaj produkt, aby przejsc dalej.
        </p>

        <form v-else class="checkout-form" @submit.prevent="submitOrder">
          <div class="checkout-form__grid">
            <label>
              <span>Imię</span>
              <BaseInput v-model="firstName" type="text" autocomplete="given-name" placeholder="Imię" />
            </label>

            <label>
              <span>Nazwisko</span>
              <BaseInput v-model="lastName" type="text" autocomplete="family-name" placeholder="Nazwisko" />
            </label>
          </div>

          <div class="checkout-form__grid">
            <label>
              <span>Email</span>
              <BaseInput v-model="email" type="email" autocomplete="email" placeholder="name@example.com" />
            </label>

            <label>
              <span>Telefon</span>
              <BaseInput v-model="phone" type="tel" autocomplete="tel" placeholder="XXX XXX XXX" />
            </label>
          </div>

          <div class="checkout-form__grid checkout-form__grid--address">
            <label>
              <span>Ulica i numer</span>
              <BaseInput v-model="street" type="text" autocomplete="street-address" placeholder="Ulica, numer domu, numer lokalu" />
            </label>

            <label>
              <span>Kod pocztowy</span>
              <BaseInput v-model="postalCode" type="text" autocomplete="postal-code" placeholder="XX-XXX" />
            </label>

            <label>
              <span>Miasto</span>
              <BaseInput v-model="city" type="text" autocomplete="address-level2" placeholder="Miasto" />
            </label>
          </div>

          <fieldset class="checkout-choice">
            <legend>Forma dostawy</legend>
            <label><input v-model="shippingMethod" type="radio" value="courier" /> Kurier</label>
            <label><input v-model="shippingMethod" type="radio" value="parcel" /> Paczkomat</label>
            <label><input v-model="shippingMethod" type="radio" value="pickup" /> Odbiór osobisty</label>
          </fieldset>

          <fieldset class="checkout-choice">
            <legend>Forma płatności</legend>
            <label><input v-model="paymentMethod" type="radio" value="card" /> Karta online</label>
            <label><input v-model="paymentMethod" type="radio" value="blik" /> BLIK</label>
            <label><input v-model="paymentMethod" type="radio" value="transfer" /> Szybki przelew</label>
            <label><input v-model="paymentMethod" type="radio" value="cash" /> Płatność przy odbiorze</label>
          </fieldset>

          <section class="checkout-products">
            <h3>Podsumowanie</h3>
            <ul>
              <li v-for="item in cartStore.items" :key="item.id">
                <span>{{ item.title }} x {{ item.quantity }}</span>
                <strong>{{ formatPrice(item.price * item.quantity) }}</strong>
              </li>
            </ul>
            <p>
              Razem: <strong>{{ formatPrice(cartStore.totalPrice) }}</strong>
            </p>
          </section>

          <p v-if="validationError" class="checkout-form__error" role="alert">{{ validationError }}</p>

          <button class="checkout-form__submit" type="submit" :disabled="isSubmitting">
            {{ isSubmitting ? 'Przetwarzanie...' : 'Potwierdź i zapłać' }}
          </button>
        </form>
      </article>
    </section>
  </MainLayout>
</template>

<style scoped>
.checkout-shell {
  display: grid;
  place-items: center;
  min-height: 60vh;
}

.checkout-card {
  width: min(820px, 100%);
  border: 1px solid var(--color-border-soft);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 22px 40px -34px rgba(15, 23, 42, 0.65);
  padding: 1.2rem;
}

.checkout-card__eyebrow {
  margin: 0;
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.checkout-card h2 {
  margin: 0.4rem 0 0;
  font-size: 1.6rem;
}

.checkout-card__hint {
  margin: 0.65rem 0 0;
  color: var(--color-text-secondary);
}

.checkout-empty {
  margin: 1rem 0 0;
  border: 1px dashed var(--color-border-strong);
  border-radius: 14px;
  padding: 0.8rem;
  color: var(--color-text-secondary);
}

.checkout-form {
  margin-top: 1rem;
  display: grid;
  gap: 0.9rem;
}

.checkout-form__grid {
  display: grid;
  gap: 0.8rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.checkout-form__grid--address {
  grid-template-columns: minmax(0, 2fr) minmax(120px, 1fr) minmax(0, 1fr);
}

.checkout-form label {
  display: grid;
  gap: 0.35rem;
}

.checkout-form label span {
  font-size: 0.84rem;
  color: var(--color-text-secondary);
}

.checkout-form :deep(input[type='text']),
.checkout-form :deep(input[type='email']),
.checkout-form :deep(input[type='tel']) {
  border-radius: 12px;
  padding-inline-start: 0.92rem;
}

.checkout-choice {
  margin: 0;
  border: 1px solid var(--color-border-soft);
  border-radius: 14px;
  padding: 0.75rem 0.85rem;
  display: grid;
  gap: 0.5rem;
}

.checkout-choice legend {
  padding: 0 0.2rem;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
}

.checkout-choice label {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  color: var(--color-text-primary);
  font-size: 0.92rem;
}

.checkout-products {
  border-top: 1px solid var(--color-border-soft);
  padding-top: 0.75rem;
  display: grid;
  gap: 0.55rem;
}

.checkout-products h3 {
  margin: 0;
  font-size: 1rem;
}

.checkout-products ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.4rem;
}

.checkout-products li {
  display: flex;
  justify-content: space-between;
  gap: 0.8rem;
  color: var(--color-text-secondary);
}

.checkout-products p {
  margin: 0;
}

.checkout-form__error {
  margin: 0;
  border: 1px solid rgba(220, 38, 38, 0.25);
  border-radius: 12px;
  background: rgba(254, 242, 242, 0.85);
  color: #991b1b;
  padding: 0.62rem 0.78rem;
  font-size: 0.9rem;
}

.checkout-form__submit,
.checkout-actions__primary {
  border: none;
  border-radius: 12px;
  background: var(--color-brand-strong);
  color: #fff;
  padding: 0.72rem 0.95rem;
  font-size: 0.95rem;
  cursor: pointer;
}

.checkout-form__submit:disabled {
  cursor: wait;
  opacity: 0.75;
}

.checkout-card--success {
  max-width: 620px;
}

.checkout-summary {
  margin: 1rem 0 0;
  display: grid;
  gap: 0.5rem;
}

.checkout-summary div {
  display: flex;
  justify-content: space-between;
  gap: 0.7rem;
  border-bottom: 1px solid var(--color-border-soft);
  padding-bottom: 0.45rem;
}

.checkout-summary dt {
  color: var(--color-text-muted);
}

.checkout-summary dd {
  margin: 0;
  color: var(--color-text-primary);
  font-weight: 600;
}

.checkout-actions {
  margin-top: 1rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.7rem;
}

.checkout-actions__secondary {
  border: 1px solid var(--color-border-soft);
  border-radius: 12px;
  background: #fff;
  color: var(--color-text-secondary);
  padding: 0.72rem 0.95rem;
  font-size: 0.95rem;
  text-decoration: none;
}

@media (max-width: 760px) {
  .checkout-form__grid,
  .checkout-form__grid--address {
    grid-template-columns: 1fr;
  }
}
</style>
