import { getActivityClient } from '../apollo clients/activityClient'
import { RECORD_ACTIVITY_EVENT } from '../graphql/activity.queries'
import type { ActivityEventInput, ActivityEventType } from '../types/activity'
import type { Offer, Product } from '../types/catalog'
import type { CartItem } from '../types/cart'

const SESSION_KEY = 'pai-activity-session'
const AUTH_KEY = 'ecommerce-auth-state'

const getSessionId = (): string => {
  let id = window.localStorage.getItem(SESSION_KEY)

  if (!id) {
    id = crypto.randomUUID()
    window.localStorage.setItem(SESSION_KEY, id)
  }

  return id
}

const getUserId = (): string | null => {
  try {
    const raw = window.localStorage.getItem(AUTH_KEY)

    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw) as { user?: { id?: string } | null }
    return parsed.user?.id ?? null
  } catch {
    return null
  }
}

// Fire-and-forget: analytics must never break the UX, so errors are swallowed.
const send = (event: Partial<ActivityEventInput> & { type: ActivityEventType }): void => {
  if (!import.meta.client) {
    return
  }

  const input: ActivityEventInput = {
    sessionId: getSessionId(),
    userId: getUserId(),
    url: window.location.pathname,
    referrer: document.referrer || null,
    userAgent: navigator.userAgent,
    ...event,
  }

  void getActivityClient()
    .mutate({ mutation: RECORD_ACTIVITY_EVENT, variables: { input } })
    .catch((error: unknown) => {
      if (import.meta.dev) {
        console.debug('[activity] event dropped', error)
      }
    })
}

const fromProduct = (product: Product): Partial<ActivityEventInput> => ({
  productId: product.id,
  productName: product.name,
  productSlug: product.slug,
  categoryId: product.category.id,
  brandId: product.brand?.id ?? null,
  brandName: product.brand?.name ?? null,
  offerId: product.offers?.[0]?.id ?? null,
  sku: product.offers?.[0]?.sku ?? null,
  price: product.priceFrom.amount,
  currency: product.priceFrom.currency,
})

export const activityService = {
  /** Product impression in a listing grid (analytics only — not a retargeting signal). */
  trackProductView(product: Product): void {
    send({ type: 'VIEW', ...fromProduct(product) })
  },

  /** Click-through from a listing card (analytics only — not a retargeting signal). */
  trackProductClick(product: Product): void {
    send({ type: 'CLICK', ...fromProduct(product) })
  },

  /** Product detail page opened — a retargeting signal. */
  trackProductDetail(product: Product): void {
    send({ type: 'PRODUCT_DETAIL', ...fromProduct(product) })
  },

  trackAddToCart(product: Product, offer?: Offer, quantity = 1): void {
    send({
      type: 'ADD_TO_CART',
      ...fromProduct(product),
      ...(offer ? { offerId: offer.id, sku: offer.sku, price: offer.price.amount } : {}),
      quantity,
    })
  },

  trackSearch(query: string): void {
    const trimmed = query.trim()

    if (!trimmed) {
      return
    }

    send({ type: 'SEARCH', searchQuery: trimmed })
  },

  trackPurchase(items: CartItem[]): void {
    for (const item of items) {
      send({
        type: 'PURCHASE',
        productId: item.id,
        productName: item.title,
        price: item.price,
        currency: 'PLN',
        quantity: item.quantity,
      })
    }
  },
}
