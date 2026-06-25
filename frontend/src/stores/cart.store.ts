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
  activeCartKey: string
}

const LEGACY_CART_STORAGE_KEY = 'ecommerce-cart-state'
const CART_GUEST_STORAGE_KEY = 'ecommerce-cart-state:guest'
const CART_USER_STORAGE_PREFIX = 'ecommerce-cart-state:user:'

const resolveCartStorageKey = (userId: string | null): string =>
  userId ? `${CART_USER_STORAGE_PREFIX}${userId}` : CART_GUEST_STORAGE_KEY

const migrateLegacyGuestCart = (): void => {
  if (!import.meta.client) {
    return
  }

  const legacy = window.localStorage.getItem(LEGACY_CART_STORAGE_KEY)
  if (!legacy) {
    return
  }

  if (!window.localStorage.getItem(CART_GUEST_STORAGE_KEY)) {
    window.localStorage.setItem(CART_GUEST_STORAGE_KEY, legacy)
  }

  window.localStorage.removeItem(LEGACY_CART_STORAGE_KEY)
}

const readCartFromStorage = (storageKey: string): CartItem[] => {
  if (!import.meta.client) {
    return []
  }

  try {
    const rawValue = window.localStorage.getItem(storageKey)

    if (!rawValue) {
      return []
    }

    const parsedValue = JSON.parse(rawValue) as CartItem[]
    return Array.isArray(parsedValue) ? parsedValue : []
  } catch {
    return []
  }
}

const persistCartState = (storageKey: string, items: CartItem[]): void => {
  if (!import.meta.client) {
    return
  }

  window.localStorage.setItem(storageKey, JSON.stringify(items))
}

const findItemIndex = (items: CartItem[], productId: string): number =>
  items.findIndex((item) => item.id === productId)

export const useCartStore = defineStore('cart', {
  state: (): CartState => ({
    items: [],
    isOpen: false,
    activeCartKey: CART_GUEST_STORAGE_KEY,
  }),

  getters: {
    totalItems: (state): number => state.items.reduce((sum, item) => sum + item.quantity, 0),
    totalPrice: (state): number => state.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
  },

  actions: {
    hydrateFromStorage(userId: string | null = null): void {
      migrateLegacyGuestCart()
      this.activeCartKey = resolveCartStorageKey(userId)
      this.items = readCartFromStorage(this.activeCartKey)
    },

    syncCartForAuthTransition(previousUserId: string | null, nextUserId: string | null): void {
      migrateLegacyGuestCart()

      const guestKey = CART_GUEST_STORAGE_KEY
      const nextKey = resolveCartStorageKey(nextUserId)

      if (previousUserId && !nextUserId) {
        this.activeCartKey = guestKey
        this.items = []
        persistCartState(guestKey, this.items)
        this.closeCart()
        return
      }

      if (!previousUserId && nextUserId) {
        const guestItems = readCartFromStorage(guestKey)
        const userItems = readCartFromStorage(nextKey)

        this.activeCartKey = nextKey

        if (!userItems.length && guestItems.length) {
          this.items = guestItems
          persistCartState(nextKey, this.items)
        } else {
          this.items = userItems
        }

        persistCartState(guestKey, [])
        return
      }

      this.activeCartKey = nextKey
      this.items = readCartFromStorage(nextKey)
    },

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

      persistCartState(this.activeCartKey, this.items)
      activityService.trackAddToCart(product, selected)
    },

    removeFromCart(productId: string): void {
      this.items = this.items.filter((item) => item.id !== productId)
      persistCartState(this.activeCartKey, this.items)
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
      persistCartState(this.activeCartKey, this.items)
    },

    clearCart(): void {
      this.items = []
      persistCartState(this.activeCartKey, this.items)
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
