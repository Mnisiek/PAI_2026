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

export interface Offer {
  id: string
  sku: string
  price: Money
  stock: number
  status: string
  attributes: AttributeValue[]
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
}

export interface CatalogFilterInput {
  search?: string
  categoryId?: string | null
}

export interface ProductPage {
  items: Product[]
  total: number
  page: number
  size: number
  hasNext: boolean
}
