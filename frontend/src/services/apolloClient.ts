import { ApolloClient, InMemoryCache } from '@apollo/client/core'
import { SchemaLink } from '@apollo/client/link/schema'
import { makeExecutableSchema } from '@graphql-tools/schema'
import typeDefs from '../mocks/schema.graphql?raw'
import { categories, products } from '../mocks/catalogData'
import type { CatalogFilterInput, Product } from '../types/catalog'
import type { AuthPayload, LoginInput, User } from '../types/auth'

const mockUsers: Array<User & { password: string }> = [
  {
    id: 'usr-1',
    name: 'Jan Kowalski',
    email: 'jan@example.com',
    password: 'demo1234',
  },
]

const normalizeText = (value: string): string => value.trim().toLowerCase()

const buildChildLookup = (): Map<string, string[]> => {
  const lookup = new Map<string, string[]>()

  for (const category of categories) {
    if (!category.parentId) {
      continue
    }

    const siblings = lookup.get(category.parentId) ?? []
    siblings.push(category.id)
    lookup.set(category.parentId, siblings)
  }

  return lookup
}

const findDescendantIds = (categoryId: string): Set<string> => {
  const lookup = buildChildLookup()
  const result = new Set<string>([categoryId])
  const stack = [categoryId]

  while (stack.length) {
    const current = stack.pop()

    if (!current) {
      continue
    }

    const children = lookup.get(current) ?? []

    for (const childId of children) {
      if (result.has(childId)) {
        continue
      }

      result.add(childId)
      stack.push(childId)
    }
  }

  return result
}

const generateMockToken = (email: string): string => {
  const encodedEmail = btoa(email)
  return `mock-token-${encodedEmail}-${Date.now()}`
}

const filterProducts = (filter?: CatalogFilterInput | null): Product[] => {
  if (!filter) {
    return products
  }

  const normalizedSearch = filter.search ? normalizeText(filter.search) : ''
  const allowedCategoryIds = filter.categoryId ? findDescendantIds(filter.categoryId) : null

  return products.filter((product) => {
    const categoryMatches = !allowedCategoryIds || allowedCategoryIds.has(product.category.id)

    if (!normalizedSearch) {
      return categoryMatches
    }

    const name = normalizeText(product.name)
    const description = normalizeText(product.description)
    const searchMatches = name.includes(normalizedSearch) || description.includes(normalizedSearch)

    return categoryMatches && searchMatches
  })
}

const schema = makeExecutableSchema({
  typeDefs,
  resolvers: {
    Query: {
      offersModule: () => ({}),
    },
    OffersModuleQuery: {
      product: (_: unknown, args: { slug: string }) =>
        products.find((candidate) => candidate.slug === args.slug) ?? null,
      products: (_: unknown, args: { filter?: CatalogFilterInput | null }) => {
        const items = filterProducts(args.filter)
        return { items, total: items.length, page: 0, size: items.length, hasNext: false }
      },
      category: (_: unknown, args: { slug: string }) =>
        categories.find((candidate) => candidate.slug === args.slug) ?? null,
      rootCategories: () => categories.filter((category) => category.parentId === null),
    },
    Category: {
      children: (category: { id: string }) =>
        categories.filter((candidate) => candidate.parentId === category.id),
    },
    Mutation: {
      login: (_: unknown, args: { input: LoginInput }): AuthPayload => {
        const email = normalizeText(args.input.email)

        const foundUser = mockUsers.find(
          (candidate) =>
            normalizeText(candidate.email) === email && candidate.password === args.input.password,
        )

        if (!foundUser) {
          throw new Error('Nieprawidłowy email lub hasło.')
        }

        const userWithoutPassword: User = {
          id: foundUser.id,
          name: foundUser.name,
          email: foundUser.email,
        }

        return {
          token: generateMockToken(foundUser.email),
          user: userWithoutPassword,
        }
      },
    },
  },
})

export const apolloClient = new ApolloClient({
  cache: new InMemoryCache(),
  link: new SchemaLink({ schema }),
  defaultOptions: {
    query: {
      fetchPolicy: 'no-cache',
    },
  },
})
