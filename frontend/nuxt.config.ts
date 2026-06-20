import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  srcDir: 'src/',
  modules: ['@pinia/nuxt'],
  css: ['~/style.css'],
  vite: {
    plugins: [tailwindcss()],
  },
  runtimeConfig: {
    public: {
      activityApi: process.env.NUXT_PUBLIC_ACTIVITY_API ?? '/graphql',
    },
  },
  routeRules: {
    '/graphql': {
      proxy: 'http://localhost:8080/graphql',
    },
  },
  compatibilityDate: '2026-06-20',
})
