import { getApolloClient } from '../apollo clients/apolloClient'
import { GET_CATEGORIES, GET_PRODUCTS } from '../graphql/catalog.queries'
import { ADD_CATEGORY_MUTATION, ADD_OFFER_MUTATION, ADD_PRODUCT_MUTATION } from '../graphql/catalog.mutations'
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
  attributes?: NewOfferAttributeInput[]
  attributeName?: string
  attributeValue?: string
}

export interface NewOfferAttributeInput {
  name: string
  value: string
}

export interface NewCategoryInput {
  name: string
  parentId?: string | null
}

interface CategoriesResponse {
  offersModule: {
    rootCategories: Category[]
  }
}

interface ProductsResponse {
  offersModule: {
    products: {
      items: Product[]
    }
  }
}

interface AddCategoryResponse {
  addCategory: Category
}

interface AddProductResponse {
  addProduct: Product
}

interface AddOfferResponse {
  addOffer: Offer
}

const flattenCategories = (roots: Category[]): Category[] => {
  const flattened: Category[] = []

  const visit = (node: Category): void => {
    flattened.push(node)

    for (const child of node.children ?? []) {
      visit(child)
    }
  }

  for (const root of roots) {
    visit(root)
  }

  return flattened
}

export const catalogAdminService = {
  async listProducts(): Promise<Product[]> {
    const client = getApolloClient()
    const { data } = await client.query<ProductsResponse>({
      query: GET_PRODUCTS,
      variables: {
        search: null,
        filter: null,
      },
    })

    if (!data) {
      throw new Error('Products query returned no data.')
    }

    return data.offersModule.products.items
  },

  async addProduct(input: NewProductInput): Promise<Product> {
    const client = getApolloClient()
    const { data } = await client.mutate<AddProductResponse, { input: NewProductInput }>({
      mutation: ADD_PRODUCT_MUTATION,
      variables: { input },
    })

    if (!data) {
      throw new Error('Add product mutation returned no data.')
    }

    return data.addProduct
  },

  async addOffer(input: NewOfferInput): Promise<Offer> {
    const client = getApolloClient()
    const { data } = await client.mutate<AddOfferResponse, { input: NewOfferInput }>({
      mutation: ADD_OFFER_MUTATION,
      variables: { input },
    })

    if (!data) {
      throw new Error('Add offer mutation returned no data.')
    }

    return data.addOffer
  },

  async listCategories(): Promise<Category[]> {
    const client = getApolloClient()
    const { data } = await client.query<CategoriesResponse>({
      query: GET_CATEGORIES,
    })

    if (!data) {
      throw new Error('Categories query returned no data.')
    }

    return flattenCategories(data.offersModule.rootCategories)
  },

  async addCategory(input: NewCategoryInput): Promise<Category> {
    const client = getApolloClient()
    const { data } = await client.mutate<AddCategoryResponse, { input: NewCategoryInput }>({
      mutation: ADD_CATEGORY_MUTATION,
      variables: { input },
    })

    if (!data) {
      throw new Error('Add category mutation returned no data.')
    }

    return data.addCategory
  },
}
