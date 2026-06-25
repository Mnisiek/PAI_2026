import { getApolloClient } from '../apollo clients/apolloClient'
import { GET_ADMIN_PRODUCTS, GET_CATEGORIES } from '../graphql/catalog.queries'
import {
  ADD_CATEGORY_MUTATION,
  ADD_OFFER_MUTATION,
  ADD_PRODUCT_MUTATION,
  SET_OFFER_STATUS_MUTATION,
  SET_PRODUCT_STATUS_MUTATION,
  UPDATE_CATEGORY_MUTATION,
  UPDATE_OFFER_MUTATION,
  UPDATE_PRODUCT_MUTATION,
} from '../graphql/catalog.mutations'
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
  attributes?: NewOfferAttributeInput[]
}

export interface NewOfferInput {
  productId: string
  sku: string
  price: number
  stock: number
  attributes?: NewOfferAttributeInput[]
  images?: string[]
  attributeName?: string
  attributeValue?: string
}

export interface NewOfferAttributeInput {
  name: string
  value: string
}

export interface UpdateOfferInput {
  id: string
  price: number
  stock: number
  attributes?: NewOfferAttributeInput[]
  images?: string[]
}

export interface NewCategoryAttributeInput {
  name: string
  dataType: string
  unit?: string | null
}

export interface NewCategoryInput {
  name: string
  parentId?: string | null
  attributes?: NewCategoryAttributeInput[]
}

export interface UpdateCategoryInput {
  id: string
  name: string
  parentId?: string | null
  attributes?: NewCategoryAttributeInput[]
}

export interface UpdateProductInput {
  id: string
  name: string
  description: string
  categoryId: string
  brandName?: string
  imageUrl?: string
}

interface CategoriesResponse {
  offersModule: {
    rootCategories: Category[]
  }
}

interface AdminProductsResponse {
  offersModule: {
    adminProducts: Product[]
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

interface UpdateCategoryResponse {
  updateCategory: Category
}

interface UpdateProductResponse {
  updateProduct: Product
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
    const { data } = await client.query<AdminProductsResponse>({
      query: GET_ADMIN_PRODUCTS,
      fetchPolicy: 'no-cache',
    })

    if (!data) {
      throw new Error('Products query returned no data.')
    }

    return data.offersModule.adminProducts
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

  async updateCategory(input: UpdateCategoryInput): Promise<Category> {
    const client = getApolloClient()
    const { data } = await client.mutate<UpdateCategoryResponse, { input: UpdateCategoryInput }>({
      mutation: UPDATE_CATEGORY_MUTATION,
      variables: { input },
    })

    if (!data) {
      throw new Error('Update category mutation returned no data.')
    }

    return data.updateCategory
  },

  async updateProduct(input: UpdateProductInput): Promise<Product> {
    const client = getApolloClient()
    const { data } = await client.mutate<UpdateProductResponse, { input: UpdateProductInput }>({
      mutation: UPDATE_PRODUCT_MUTATION,
      variables: { input },
    })

    if (!data) {
      throw new Error('Update product mutation returned no data.')
    }

    return data.updateProduct
  },

  async setProductStatus(id: string, status: string): Promise<void> {
    const client = getApolloClient()
    await client.mutate<unknown, { id: string; status: string }>({
      mutation: SET_PRODUCT_STATUS_MUTATION,
      variables: { id, status },
    })
  },

  async setOfferStatus(id: string, status: string): Promise<void> {
    const client = getApolloClient()
    await client.mutate<unknown, { id: string; status: string }>({
      mutation: SET_OFFER_STATUS_MUTATION,
      variables: { id, status },
    })
  },

  async updateOffer(input: UpdateOfferInput): Promise<Offer> {
    const client = getApolloClient()
    const { data } = await client.mutate<{ updateOffer: Offer }, { input: UpdateOfferInput }>({
      mutation: UPDATE_OFFER_MUTATION,
      variables: { input },
    })

    if (!data) {
      throw new Error('Update offer mutation returned no data.')
    }

    return data.updateOffer
  },
}
