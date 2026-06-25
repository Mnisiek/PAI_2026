import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  srcDir: 'src/',
  modules: ['@pinia/nuxt'],
  css: ['~/style.css'],
  app: {
    head: {
      title: 'ofero',
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    },
  },
  experimental: {
    appManifest: false,
  },
  vite: {
    plugins: [tailwindcss()],
  },
  runtimeConfig: {
    internalGraphqlApi: process.env.NUXT_INTERNAL_GRAPHQL_API ?? 'http://localhost:8080/graphql',
    public: {
      graphqlApi: process.env.NUXT_PUBLIC_GRAPHQL_API ?? '/graphql',
      activityApi: process.env.NUXT_PUBLIC_ACTIVITY_API ?? '/graphql',
    },
  },
  routeRules: {
    '/graphql': {
      // Browser calls hit this same-origin path; Nitro proxies them to the backend.
      // Override the target for containerised runs (e.g. http://backend:8080/graphql).
      proxy: process.env.NUXT_GRAPHQL_PROXY_TARGET ?? 'http://localhost:8080/graphql',
    },
    '/admin': { ssr: false },
    '/admin/**': { ssr: false },
  },
  compatibilityDate: '2026-06-20',
})
