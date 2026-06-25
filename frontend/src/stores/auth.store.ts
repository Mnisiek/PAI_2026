import { defineStore } from 'pinia'
import { authService } from '../services/auth.service'
import { useCartStore } from './cart.store'
import type { User } from '../types/auth'

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  error: string | null
}

interface PersistedAuthState {
  user: User | null
  token: string | null
}

const AUTH_STORAGE_KEY = 'ecommerce-auth-state'

const isLikelyJwt = (token: string): boolean => {
  const segments = token.split('.')
  return segments.length === 3 && segments.every((segment) => segment.length > 0)
}

const readAuthFromStorage = (): PersistedAuthState => {
  if (!import.meta.client) {
    return { user: null, token: null }
  }

  try {
    const rawValue = window.localStorage.getItem(AUTH_STORAGE_KEY)

    if (!rawValue) {
      return { user: null, token: null }
    }

    const parsedValue = JSON.parse(rawValue) as PersistedAuthState
    const token = parsedValue.token ?? null

    return {
      user: parsedValue.user ?? null,
      token: token && isLikelyJwt(token) ? token : null,
    }
  } catch {
    return { user: null, token: null }
  }
}

const persistAuthState = (state: PersistedAuthState): void => {
  if (!import.meta.client) {
    return
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(state))
}

const defaultErrorMessage = 'Nie udało się wykonać operacji autoryzacji. Spróbuj ponownie.'

const errorToMessage = (error: unknown): string => {
  if (error instanceof Error && error.message) {
    return error.message
  }

  return defaultErrorMessage
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    token: null,
    isLoading: false,
    error: null,
  }),

  getters: {
    isAuthenticated: (state): boolean => Boolean(state.user && state.token),
    isAdmin: (state): boolean => state.user?.role === 'ADMIN',
  },

  actions: {
    hydrateFromStorage(): void {
      const persistedState = readAuthFromStorage()
      this.user = persistedState.user
      this.token = persistedState.token
    },

    async login(email: string, password: string): Promise<boolean> {
      const previousUserId = this.user?.id ?? null
      this.error = null
      this.isLoading = true

      try {
        const payload = await authService.login({ email, password })

        this.user = payload.user
        this.token = payload.token

        persistAuthState({
          user: this.user,
          token: this.token,
        })

        const cartStore = useCartStore()
        cartStore.syncCartForAuthTransition(previousUserId, this.user?.id ?? null)

        return true
      } catch (error) {
        this.error = errorToMessage(error)
        this.user = null
        this.token = null
        persistAuthState({ user: null, token: null })

        const cartStore = useCartStore()
        cartStore.syncCartForAuthTransition(previousUserId, null)

        return false
      } finally {
        this.isLoading = false
      }
    },

    async register(email: string, password: string): Promise<boolean> {
      const previousUserId = this.user?.id ?? null
      this.error = null
      this.isLoading = true

      try {
        const payload = await authService.register({ email, password })

        this.user = payload.user
        this.token = payload.token

        persistAuthState({
          user: this.user,
          token: this.token,
        })

        const cartStore = useCartStore()
        cartStore.syncCartForAuthTransition(previousUserId, this.user?.id ?? null)

        return true
      } catch (error) {
        this.error = errorToMessage(error)
        this.user = null
        this.token = null
        persistAuthState({ user: null, token: null })

        const cartStore = useCartStore()
        cartStore.syncCartForAuthTransition(previousUserId, null)

        return false
      } finally {
        this.isLoading = false
      }
    },

    logout(): void {
      const previousUserId = this.user?.id ?? null
      this.user = null
      this.token = null
      this.error = null
      persistAuthState({ user: null, token: null })

      const cartStore = useCartStore()
      cartStore.syncCartForAuthTransition(previousUserId, null)
    },

    // Server-side permission check: re-resolves the user (and role) from the
    // bearer token. Used to gate the admin panel. Clears state if the token is
    // no longer valid.
    async fetchCurrentUser(): Promise<void> {
      if (!this.token) {
        return
      }

      try {
        const user = await authService.me()
        if (user) {
          this.user = user
          persistAuthState({ user, token: this.token })
        } else {
          this.logout()
        }
      } catch {
        // Network/transient error — keep the current (persisted) state.
      }
    },
  },
})
