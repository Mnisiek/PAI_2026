import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  srcDir: 'src/',
  modules: ['@pinia/nuxt'],
  css: ['~/style.css'],
  app: {
    head: {
      title: 'ofero',
      // Inline data-URI favicon: no separate request, immune to public-dir
      // resolution and aggressive favicon caching (the href itself changes).
      link: [
        {
          rel: 'icon',
          type: 'image/svg+xml',
          href: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiI+CiAgPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iOCIgZmlsbD0iIzBmNzY2ZSIgLz4KICA8cGF0aAogICAgZD0iTTkuNCAxMi41aDEzLjJhMS43IDEuNyAwIDAgMSAxLjY5IDEuODdsLS44MyA4LjVBMi42IDIuNiAwIDAgMSAyMC44NyAyNUgxMS4xM2EyLjYgMi42IDAgMCAxLTIuNTgtMi4xM2wtLjgzLTguNUExLjcgMS43IDAgMCAxIDkuNCAxMi41WiIKICAgIGZpbGw9IiNmZmZmZmYiCiAgLz4KICA8cGF0aAogICAgZD0iTTEyLjYgMTIuOHYtMS4zYTMuNCAzLjQgMCAwIDEgNi44IDB2MS4zIgogICAgZmlsbD0ibm9uZSIKICAgIHN0cm9rZT0iI2ZmZmZmZiIKICAgIHN0cm9rZS13aWR0aD0iMiIKICAgIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIKICAvPgogIDxjaXJjbGUgY3g9IjE2IiBjeT0iMTgiIHI9IjEuOSIgZmlsbD0iIzBmNzY2ZSIgLz4KPC9zdmc+',
        },
      ],
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
