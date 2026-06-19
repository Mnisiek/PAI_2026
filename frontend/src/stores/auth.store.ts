import { defineStore } from 'pinia'
import { authService } from '../services/auth.service'
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

const readAuthFromStorage = (): PersistedAuthState => {
  try {
    const rawValue = window.localStorage.getItem(AUTH_STORAGE_KEY)

    if (!rawValue) {
      return { user: null, token: null }
    }

    const parsedValue = JSON.parse(rawValue) as PersistedAuthState

    return {
      user: parsedValue.user ?? null,
      token: parsedValue.token ?? null,
    }
  } catch {
    return { user: null, token: null }
  }
}

const persistAuthState = (state: PersistedAuthState): void => {
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(state))
}

const defaultErrorMessage = 'Nie udało się zalogować. Spróbuj ponownie.'

const errorToMessage = (error: unknown): string => {
  if (error instanceof Error && error.message) {
    return error.message
  }

  return defaultErrorMessage
}

const persistedState = readAuthFromStorage()

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: persistedState.user,
    token: persistedState.token,
    isLoading: false,
    error: null,
  }),

  getters: {
    isAuthenticated: (state): boolean => Boolean(state.user && state.token),
  },

  actions: {
    async login(email: string, password: string): Promise<boolean> {
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

        return true
      } catch (error) {
        this.error = errorToMessage(error)
        this.user = null
        this.token = null
        persistAuthState({ user: null, token: null })

        return false
      } finally {
        this.isLoading = false
      }
    },

    logout(): void {
      this.user = null
      this.token = null
      this.error = null
      persistAuthState({ user: null, token: null })
    },
  },
})
