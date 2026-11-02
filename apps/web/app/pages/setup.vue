<script setup lang="ts">
import { startRegistration } from '@simplewebauthn/browser'
import type { PublicKeyCredentialCreationOptionsJSON } from '@simplewebauthn/browser'

definePageMeta({ layout: false })
useHead({ title: 'Activate account · ProofBase' })

const config = useRuntimeConfig()
const email = ref('')
const token = ref('')
const password = ref('')
const errorMessage = ref('')
const pending = ref(false)
const complete = ref(false)

function errorText(error: unknown): string {
  const apiError = (error as { data?: { error?: string } })?.data?.error
  return apiError ?? (error instanceof Error ? error.message : 'Account setup failed. Try again.')
}

async function activateAccount() {
  pending.value = true
  errorMessage.value = ''
  try {
    const started = await $fetch<{ challengeId: string, options: PublicKeyCredentialCreationOptionsJSON }>('/auth/setup/options', {
      baseURL: config.public.apiBase,
      method: 'POST',
      credentials: 'include',
      body: { email: email.value, token: token.value, password: password.value }
    })
    const response = await startRegistration({ optionsJSON: started.options })
    await $fetch('/auth/setup/verify', {
      baseURL: config.public.apiBase,
      method: 'POST',
      credentials: 'include',
      body: { challengeId: started.challengeId, response }
    })
    complete.value = true
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
          <UIcon name="i-lucide-key-round" class="size-6" />
        </div>
        <h1 class="text-2xl font-semibold tracking-tight">
          Activate your account
        </h1>
        <p class="mt-2 text-sm text-muted">
          Set a password, then register your USB FIDO2 security key.
        </p>
      </div>

      <template v-if="complete">
        <UAlert
          color="success"
          variant="subtle"
          title="Security key registered"
          description="Your account is ready. Sign in with your password and security key."
        />
        <UButton to="/login" block class="mt-5">
          Go to sign in
        </UButton>
      </template>

      <form v-else class="space-y-5" @submit.prevent="activateAccount">
        <UFormField label="Email" name="email">
          <UInput
            v-model="email"
            type="email"
            autocomplete="username"
            required
            class="w-full"
          />
        </UFormField>
        <UFormField label="One-time enrollment token" name="token">
          <UInput
            v-model="token"
            autocomplete="one-time-code"
            required
            class="w-full"
          />
        </UFormField>
        <UFormField label="Create password" name="password" hint="At least 12 characters">
          <UInput
            v-model="password"
            type="password"
            autocomplete="new-password"
            minlength="12"
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
          Register USB security key
        </UButton>
      </form>

      <p v-if="!complete" class="mt-6 text-center text-sm text-muted">
        Already activated?
        <NuxtLink to="/login" class="font-medium text-primary hover:underline">Sign in</NuxtLink>
      </p>
    </UCard>
  </main>
</template>
