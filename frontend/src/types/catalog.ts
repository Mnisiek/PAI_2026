export interface Category {
  id: string
  name: string
  slug: string
  parentId: string | null
  children?: Category[]
}

export interface Product {
  id: string
  title: string
  price: number
  imageUrl: string
  categoryId: string
  description: string
}

export interface CatalogFilterInput {
  search?: string
  categoryId?: string | null
}
