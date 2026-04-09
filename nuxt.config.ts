// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxtjs/tailwindcss'],
  nitro: {
    experimental: {
      openAPI: false,
    },
  },
  runtimeConfig: {
    dashscopeApiKey: process.env.DASHSCOPE_API_KEY,
    databaseUrl: process.env.DATABASE_URL,
    public: {},
  },
})
