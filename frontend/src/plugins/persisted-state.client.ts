import { useAuthStore } from '../stores/auth.store'
import { useCartStore } from '../stores/cart.store'

export default defineNuxtPlugin(() => {
  const authStore = useAuthStore()
  const cartStore = useCartStore()

  authStore.hydrateFromStorage()
  cartStore.hydrateFromStorage()
})
