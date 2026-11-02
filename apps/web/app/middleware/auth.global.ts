export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path === '/login' || to.path === '/setup') return

  const auth = useAuth()
  if (auth.user.value) return

  try {
    await auth.fetchCurrentUser()
  } catch {
    return navigateTo({
      path: '/login',
      query: { redirect: to.fullPath }
    })
  }
})
