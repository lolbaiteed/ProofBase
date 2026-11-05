// https://nuxt.com/docs/api/configuration/nuxt-config
import { fileURLToPath } from "node:url";
export default defineNuxtConfig({
  modules: ["@nuxt/eslint", "@nuxt/ui", "@vueuse/nuxt", "@nuxtjs/i18n"],

  devtools: {
    enabled: true,
  },

  alias: {
    "@ProofBase/shared": fileURLToPath(
      new URL("../../packages/shared/index.ts", import.meta.url),
    ),
  },

  css: ["~/assets/css/main.css"],

  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE ?? "http://localhost:3001",
    },
  },

  i18n: {
    locales: [
      { code: "en", language: "en-Us", file: "en.json" },
      { code: "ru", language: "ru-Ru", file: "ru.json" },
      { code: "kk", language: "kk-Kz", file: "kk.json" },
    ],
    defaultLocale: "en",
    vueI18n: "./app/i18n/i18n.config.ts",
    langDir: "../../../packages/i18n/locales",
    strategy: "no_prefix",
  },

  routeRules: {
    "/api/**": {
      cors: true,
    },
  },

  compatibilityDate: "2026-06-30",

  eslint: {
    config: {
      stylistic: {
        commaDangle: "never",
        braceStyle: "1tbs",
      },
    },
  },
});
