import { categories, products } from '../mocks/catalogData'
import type { AttributeValue, Category, Money, Offer, Product } from '../types/catalog'

export interface NewProductInput {
  name: string
  description: string
  categoryId: string
  price: number
  imageUrl: string
  brandName?: string
  sku: string
  stock: number
}

export interface NewOfferInput {
  productId: string
  sku: string
  price: number
  stock: number
  attributeName?: string
  attributeValue?: string
}

export interface NewCategoryInput {
  name: string
  parentId?: string | null
}

// Continue id sequences from whatever the mock seeded, so new ids stay numeric.
let nextProductId = Math.max(0, ...products.map((product) => Number(product.id) || 0)) + 1
let nextOfferId =
  Math.max(0, ...products.flatMap((product) => product.offers.map((offer) => Number(offer.id) || 0))) +
  1
let nextCategoryId = Math.max(0, ...categories.map((category) => Number(category.id) || 0)) + 1

const pln = (amount: number): Money => ({ amount, currency: 'PLN' })

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80'

/**
 * Mock catalog admin — mutates the in-memory mock catalog so new products/offers
 * show up in the storefront. Session-scoped: a page reload resets the catalog.
 */
export const catalogAdminService = {
  listProducts(): Product[] {
    return products
  },

  addProduct(input: NewProductInput): Product {
    const category = categories.find((candidate) => candidate.id === input.categoryId)
    if (!category) {
      throw new Error('Wybierz prawidłową kategorię.')
    }

    const id = String(nextProductId++)
    const offer: Offer = {
      id: String(nextOfferId++),
      sku: input.sku,
      price: pln(input.price),
      stock: input.stock,
      status: 'ACTIVE',
      attributes: [],
    }

    const product: Product = {
      id,
      slug: `${slugify(input.name) || 'produkt'}-${id}`,
      name: input.name,
      description: input.description,
      mainImageUrl: input.imageUrl || DEFAULT_IMAGE,
      brand: input.brandName
        ? { id, name: input.brandName, slug: slugify(input.brandName) || `brand-${id}` }
        : null,
      category,
      priceFrom: pln(input.price),
      offers: [offer],
      specs: [],
    }

    products.unshift(product) // newest first
    return product
  },

  addOffer(input: NewOfferInput): Offer {
    const product = products.find((candidate) => candidate.id === input.productId)
    if (!product) {
      throw new Error('Wybierz prawidłowy produkt.')
    }

    const attributes: AttributeValue[] = []
    if (input.attributeName && input.attributeValue) {
      attributes.push({
        code: slugify(input.attributeName) || 'attr',
        name: input.attributeName,
        dataType: 'TEXT',
        unit: null,
        textValue: input.attributeValue,
        numValue: null,
        boolValue: null,
      })
    }

    const offer: Offer = {
      id: String(nextOfferId++),
      sku: input.sku,
      price: pln(input.price),
      stock: input.stock,
      status: 'ACTIVE',
      attributes,
    }

    product.offers.push(offer)
    if (offer.price.amount < product.priceFrom.amount) {
      product.priceFrom = pln(offer.price.amount)
    }

    return offer
  },

  listCategories(): Category[] {
    return categories
  },

  addCategory(input: NewCategoryInput): Category {
    const parentId = input.parentId || null

    if (parentId) {
      const parent = categories.find((candidate) => candidate.id === parentId)
      if (!parent) {
        throw new Error('Wybierz prawidłową kategorię nadrzędną.')
      }
      parent.isLeaf = false // a category with children is no longer a leaf
    }

    const id = String(nextCategoryId++)
    const category: Category = {
      id,
      name: input.name,
      slug: `${slugify(input.name) || 'kategoria'}-${id}`,
      parentId,
      isLeaf: true,
    }

    categories.push(category)
    return category
  },
}
