export interface AuthenticatedUser {
  id: string
  email: string
  firstName: string
  lastName: string
  organizationId: string
}

export function useAuth() {
  const user = useState<AuthenticatedUser | null>('proofbase.auth.user', () => null)
  const loaded = useState('proofbase.auth.loaded', () => false)
  const config = useRuntimeConfig()

  async function fetchCurrentUser(): Promise<AuthenticatedUser> {
    const cookieHeader = import.meta.server ? useRequestHeaders(['cookie']).cookie : undefined
    const sessionCookie = cookieHeader
      ?.split(';')
      .map(value => value.trim())
      .find(value => value.startsWith('proofbase_session='))
    try {
      const response = await $fetch<{ user: AuthenticatedUser }>('/auth/me', {
        baseURL: config.public.apiBase,
        credentials: 'include',
        headers: sessionCookie ? { cookie: sessionCookie } : undefined
      })
      user.value = response.user
      loaded.value = true
      return response.user
    } catch (error) {
      user.value = null
      loaded.value = true
      throw error
    }
  }

  async function logout(): Promise<void> {
    await $fetch('/auth/logout', {
      baseURL: config.public.apiBase,
      method: 'POST',
      credentials: 'include'
    })
    user.value = null
    loaded.value = false
    await navigateTo('/login')
  }

  return { user, loaded, fetchCurrentUser, logout }
}
