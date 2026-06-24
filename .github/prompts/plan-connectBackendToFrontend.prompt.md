## Plan: Connect Frontend to Backend API

Replace the mocked Apollo GraphQL setup in the frontend with the real backend API, seamlessly routing requests to your Spring Boot application and ClickHouse analytics.

**Steps**
1. **Refactor Apollo Client configuration** 
   - Modify `frontend/src/apollo clients/apolloClient.ts` to use `HttpLink` instead of `SchemaLink`.
   - Point the `HttpLink` URI to the `/graphql` route (which is already proxied to the backend).
   - Remove `makeExecutableSchema`, all local resolvers, and test data imports.
2. **Configure Authentication Context** 
   - Implement an Apollo `authLink` interceptor inside `apolloClient.ts`.
   - Read the existing JWT token from the Pinia authentication store and attach it as the `Authorization: Bearer <token>` header on all requests.
3. **Verify Proxy and Queries**
   - Ensure the Nuxt proxy configuration (`nuxt.config.ts` mapping `/graphql` -> `http://localhost:8080/graphql`) covers the `apolloClient` as it already does for `activityClient`.
4. **Cleanup Mock Artifacts** 
   - Delete `frontend/src/mocks/schema.graphql`.
   - Delete `frontend/src/mocks/catalogData.ts`.

**Relevant files**
- `frontend/src/apollo clients/apolloClient.ts` — Connect `HttpLink` and `authLink` interceptors.
- `frontend/src/mocks/catalogData.ts` — Remove.
- `frontend/src/mocks/schema.graphql` — Remove.

**Verification**
1. **Catalog Load**: Start backend, DB, and Nuxt. Open the storefront and confirm it loads products from the PostgreSQL shop DB rather than the 15 stationary mock items.
2. **Authentication Flow**: Log in via `/login` with real user credentials (instead of the fake `mock-token-...` being minted) and confirm successful JWT generation.
3. **Analytics Sync**: Click around the site and check the Spring Boot logs / ClickHouse tables to ensure `recordActivityEvent` is persisting viewing behavior accurately using the un-mocked product IDs.

**Further Considerations**
1. **Pagination**: The mocked setup returns all elements at once, but the backend implementation supports distinct pagination (`page`, `size`, `total`). We may need to adapt frontend store handlers for products to accommodate the real pagination bounds if they differ slightly from the static array mapping.