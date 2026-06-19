import { defineStore } from 'pinia'
import type { Product } from '../types/catalog'
import type { CartItem } from '../types/cart'

interface CartState {
  items: CartItem[]
  isOpen: boolean
}

const CART_STORAGE_KEY = 'ecommerce-cart-state'

const readCartFromStorage = (): CartItem[] => {
  try {
    const rawValue = window.localStorage.getItem(CART_STORAGE_KEY)

    if (!rawValue) {
      return []
    }

    const parsedValue = JSON.parse(rawValue) as CartItem[]
    return Array.isArray(parsedValue) ? parsedValue : []
  } catch {
    return []
  }
}

const persistCartState = (items: CartItem[]): void => {
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
}

const findItemIndex = (items: CartItem[], productId: string): number =>
  items.findIndex((item) => item.id === productId)

export const useCartStore = defineStore('cart', {
  state: (): CartState => ({
    items: readCartFromStorage(),
    isOpen: false,
  }),

  getters: {
    totalItems: (state): number => state.items.reduce((sum, item) => sum + item.quantity, 0),
    totalPrice: (state): number => state.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
  },

  actions: {
    addToCart(product: Product): void {
      const existingItemIndex = findItemIndex(this.items, product.id)

      if (existingItemIndex >= 0) {
        this.items[existingItemIndex].quantity += 1
      } else {
        this.items.push({
          id: product.id,
          title: product.title,
          price: product.price,
          imageUrl: product.imageUrl,
          quantity: 1,
        })
      }

      persistCartState(this.items)
    },

    removeFromCart(productId: string): void {
      this.items = this.items.filter((item) => item.id !== productId)
      persistCartState(this.items)
    },

    updateQuantity(productId: string, amount: number): void {
      const itemIndex = findItemIndex(this.items, productId)

      if (itemIndex < 0) {
        return
      }

      const nextQuantity = this.items[itemIndex].quantity + amount

      if (nextQuantity <= 0) {
        this.removeFromCart(productId)
        return
      }

      this.items[itemIndex].quantity = nextQuantity
      persistCartState(this.items)
    },

    clearCart(): void {
      this.items = []
      persistCartState(this.items)
    },

    openCart(): void {
      this.isOpen = true
    },

    closeCart(): void {
      this.isOpen = false
    },

    toggleCart(): void {
      this.isOpen = !this.isOpen
    },
  },
})
