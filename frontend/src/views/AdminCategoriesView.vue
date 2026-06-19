<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import MainLayout from '../layouts/MainLayout.vue'
import BaseCard from '../components/base/BaseCard.vue'
import AdminNav from '../components/admin/AdminNav.vue'
import { catalogAdminService } from '../services/catalogAdmin.service'
import type { Category } from '../types/catalog'

const categoryList = ref<Category[]>([])
const refreshList = (): void => {
  categoryList.value = [...catalogAdminService.listCategories()]
}
refreshList()

const nameById = computed(() => new Map(categoryList.value.map((category) => [category.id, category.name])))
const parentName = (parentId: string | null): string =>
  parentId ? (nameById.value.get(parentId) ?? `#${parentId}`) : '— główna —'

const form = reactive({
  name: '',
  parentId: '',
})
const message = ref<string | null>(null)
const error = ref<string | null>(null)

const submit = (): void => {
  message.value = null
  error.value = null

  if (!form.name.trim()) {
    error.value = 'Nazwa kategorii jest wymagana.'
    return
  }

  try {
    const created = catalogAdminService.addCategory({
      name: form.name.trim(),
      parentId: form.parentId || null,
    })
    message.value = `Dodano kategorię „${created.name}".`
    form.name = ''
    form.parentId = ''
    refreshList()
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'Nie udało się dodać kategorii.'
  }
}
</script>

<template>
  <MainLayout>
    <div class="cat-admin">
      <header class="cat-admin__head">
        <div>
          <p class="cat-admin__eyebrow">Panel administracyjny</p>
          <h1 class="cat-admin__title">Kategorie</h1>
        </div>
      </header>

      <AdminNav />

      <p class="cat-admin__note">
        To mock — nowe kategorie są widoczne w nawigacji sklepu do czasu odświeżenia strony.
      </p>

      <div class="cat-admin__grid">
        <BaseCard class="panel">
          <h2 class="panel__title">Dodaj kategorię</h2>
          <form class="form" @submit.prevent="submit">
            <label class="form__field">
              <span>Nazwa *</span>
              <input v-model="form.name" type="text" required />
            </label>
            <label class="form__field">
              <span>Kategoria nadrzędna</span>
              <select v-model="form.parentId">
                <option value="">— Kategoria główna —</option>
                <option v-for="category in categoryList" :key="category.id" :value="category.id">
                  {{ category.name }}
                </option>
              </select>
            </label>

            <p v-if="error" class="form__error">{{ error }}</p>
            <p v-if="message" class="form__ok">{{ message }}</p>

            <button class="form__submit" type="submit">Dodaj kategorię</button>
          </form>
        </BaseCard>

        <BaseCard class="panel">
          <h2 class="panel__title">Kategorie ({{ categoryList.length }})</h2>
          <ul class="cat-list">
            <li v-for="category in categoryList" :key="category.id" class="cat-list__row">
              <span class="cat-list__name">{{ category.name }}</span>
              <span class="cat-list__parent">{{ parentName(category.parentId) }}</span>
              <span class="cat-list__badge" :class="{ 'cat-list__badge--leaf': category.isLeaf }">
                {{ category.isLeaf ? 'liść' : 'grupa' }}
              </span>
            </li>
          </ul>
        </BaseCard>
      </div>
    </div>
  </MainLayout>
</template>

<style scoped>
.cat-admin {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.cat-admin__eyebrow {
  margin: 0;
  font-size: 0.76rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.cat-admin__title {
  margin: 0.2rem 0 0;
  font-family: var(--font-heading);
  font-size: clamp(1.4rem, 4vw, 1.9rem);
  color: var(--color-text-primary);
}

.cat-admin__note {
  margin: 0;
  font-size: 0.84rem;
  color: var(--color-text-secondary);
  background: rgba(234, 179, 8, 0.12);
  border: 1px solid rgba(234, 179, 8, 0.3);
  border-radius: 12px;
  padding: 0.55rem 0.8rem;
}

.cat-admin__grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(1, minmax(0, 1fr));
}

.panel {
  padding: 1.1rem;
}

.panel__title {
  margin: 0 0 0.9rem;
  font-size: 1rem;
  color: var(--color-text-primary);
}

.form {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}

.form__field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.84rem;
  color: var(--color-text-secondary);
}

.form__field input,
.form__field select {
  border: 1px solid var(--color-border-soft);
  border-radius: 10px;
  padding: 0.5rem 0.6rem;
  font: inherit;
  color: var(--color-text-primary);
  background: #fff;
}

.form__field input:focus,
.form__field select:focus {
  outline: none;
  border-color: var(--color-brand-strong);
}

.form__error {
  margin: 0;
  color: #991b1b;
  font-size: 0.84rem;
}

.form__ok {
  margin: 0;
  color: #0f766e;
  font-size: 0.84rem;
}

.form__submit {
  align-self: flex-start;
  border: none;
  border-radius: 12px;
  background: var(--color-brand-strong);
  color: #fff;
  padding: 0.6rem 1.2rem;
  font-size: 0.9rem;
  cursor: pointer;
}

.form__submit:hover {
  background: #0d6660;
}

.cat-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  max-height: 360px;
  overflow: auto;
}

.cat-list__row {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr) auto;
  gap: 0.6rem;
  align-items: center;
  border-bottom: 1px solid var(--color-border-soft);
  padding-bottom: 0.4rem;
  font-size: 0.86rem;
}

.cat-list__name {
  color: var(--color-text-primary);
}

.cat-list__parent {
  color: var(--color-text-secondary);
}

.cat-list__badge {
  justify-self: end;
  font-size: 0.72rem;
  border-radius: 999px;
  padding: 0.15rem 0.55rem;
  background: rgba(148, 163, 184, 0.2);
  color: var(--color-text-secondary);
}

.cat-list__badge--leaf {
  background: rgba(20, 184, 166, 0.14);
  color: var(--color-brand-strong);
}

@media (min-width: 820px) {
  .cat-admin__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
