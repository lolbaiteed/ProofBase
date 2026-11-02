<script setup lang="ts">
import { startAuthentication } from '@simplewebauthn/browser'
import type { PublicKeyCredentialRequestOptionsJSON } from '@simplewebauthn/browser'

definePageMeta({ layout: false })
useHead({ title: 'Sign in · ProofBase' })

const config = useRuntimeConfig()
const route = useRoute()
const auth = useAuth()
const email = ref('')
const password = ref('')
const errorMessage = ref('')
const pending = ref(false)

function errorText(error: unknown): string {
  const apiError = (error as { data?: { error?: string } })?.data?.error
  return apiError ?? (error instanceof Error ? error.message : 'Sign-in failed. Try again.')
}

async function signIn() {
  pending.value = true
  errorMessage.value = ''
  try {
    const started = await $fetch<{ challengeId: string, options: PublicKeyCredentialRequestOptionsJSON }>('/auth/login/options', {
      baseURL: config.public.apiBase,
      method: 'POST',
      credentials: 'include',
      body: { email: email.value, password: password.value }
    })
    const response = await startAuthentication({ optionsJSON: started.options })
    await $fetch('/auth/login/verify', {
      baseURL: config.public.apiBase,
      method: 'POST',
      credentials: 'include',
      body: { challengeId: started.challengeId, response }
    })
    await auth.fetchCurrentUser()

    const requested = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    const destination = requested.startsWith('/') && !requested.startsWith('//') ? requested : '/'
    await navigateTo(destination)
  } catch (error) {
    errorMessage.value = errorText(error)
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <main class="min-h-screen flex items-center justify-center bg-elevated/30 px-4 py-12">
    <UCard class="w-full max-w-md shadow-xl shadow-black/5">
      <div class="mb-8 text-center">
        <div class="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-primary text-white">
          <UIcon name="i-lucide-shield-check" class="size-6" />
        </div>
        <h1 class="text-2xl font-semibold tracking-tight">
          Sign in to ProofBase
        </h1>
        <p class="mt-2 text-sm text-muted">
          Use your password and registered USB security key.
        </p>
      </div>

      <form class="space-y-5" @submit.prevent="signIn">
        <UFormField label="Email" name="email">
          <UInput
            v-model="email"
            type="email"
            autocomplete="username"
            required
            class="w-full"
          />
        </UFormField>
        <UFormField label="Password" name="password">
          <UInput
            v-model="password"
            type="password"
            autocomplete="current-password"
            required
            class="w-full"
          />
        </UFormField>

        <UAlert
          v-if="errorMessage"
          color="error"
          variant="subtle"
          :description="errorMessage"
        />

        <UButton
          type="submit"
          block
          size="lg"
          :loading="pending"
        >
          Continue with security key
        </UButton>
      </form>

      <p class="mt-6 text-center text-sm text-muted">
        Need to activate an account?
        <NuxtLink to="/setup" class="font-medium text-primary hover:underline">Use your admin enrollment token</NuxtLink>
      </p>
    </UCard>
  </main>
</template>
