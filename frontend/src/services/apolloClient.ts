import { ApolloClient, InMemoryCache, gql } from '@apollo/client/core'
import { SchemaLink } from '@apollo/client/link/schema'
import { makeExecutableSchema } from '@graphql-tools/schema'
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

const typeDefs = gql`
  type Category {
    id: ID!
    name: String!
    slug: String!
    parentId: ID
    children: [Category!]!
  }

  type Product {
    id: ID!
    title: String!
    price: Float!
    imageUrl: String!
    categoryId: ID!
    description: String!
  }

  input ProductFilterInput {
    search: String
    categoryId: ID
  }

  type User {
    id: ID!
    name: String!
    email: String!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  input LoginInput {
    email: String!
    password: String!
  }

  type Query {
    categories: [Category!]!
    products(filter: ProductFilterInput): [Product!]!
  }

  type Mutation {
    login(input: LoginInput!): AuthPayload!
  }
`

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
    const categoryMatches = !allowedCategoryIds || allowedCategoryIds.has(product.categoryId)

    if (!normalizedSearch) {
      return categoryMatches
    }

    const title = normalizeText(product.title)
    const description = normalizeText(product.description)
    const searchMatches = title.includes(normalizedSearch) || description.includes(normalizedSearch)

    return categoryMatches && searchMatches
  })
}

const schema = makeExecutableSchema({
  typeDefs,
  resolvers: {
    Category: {
      children: (category: { id: string }) =>
        categories.filter((candidate) => candidate.parentId === category.id),
    },
    Query: {
      categories: () => categories,
      products: (_: unknown, args: { filter?: CatalogFilterInput | null }) =>
        filterProducts(args.filter),
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
