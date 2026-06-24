export type ActivityEventType =
  | 'VIEW'
  | 'CLICK'
  | 'PRODUCT_DETAIL'
  | 'ADD_TO_CART'
  | 'PURCHASE'
  | 'SEARCH'

/** Mirrors the backend `ActivityEventInput`. Ids are sent as strings (GraphQL ID). */
export interface ActivityEventInput {
  sessionId: string
  userId?: string | null
  type: ActivityEventType
  productId?: string | null
  productName?: string | null
  productSlug?: string | null
  categoryId?: string | null
  brandId?: string | null
  brandName?: string | null
  offerId?: string | null
  sku?: string | null
  price?: number | null
  currency?: string | null
  searchQuery?: string | null
  quantity?: number | null
  url?: string | null
  referrer?: string | null
  userAgent?: string | null
}

// --- Dashboard analytics (mirrors the backend activity read models) ---

export interface ActivitySummary {
  totalEvents: number
  uniqueSessions: number
  uniqueUsers: number
}

export interface EventTypeCount {
  type: string
  count: number
}

export interface ProductActivity {
  productId: string
  productName: string | null
  count: number
}

export interface CategoryActivity {
  categoryId: string
  count: number
}

export interface DailyCount {
  day: string
  count: number
}

export interface DailyTypeCount {
  day: string
  type: string
  count: number
}

export interface ActivityStats {
  summary: ActivitySummary
  eventsByType: EventTypeCount[]
  topProducts: ProductActivity[]
  topCategories: CategoryActivity[]
  eventsPerDayByType: DailyTypeCount[]
}
