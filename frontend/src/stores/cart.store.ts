import { defineStore } from 'pinia'
import type { AttributeValue, Offer, Product } from '../types/catalog'
import type { CartItem } from '../types/cart'
import { activityService } from '../services/activity.service'

const attributeText = (attribute: AttributeValue): string => {
  if (attribute.textValue != null) {
    return attribute.textValue
  }
  if (attribute.numValue != null) {
    return `${attribute.numValue}${attribute.unit ?? ''}`
  }
  if (attribute.boolValue != null) {
    return attribute.boolValue ? 'Tak' : 'Nie'
  }
  return ''
}

const variantLabel = (offer: Offer): string =>
  offer.attributes?.map(attributeText).filter(Boolean).join(' / ') ?? ''

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
    addToCart(product: Product, offer?: Offer): void {
      const selected = offer ?? product.offers?.[0]

      if (!selected) {
        return
      }

      const existingItemIndex = findItemIndex(this.items, selected.id)

      if (existingItemIndex >= 0) {
        this.items[existingItemIndex].quantity += 1
      } else {
        const variant = variantLabel(selected)

        this.items.push({
          id: selected.id,
          productId: product.id,
          title: variant ? `${product.name} (${variant})` : product.name,
          price: selected.price.amount,
          imageUrl: product.mainImageUrl,
          quantity: 1,
        })
      }

      persistCartState(this.items)
      activityService.trackAddToCart(product, selected)
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

    checkout(): void {
      if (!this.items.length) {
        return
      }

      activityService.trackPurchase(this.items)
      this.clearCart()
      this.closeCart()
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
