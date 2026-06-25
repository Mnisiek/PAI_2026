export interface Money {
  amount: number
  currency: string
}

export interface Brand {
  id: string
  name: string
  slug: string
}

export type AttributeDataType = 'TEXT' | 'NUMBER' | 'BOOL'

// Mirrors the backend `AttributeValue` — an offer's value for a declared param.
export interface AttributeValue {
  code: string
  name: string
  dataType: AttributeDataType
  unit?: string | null
  textValue?: string | null
  numValue?: number | null
  boolValue?: boolean | null
}

export interface OfferImage {
  url: string
  alt?: string | null
}

export interface Offer {
  id: string
  sku: string
  price: Money
  stock: number
  status: string
  attributes: AttributeValue[]
  images?: OfferImage[]
}

export interface Spec {
  key: string
  value: string
}

export interface Category {
  id: string
  name: string
  slug: string
  parentId: string | null
  isLeaf: boolean
  children?: Category[]
}

// Lightweight offer shape for admin management (status toggling).
export interface AdminOffer {
  id: string
  sku: string
  status: string
}

export interface Product {
  id: string
  slug: string
  name: string
  description: string
  mainImageUrl: string
  brand: Brand | null
  category: Category
  priceFrom: Money
  offers: Offer[]
  specs?: Spec[]
  status?: string
  allOffers?: AdminOffer[]
}

// A single attribute filter the user has applied (mirrors backend AttributeFilterInput).
export interface AttributeFilter {
  code: string
  values?: string[] | null
  min?: number | null
  max?: number | null
}

export interface CatalogFilterInput {
  search?: string
  categoryId?: string | null
  priceMin?: number | null
  priceMax?: number | null
  inStock?: boolean
  attributes?: AttributeFilter[]
}

export interface FacetOption {
  value: string
  count: number
}

// A filter the category offers (mirrors backend Facet). TEXT/BOOL expose `options`,
// NUMBER exposes `min`/`max`.
export interface Facet {
  code: string
  name: string
  dataType: AttributeDataType
  unit?: string | null
  options: FacetOption[]
  min?: number | null
  max?: number | null
}

// Minimal shape the product carousel needs (a full Product satisfies it too).
export interface CarouselProduct {
  id: string
  slug: string
  name: string
  mainImageUrl: string
  priceFrom: Money
}

export interface ProductPage {
  items: Product[]
  total: number
  page: number
  size: number
  hasNext: boolean
}
