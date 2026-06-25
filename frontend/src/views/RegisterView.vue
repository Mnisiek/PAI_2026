<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import MainLayout from '../layouts/MainLayout.vue'
import BaseInput from '../components/base/BaseInput.vue'
import { useAuthStore } from '../stores/auth.store'

const authStore = useAuthStore()
const router = useRouter()

const email = ref('anna@example.com')
const password = ref('demo1234')
const confirmPassword = ref('demo1234')
const validationError = ref<string | null>(null)

const submitLabel = computed(() => (authStore.isLoading ? 'Tworzenie konta...' : 'Załóż konto'))

const submit = async (): Promise<void> => {
  validationError.value = null

  if (!email.value.trim() || !password.value.trim() || !confirmPassword.value.trim()) {
    validationError.value = 'Uzupełnij email, hasło i potwierdzenie hasła.'
    return
  }

  if (password.value.length < 8) {
    validationError.value = 'Hasło musi mieć co najmniej 8 znaków.'
    return
  }

  if (password.value !== confirmPassword.value) {
    validationError.value = 'Hasła muszą być identyczne.'
    return
  }

  const registered = await authStore.register(email.value, password.value)

  if (registered) {
    await router.push('/')
  }
}
</script>

<template>
  <MainLayout>
    <section class="register-shell">
      <article class="register-card">
        <p class="register-card__eyebrow">Nowe konto</p>
        <h2>Rejestracja</h2>
        <p class="register-card__hint">Utwórz konto, aby rozpocząć zakupy i śledzić zamówienia.</p>

        <form class="register-form" @submit.prevent="submit">
          <label>
            <span>Email</span>
            <BaseInput v-model="email" type="email" autocomplete="email" placeholder="name@example.com" />
          </label>

          <label>
            <span>Hasło</span>
            <BaseInput
              v-model="password"
              type="password"
              autocomplete="new-password"
              placeholder="Minimum 8 znaków"
            />
          </label>

          <label>
            <span>Potwierdź hasło</span>
            <BaseInput
              v-model="confirmPassword"
              type="password"
              autocomplete="new-password"
              placeholder="Powtórz hasło"
            />
          </label>

          <p v-if="validationError" class="register-form__error" role="alert">{{ validationError }}</p>
          <p v-else-if="authStore.error" class="register-form__error" role="alert">{{ authStore.error }}</p>

          <button class="register-form__submit" type="submit" :disabled="authStore.isLoading">
            {{ submitLabel }}
          </button>
        </form>

        <p class="register-card__switch">
          Masz już konto?
          <NuxtLink class="register-card__link" to="/login">Zaloguj się</NuxtLink>
        </p>
      </article>
    </section>
  </MainLayout>
</template>

<style scoped>
.register-shell {
  display: grid;
  place-items: center;
  min-height: 58vh;
}

.register-card {
  width: min(560px, 100%);
  border: 1px solid var(--color-border-soft);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 22px 40px -34px rgba(15, 23, 42, 0.65);
  padding: 1.2rem;
}

.register-card__eyebrow {
  margin: 0;
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.register-card h2 {
  margin: 0.4rem 0 0;
  font-size: 1.5rem;
}

.register-card__hint {
  margin: 0.65rem 0 0;
  color: var(--color-text-secondary);
}

.register-form {
  margin-top: 1.1rem;
  display: grid;
  gap: 0.85rem;
}

.register-form label {
  display: grid;
  gap: 0.35rem;
}

.register-form label span {
  font-size: 0.84rem;
  color: var(--color-text-secondary);
}

.register-form :deep(input) {
  border-radius: 12px;
  padding-inline-start: 0.92rem;
}

.register-form__error {
  margin: 0;
  border: 1px solid rgba(220, 38, 38, 0.25);
  border-radius: 12px;
  background: rgba(254, 242, 242, 0.85);
  color: #991b1b;
  padding: 0.62rem 0.78rem;
  font-size: 0.9rem;
}

.register-form__submit {
  border: none;
  border-radius: 12px;
  background: var(--color-brand-strong);
  color: #fff;
  padding: 0.72rem 0.95rem;
  font-size: 0.95rem;
  cursor: pointer;
}

.register-form__submit:disabled {
  cursor: wait;
  opacity: 0.75;
}

.register-card__switch {
  margin: 1rem 0 0;
  color: var(--color-text-secondary);
  font-size: 0.92rem;
}

.register-card__link {
  color: var(--color-brand-strong);
  font-weight: 600;
}
</style>