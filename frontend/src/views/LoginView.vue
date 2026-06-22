<script setup lang="ts">
import { computed, ref } from 'vue'

import MainLayout from '../layouts/MainLayout.vue'
import BaseInput from '../components/base/BaseInput.vue'
import { useAuthStore } from '../stores/auth.store'

const authStore = useAuthStore()

const email = ref('jan@example.com')
const password = ref('demo1234')
const validationError = ref<string | null>(null)

const submitLabel = computed(() => (authStore.isLoading ? 'Logowanie...' : 'Zaloguj się'))

const submit = async (): Promise<void> => {
  validationError.value = null

  if (!email.value.trim() || !password.value.trim()) {
    validationError.value = 'Uzupełnij email i hasło.'
    return
  }

  const loggedIn = await authStore.login(email.value, password.value)

  if (loggedIn) {
    await navigateTo('/')
  }
}
</script>

<template>
  <MainLayout>
    <section class="login-shell">
      <article class="login-card">
        <p class="login-card__eyebrow">Konto użytkownika</p>
        <h2>Logowanie</h2>
        <p class="login-card__hint">Użyj konta demo, aby sprawdzić działanie uwierzytelniania przez mock GraphQL.</p>

        <form class="login-form" @submit.prevent="submit">
          <label>
            <span>Email</span>
            <BaseInput v-model="email" type="email" autocomplete="email" placeholder="name@example.com" />
          </label>

          <label>
            <span>Hasło</span>
            <BaseInput
              v-model="password"
              type="password"
              autocomplete="current-password"
              placeholder="Wpisz hasło"
            />
          </label>

          <p v-if="validationError" class="login-form__error" role="alert">{{ validationError }}</p>
          <p v-else-if="authStore.error" class="login-form__error" role="alert">{{ authStore.error }}</p>

          <button class="login-form__submit" type="submit" :disabled="authStore.isLoading">
            {{ submitLabel }}
          </button>
        </form>
      </article>
    </section>
  </MainLayout>
</template>

<style scoped>
.login-shell {
  display: grid;
  place-items: center;
  min-height: 58vh;
}

.login-card {
  width: min(520px, 100%);
  border: 1px solid var(--color-border-soft);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 22px 40px -34px rgba(15, 23, 42, 0.65);
  padding: 1.2rem;
}

.login-card__eyebrow {
  margin: 0;
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.login-card h2 {
  margin: 0.4rem 0 0;
  font-size: 1.5rem;
}

.login-card__hint {
  margin: 0.65rem 0 0;
  color: var(--color-text-secondary);
}

.login-form {
  margin-top: 1.1rem;
  display: grid;
  gap: 0.85rem;
}

.login-form label {
  display: grid;
  gap: 0.35rem;
}

.login-form label span {
  font-size: 0.84rem;
  color: var(--color-text-secondary);
}

.login-form :deep(input) {
  border-radius: 12px;
  padding-inline-start: 0.92rem;
}

.login-form__error {
  margin: 0;
  border: 1px solid rgba(220, 38, 38, 0.25);
  border-radius: 12px;
  background: rgba(254, 242, 242, 0.85);
  color: #991b1b;
  padding: 0.62rem 0.78rem;
  font-size: 0.9rem;
}

.login-form__submit {
  border: none;
  border-radius: 12px;
  background: var(--color-brand-strong);
  color: #fff;
  padding: 0.72rem 0.95rem;
  font-size: 0.95rem;
  cursor: pointer;
}

.login-form__submit:disabled {
  cursor: wait;
  opacity: 0.75;
}
</style>
