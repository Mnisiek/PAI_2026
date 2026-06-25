import { useAuthStore } from '../stores/auth.store'

// Gate /admin/** behind the ADMIN role. Runs client-side (admin pages are
// ssr:false and auth state lives in the browser). Verifies the role against the
// backend (`me`) so a stale/forged local role can't unlock the panel.
export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) {
    return
  }
  if (!to.path.startsWith('/admin')) {
    return
  }

  const auth = useAuthStore()

  if (!auth.token) {
    return navigateTo('/login')
  }

  if (!auth.isAdmin) {
    await auth.fetchCurrentUser()
  }

  if (!auth.isAdmin) {
    return navigateTo('/')
  }
})
