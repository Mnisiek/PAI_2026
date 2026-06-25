<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import MainLayout from '../layouts/MainLayout.vue'
import BaseCard from '../components/base/BaseCard.vue'
import BaseSelectize from '../components/base/BaseSelectize.vue'
import AdminNav from '../components/admin/AdminNav.vue'
import { catalogAdminService } from '../services/catalogAdmin.service'
import type { Category } from '../types/catalog'

const categoryList = ref<Category[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)

const refreshList = async (): Promise<void> => {
  isLoading.value = true
  error.value = null

  try {
    categoryList.value = await catalogAdminService.listCategories()
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'Nie udało się pobrać kategorii.'
  } finally {
    isLoading.value = false
  }
}

void refreshList()

const nameById = computed(() => new Map(categoryList.value.map((category) => [category.id, category.name])))
const parentName = (parentId: string | null): string =>
  parentId ? (nameById.value.get(parentId) ?? `#${parentId}`) : '— główna —'

const parentOptions = computed(() =>
  categoryList.value.map((category) => ({ value: category.id, label: category.name })),
)

const form = reactive({
  name: '',
  parentId: '',
})
const message = ref<string | null>(null)
const editingId = ref<string | null>(null)

type FilterRow = { name: string; dataType: string }
const filterAttributes = ref<FilterRow[]>([])

const DATA_TYPE_OPTIONS = [
  { value: 'TEXT', label: 'Tekst' },
  { value: 'NUMBER', label: 'Liczba' },
  { value: 'BOOL', label: 'Tak/Nie' },
] as const

const addFilterRow = (): void => {
  filterAttributes.value.push({ name: '', dataType: 'TEXT' })
}

const removeFilterRow = (index: number): void => {
  filterAttributes.value.splice(index, 1)
}

const resetForm = (): void => {
  form.name = ''
  form.parentId = ''
  filterAttributes.value = []
  editingId.value = null
}

const startEdit = (category: Category): void => {
  editingId.value = category.id
  form.name = category.name
  form.parentId = category.parentId ?? ''
  filterAttributes.value = []
  message.value = null
  error.value = null
}

const cancelEdit = (): void => {
  resetForm()
  message.value = null
  error.value = null
}

const submit = async (): Promise<void> => {
  message.value = null
  error.value = null

  if (!form.name.trim()) {
    error.value = 'Nazwa kategorii jest wymagana.'
    return
  }

  try {
    if (editingId.value) {
      const updated = await catalogAdminService.updateCategory({
        id: editingId.value,
        name: form.name.trim(),
        parentId: form.parentId || null,
      })
      message.value = `Zaktualizowano kategorię „${updated.name}".`
    } else {
      const attributes = filterAttributes.value
        .map((row) => ({ name: row.name.trim(), dataType: row.dataType }))
        .filter((row) => row.name)
      const created = await catalogAdminService.addCategory({
        name: form.name.trim(),
        parentId: form.parentId || null,
        attributes: attributes.length > 0 ? attributes : undefined,
      })
      message.value = `Dodano kategorię „${created.name}".`
    }
    resetForm()
    await refreshList()
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'Nie udało się zapisać kategorii.'
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

      <div class="cat-admin__grid">
        <BaseCard class="panel">
          <h2 class="panel__title">{{ editingId ? 'Edytuj kategorię' : 'Dodaj kategorię' }}</h2>
          <form class="form" @submit.prevent="submit">
            <label class="form__field">
              <span>Nazwa *</span>
              <input v-model="form.name" type="text" required />
            </label>
            <div class="form__field">
              <span>Kategoria nadrzędna</span>
              <BaseSelectize
                v-model="form.parentId"
                :options="parentOptions"
                empty-label="— Kategoria główna —"
                placeholder="— Kategoria główna —"
                aria-label="Kategoria nadrzędna"
              />
            </div>

            <div v-if="!editingId" class="form__field">
              <span>Dostępne filtry</span>
              <div class="filter-defs">
                <div
                  v-for="(row, index) in filterAttributes"
                  :key="index"
                  class="filter-defs__row"
                >
                  <input v-model="row.name" type="text" placeholder="Nazwa filtra (np. Rozmiar)" />
                  <select v-model="row.dataType" aria-label="Typ filtra">
                    <option v-for="opt in DATA_TYPE_OPTIONS" :key="opt.value" :value="opt.value">
                      {{ opt.label }}
                    </option>
                  </select>
                  <button type="button" class="filter-defs__remove" @click="removeFilterRow(index)">
                    Usuń
                  </button>
                </div>

                <button type="button" class="filter-defs__add" @click="addFilterRow">
                  Dodaj filtr
                </button>
              </div>
            </div>

            <p v-if="error" class="form__error">{{ error }}</p>
            <p v-if="message" class="form__ok">{{ message }}</p>

            <div class="form__actions">
              <button class="form__submit" type="submit">
                {{ editingId ? 'Zapisz zmiany' : 'Dodaj kategorię' }}
              </button>
              <button v-if="editingId" type="button" class="form__cancel" @click="cancelEdit">
                Anuluj
              </button>
            </div>
          </form>
        </BaseCard>

        <BaseCard class="panel">
          <h2 class="panel__title">Kategorie ({{ categoryList.length }})</h2>
          <p v-if="isLoading" class="form__ok">Odświeżanie listy kategorii...</p>
          <ul class="cat-list">
            <li v-for="category in categoryList" :key="category.id" class="cat-list__row">
              <span class="cat-list__name">{{ category.name }}</span>
              <span class="cat-list__parent">{{ parentName(category.parentId) }}</span>
              <span class="cat-list__badge" :class="{ 'cat-list__badge--leaf': category.isLeaf }">
                {{ category.isLeaf ? 'liść' : 'grupa' }}
              </span>
              <button type="button" class="cat-list__edit" @click="startEdit(category)">Edytuj</button>
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
  min-width: 0;
  font-size: 0.84rem;
  color: var(--color-text-secondary);
}

.form__field input,
.form__field select {
  width: 100%;
  min-width: 0;
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

.form__actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.form__cancel {
  border: 1px solid var(--color-border-soft);
  border-radius: 12px;
  background: #fff;
  color: var(--color-text-secondary);
  padding: 0.6rem 1rem;
  font-size: 0.9rem;
  cursor: pointer;
}

.form__cancel:hover {
  border-color: var(--color-brand-strong);
  color: var(--color-brand-strong);
}

.cat-list__edit {
  justify-self: end;
  border: 1px solid var(--color-border-soft);
  border-radius: 999px;
  background: #fff;
  color: var(--color-text-secondary);
  font-size: 0.78rem;
  padding: 0.28rem 0.7rem;
  cursor: pointer;
}

.cat-list__edit:hover {
  border-color: var(--color-brand-strong);
  color: var(--color-brand-strong);
}

.filter-defs {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.filter-defs__row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  gap: 0.5rem;
  align-items: center;
}

.filter-defs__add,
.filter-defs__remove {
  border: 1px solid var(--color-border-soft);
  border-radius: 10px;
  background: #fff;
  color: var(--color-text-secondary);
  font: inherit;
  cursor: pointer;
  padding: 0.45rem 0.7rem;
}

.filter-defs__add {
  align-self: flex-start;
}

.filter-defs__add:hover,
.filter-defs__remove:hover {
  border-color: var(--color-brand-strong);
  color: var(--color-brand-strong);
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
  grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr) auto auto;
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

@media (max-width: 560px) {
  .cat-list__row {
    grid-template-columns: minmax(0, 1fr) auto auto;
  }

  .filter-defs__row {
    grid-template-columns: 1fr auto;
  }

  .cat-list__parent {
    grid-column: 1 / -1;
    font-size: 0.8rem;
  }
}
</style>
