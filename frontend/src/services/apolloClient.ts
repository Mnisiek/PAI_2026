import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client/core'
import { setContext } from '@apollo/client/link/context'

const httpLink = createHttpLink({
  uri: 'http://localhost:8080/graphql',
})

const authLink = setContext((_, { headers }) => {
  let token: string | null = null
  try {
    const rawAuth = window.localStorage.getItem('ecommerce-auth-state')
    if (rawAuth) {
      const parsed = JSON.parse(rawAuth)
      token = parsed.token
    }
  } catch (e) {
    // Ignore error
  }

  return result
}

const generateMockToken = (email: string): string => {
  const encodedEmail =
    typeof btoa === 'function' ? btoa(email) : Buffer.from(email, 'utf-8').toString('base64')
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
  }
})

export const apolloClient = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
  defaultOptions: {
    query: {
      fetchPolicy: 'no-cache',
    },
  },
})
