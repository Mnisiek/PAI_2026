import { ApolloClient, InMemoryCache } from '@apollo/client/core'
import { SchemaLink } from '@apollo/client/link/schema'
import { makeExecutableSchema } from '@graphql-tools/schema'
import type { Category, Product } from '../types/catalog'
import { categories, products } from '../mocks/catalogData'
import typeDefs from '../mocks/schema.graphql?raw'

type ProductFilter = {
  categorySlug?: string | null
}

type LoginInput = {
  email: string
  password: string
}

const normalizeText = (value: string): string => value.trim().toLocaleLowerCase('pl-PL')

const categoryBySlug = new Map(categories.map((category) => [category.slug, category]))
const childrenByParentId = categories.reduce<Map<string | null, Category[]>>((acc, category) => {
  const key = category.parentId ?? null
  const current = acc.get(key)
  if (current) {
    current.push(category)
  } else {
    acc.set(key, [category])
  }
  return acc
}, new Map())

const findDescendantIds = (rootCategoryId: string): Set<string> => {
  const collected = new Set<string>()
  const stack = [rootCategoryId]

  while (stack.length > 0) {
    const id = stack.pop()
    if (!id || collected.has(id)) {
      continue
    }

    collected.add(id)

    for (const category of categories) {
      if (category.parentId === id) {
        stack.push(category.id)
      }
    }
  }

  return collected
}

const filterProducts = (search?: string | null, filter?: ProductFilter | null): Product[] => {
  const normalizedSearch = search ? normalizeText(search) : ''
  const categorySlug = filter?.categorySlug ?? null
  const rootCategory = categorySlug ? categoryBySlug.get(categorySlug) : null
  const allowedCategoryIds = rootCategory ? findDescendantIds(rootCategory.id) : null

  return products.filter((product) => {
    const matchesCategory = !allowedCategoryIds || allowedCategoryIds.has(product.category.id)
    if (!matchesCategory) {
      return false
    }

    if (!normalizedSearch) {
      return true
    }

    const name = normalizeText(product.name)
    const description = normalizeText(product.description)
    return name.includes(normalizedSearch) || description.includes(normalizedSearch)
  })
}

const generateMockToken = (email: string): string => {
  const encodedEmail = typeof btoa === 'function' ? btoa(email) : email
  return `mock-token-${encodedEmail}-${Date.now()}`
}

const schema = makeExecutableSchema({
  typeDefs,
  resolvers: {
    Query: {
      offersModule: () => ({}),
    },
    Mutation: {
      login: (_: unknown, args: { input: LoginInput }) => {
        const email = args.input.email.trim().toLowerCase()
        const namePart = email.split('@')[0] ?? 'User'
        const normalizedName = namePart
          .split(/[._-]+/)
          .filter(Boolean)
          .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
          .join(' ')

        return {
          token: generateMockToken(email),
          user: {
            id: email,
            name: normalizedName || 'User',
            email,
          },
        }
      },
    },
    OffersModuleQuery: {
      product: (_: unknown, args: { slug: string }) =>
        products.find((candidate) => candidate.slug === args.slug) ?? null,
      products: (_: unknown, args: { search?: string | null; filter?: ProductFilter | null }) => {
        const items = filterProducts(args.search, args.filter)
        return {
          items,
          total: items.length,
          page: 0,
          size: items.length,
          hasNext: false,
        }
      },
      category: (_: unknown, args: { slug: string }) =>
        categories.find((candidate) => candidate.slug === args.slug) ?? null,
      rootCategories: () => categories.filter((category) => category.parentId === null),
    },
    Category: {
      children: (parent: Category) => childrenByParentId.get(parent.id) ?? [],
    },
  },
})

export const apolloClient = new ApolloClient({
  link: new SchemaLink({ schema }),
  cache: new InMemoryCache(),
  defaultOptions: {
    query: {
      fetchPolicy: 'no-cache',
    },
  },
})
