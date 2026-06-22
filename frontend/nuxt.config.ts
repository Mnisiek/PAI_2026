import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  srcDir: 'src/',
  modules: ['@pinia/nuxt'],
  css: ['~/style.css'],
  experimental: {
    appManifest: false,
  },
  vite: {
    plugins: [tailwindcss()],
  },
  runtimeConfig: {
    // Server-side (SSR) calls the backend directly — the `/graphql` proxy below
    // only applies to browser requests, so a relative URL fails during SSR.
    activityApiInternal: process.env.NUXT_ACTIVITY_API_INTERNAL ?? 'http://localhost:8080/graphql',
    public: {
      // Browser uses the proxied route rule below.
      activityApi: process.env.NUXT_PUBLIC_ACTIVITY_API ?? '/graphql',
    },
  },
  routeRules: {
    '/graphql': {
      // Browser calls hit this same-origin path; Nitro proxies them to the backend.
      // Override the target for containerised runs (e.g. http://backend:8080/graphql).
      proxy: process.env.NUXT_GRAPHQL_PROXY_TARGET ?? 'http://localhost:8080/graphql',
    },
  },
  compatibilityDate: '2026-06-20',
})
