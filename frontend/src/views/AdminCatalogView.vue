<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import MainLayout from '../layouts/MainLayout.vue'
import BaseCard from '../components/base/BaseCard.vue'
import AdminNav from '../components/admin/AdminNav.vue'
import { useCurrency } from '../composables/useCurrency'
import { catalogAdminService } from '../services/catalogAdmin.service'
import { categories } from '../mocks/catalogData'
import type { Product } from '../types/catalog'

const { formatPrice } = useCurrency()

const leafCategories = categories.filter((category) => category.isLeaf)
const productList = ref<Product[]>([])
const refreshList = (): void => {
  productList.value = [...catalogAdminService.listProducts()]
}
refreshList()

// --- Add product ---
const productForm = reactive({
  name: '',
  description: '',
  categoryId: leafCategories[0]?.id ?? '',
  price: 0,
  imageUrl: '',
  brandName: '',
  sku: '',
  stock: 0,
})
const productMessage = ref<string | null>(null)
const productError = ref<string | null>(null)

const submitProduct = (): void => {
  productMessage.value = null
  productError.value = null

  if (!productForm.name.trim() || !productForm.sku.trim()) {
    productError.value = 'Nazwa i SKU są wymagane.'
    return
  }
  if (productForm.price <= 0) {
    productError.value = 'Cena musi być większa od zera.'
    return
  }

  try {
    const created = catalogAdminService.addProduct({
      name: productForm.name.trim(),
      description: productForm.description.trim(),
      categoryId: productForm.categoryId,
      price: Number(productForm.price),
      imageUrl: productForm.imageUrl.trim(),
      brandName: productForm.brandName.trim() || undefined,
      sku: productForm.sku.trim(),
      stock: Number(productForm.stock),
    })
    productMessage.value = `Dodano produkt „${created.name}".`
    productForm.name = ''
    productForm.description = ''
    productForm.price = 0
    productForm.imageUrl = ''
    productForm.brandName = ''
    productForm.sku = ''
    productForm.stock = 0
    refreshList()
  } catch (caught) {
    productError.value = caught instanceof Error ? caught.message : 'Nie udało się dodać produktu.'
  }
}

// --- Add offer (variant) ---
const offerForm = reactive({
  productId: '',
  sku: '',
  price: 0,
  stock: 0,
  attributeName: '',
  attributeValue: '',
})
const offerMessage = ref<string | null>(null)
const offerError = ref<string | null>(null)

const productOptions = computed(() => productList.value)

const submitOffer = (): void => {
  offerMessage.value = null
  offerError.value = null

  if (!offerForm.productId) {
    offerError.value = 'Wybierz produkt.'
    return
  }
  if (!offerForm.sku.trim()) {
    offerError.value = 'SKU jest wymagane.'
    return
  }
  if (offerForm.price <= 0) {
    offerError.value = 'Cena musi być większa od zera.'
    return
  }

  try {
    catalogAdminService.addOffer({
      productId: offerForm.productId,
      sku: offerForm.sku.trim(),
      price: Number(offerForm.price),
      stock: Number(offerForm.stock),
      attributeName: offerForm.attributeName.trim() || undefined,
      attributeValue: offerForm.attributeValue.trim() || undefined,
    })
    offerMessage.value = 'Dodano wariant.'
    offerForm.sku = ''
    offerForm.price = 0
    offerForm.stock = 0
    offerForm.attributeName = ''
    offerForm.attributeValue = ''
    refreshList()
  } catch (caught) {
    offerError.value = caught instanceof Error ? caught.message : 'Nie udało się dodać wariantu.'
  }
}
</script>

<template>
  <MainLayout>
    <div class="catalog-admin">
      <header class="catalog-admin__head">
        <div>
          <p class="catalog-admin__eyebrow">Panel administracyjny</p>
          <h1 class="catalog-admin__title">Katalog — produkty i oferty</h1>
        </div>
      </header>

      <AdminNav />

      <p class="catalog-admin__note">
        To mock — dodane pozycje są widoczne w sklepie do czasu odświeżenia strony.
      </p>

      <div class="catalog-admin__forms">
        <BaseCard class="panel">
          <h2 class="panel__title">Dodaj produkt</h2>
          <form class="form" @submit.prevent="submitProduct">
            <label class="form__field">
              <span>Nazwa *</span>
              <input v-model="productForm.name" type="text" required />
            </label>
            <label class="form__field">
              <span>Opis</span>
              <textarea v-model="productForm.description" rows="3" />
            </label>
            <label class="form__field">
              <span>Kategoria *</span>
              <select v-model="productForm.categoryId">
                <option v-for="category in leafCategories" :key="category.id" :value="category.id">
                  {{ category.name }}
                </option>
              </select>
            </label>
            <div class="form__row">
              <label class="form__field">
                <span>Cena (PLN) *</span>
                <input v-model.number="productForm.price" type="number" min="0" step="0.01" />
              </label>
              <label class="form__field">
                <span>Stan magazynowy</span>
                <input v-model.number="productForm.stock" type="number" min="0" />
              </label>
            </div>
            <div class="form__row">
              <label class="form__field">
                <span>SKU *</span>
                <input v-model="productForm.sku" type="text" />
              </label>
              <label class="form__field">
                <span>Marka</span>
                <input v-model="productForm.brandName" type="text" />
              </label>
            </div>
            <label class="form__field">
              <span>URL zdjęcia</span>
              <input v-model="productForm.imageUrl" type="url" placeholder="https://…" />
            </label>

            <p v-if="productError" class="form__error">{{ productError }}</p>
            <p v-if="productMessage" class="form__ok">{{ productMessage }}</p>

            <button class="form__submit" type="submit">Dodaj produkt</button>
          </form>
        </BaseCard>

        <BaseCard class="panel">
          <h2 class="panel__title">Dodaj wariant (ofertę)</h2>
          <form class="form" @submit.prevent="submitOffer">
            <label class="form__field">
              <span>Produkt *</span>
              <select v-model="offerForm.productId">
                <option value="" disabled>— wybierz produkt —</option>
                <option v-for="product in productOptions" :key="product.id" :value="product.id">
                  {{ product.name }}
                </option>
              </select>
            </label>
            <div class="form__row">
              <label class="form__field">
                <span>SKU *</span>
                <input v-model="offerForm.sku" type="text" />
              </label>
              <label class="form__field">
                <span>Cena (PLN) *</span>
                <input v-model.number="offerForm.price" type="number" min="0" step="0.01" />
              </label>
            </div>
            <div class="form__row">
              <label class="form__field">
                <span>Stan magazynowy</span>
                <input v-model.number="offerForm.stock" type="number" min="0" />
              </label>
              <label class="form__field">
                <span>Cecha wariantu</span>
                <input v-model="offerForm.attributeName" type="text" placeholder="np. Kolor" />
              </label>
            </div>
            <label class="form__field">
              <span>Wartość cechy</span>
              <input v-model="offerForm.attributeValue" type="text" placeholder="np. Czerwony" />
            </label>

            <p v-if="offerError" class="form__error">{{ offerError }}</p>
            <p v-if="offerMessage" class="form__ok">{{ offerMessage }}</p>

            <button class="form__submit" type="submit">Dodaj wariant</button>
          </form>
        </BaseCard>
      </div>

      <BaseCard class="panel">
        <h2 class="panel__title">Produkty w katalogu ({{ productList.length }})</h2>
        <ul class="catalog-list">
          <li v-for="product in productList" :key="product.id" class="catalog-list__row">
            <span class="catalog-list__name">{{ product.name }}</span>
            <span class="catalog-list__cat">{{ product.category.name }}</span>
            <span class="catalog-list__variants">{{ product.offers.length }} wariant(ów)</span>
            <span class="catalog-list__price">od {{ formatPrice(product.priceFrom.amount) }}</span>
          </li>
        </ul>
      </BaseCard>
    </div>
  </MainLayout>
</template>

<style scoped>
.catalog-admin {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.catalog-admin__head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 0.5rem;
}

.catalog-admin__eyebrow {
  margin: 0;
  font-size: 0.76rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.catalog-admin__title {
  margin: 0.2rem 0 0;
  font-family: var(--font-heading);
  font-size: clamp(1.4rem, 4vw, 1.9rem);
  color: var(--color-text-primary);
}

.catalog-admin__link {
  color: var(--color-text-secondary);
  text-decoration: none;
  font-size: 0.9rem;
}

.catalog-admin__link:hover {
  color: var(--color-brand-strong);
}

.catalog-admin__note {
  margin: 0;
  font-size: 0.84rem;
  color: var(--color-text-secondary);
  background: rgba(234, 179, 8, 0.12);
  border: 1px solid rgba(234, 179, 8, 0.3);
  border-radius: 12px;
  padding: 0.55rem 0.8rem;
}

.catalog-admin__forms {
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

.form__row {
  display: grid;
  grid-template-columns: 1fr 1fr;
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
.form__field select,
.form__field textarea {
  border: 1px solid var(--color-border-soft);
  border-radius: 10px;
  padding: 0.5rem 0.6rem;
  font: inherit;
  color: var(--color-text-primary);
  background: #fff;
}

.form__field input:focus,
.form__field select:focus,
.form__field textarea:focus {
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

.catalog-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.catalog-list__row {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr) auto auto;
  gap: 0.6rem;
  align-items: center;
  border-bottom: 1px solid var(--color-border-soft);
  padding-bottom: 0.4rem;
  font-size: 0.86rem;
}

.catalog-list__name {
  color: var(--color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.catalog-list__cat,
.catalog-list__variants {
  color: var(--color-text-secondary);
}

.catalog-list__price {
  font-weight: 600;
  color: var(--color-brand-strong);
  text-align: right;
}

@media (min-width: 820px) {
  .catalog-admin__forms {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
