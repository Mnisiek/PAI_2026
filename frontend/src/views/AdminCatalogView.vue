<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import MainLayout from '../layouts/MainLayout.vue'
import BaseCard from '../components/base/BaseCard.vue'
import BaseSelectize from '../components/base/BaseSelectize.vue'
import AdminNav from '../components/admin/AdminNav.vue'
import { useCurrency } from '../composables/useCurrency'
import { catalogAdminService } from '../services/catalogAdmin.service'
import { catalogService } from '../services/catalog.service'
import type { AdminOffer, AttributeValue, Category, Product } from '../types/catalog'

const { formatPrice } = useCurrency()

const leafCategories = ref<Category[]>([])
const productList = ref<Product[]>([])
const refreshList = async (): Promise<void> => {
  const [products, categories] = await Promise.all([
    catalogAdminService.listProducts(),
    catalogService.getCategories(),
  ])

  productList.value = products
  leafCategories.value = categories.filter((category) => category.isLeaf)

  if (!productForm.categoryId && leafCategories.value.length > 0) {
    productForm.categoryId = leafCategories.value[0].id
  }
}

void refreshList()

// --- Add product ---
const productForm = reactive({
  name: '',
  description: '',
  categoryId: '',
  price: 0,
  imageUrl: '',
  brandName: '',
  sku: '',
  stock: 0,
})
const productMessage = ref<string | null>(null)
const productError = ref<string | null>(null)
const editingProductId = ref<string | null>(null)

type AttributeRow = { name: string; value: string }

const cleanAttributeRows = (rows: AttributeRow[]) =>
  rows
    .map((row) => ({ name: row.name.trim(), value: row.value.trim() }))
    .filter((row) => row.name || row.value)

const productAttributes = ref<AttributeRow[]>([{ name: '', value: '' }])

const addProductAttributeRow = (): void => {
  productAttributes.value.push({ name: '', value: '' })
}

const removeProductAttributeRow = (index: number): void => {
  if (productAttributes.value.length === 1) {
    productAttributes.value[0] = { name: '', value: '' }
    return
  }
  productAttributes.value.splice(index, 1)
}

const resetProductForm = (): void => {
  productForm.name = ''
  productForm.description = ''
  productForm.price = 0
  productForm.imageUrl = ''
  productForm.brandName = ''
  productForm.sku = ''
  productForm.stock = 0
  productAttributes.value = [{ name: '', value: '' }]
  editingProductId.value = null
}

const startEditProduct = (product: Product): void => {
  editingProductId.value = product.id
  productForm.name = product.name
  productForm.description = product.description ?? ''
  productForm.categoryId = product.category.id
  productForm.brandName = product.brand?.name ?? ''
  productForm.imageUrl = product.mainImageUrl ?? ''
  productMessage.value = null
  productError.value = null
}

const cancelEditProduct = (): void => {
  resetProductForm()
  productMessage.value = null
  productError.value = null
}

const toggleProductStatus = async (product: Product): Promise<void> => {
  const next = product.status === 'ACTIVE' ? 'ARCHIVED' : 'ACTIVE'
  try {
    await catalogAdminService.setProductStatus(product.id, next)
    await refreshList()
  } catch (caught) {
    productError.value =
      caught instanceof Error ? caught.message : 'Nie udało się zmienić statusu produktu.'
  }
}

const toggleOfferStatus = async (offer: AdminOffer): Promise<void> => {
  const next = offer.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
  try {
    await catalogAdminService.setOfferStatus(offer.id, next)
    await refreshList()
  } catch (caught) {
    productError.value =
      caught instanceof Error ? caught.message : 'Nie udało się zmienić statusu wariantu.'
  }
}

const submitProduct = async (): Promise<void> => {
  productMessage.value = null
  productError.value = null

  if (!productForm.name.trim()) {
    productError.value = 'Nazwa jest wymagana.'
    return
  }

  try {
    if (editingProductId.value) {
      const updated = await catalogAdminService.updateProduct({
        id: editingProductId.value,
        name: productForm.name.trim(),
        description: productForm.description.trim(),
        categoryId: productForm.categoryId,
        brandName: productForm.brandName.trim() || undefined,
        imageUrl: productForm.imageUrl.trim() || undefined,
      })
      productMessage.value = `Zaktualizowano produkt „${updated.name}".`
      resetProductForm()
      await refreshList()
      return
    }

    if (!productForm.sku.trim()) {
      productError.value = 'SKU jest wymagane.'
      return
    }
    if (productForm.price <= 0) {
      productError.value = 'Cena musi być większa od zera.'
      return
    }

    const cleanedAttributes = cleanAttributeRows(productAttributes.value)
    if (cleanedAttributes.some((row) => !row.name || !row.value)) {
      productError.value = 'Każda cecha musi mieć nazwę i wartość.'
      return
    }

    const created = await catalogAdminService.addProduct({
      name: productForm.name.trim(),
      description: productForm.description.trim(),
      categoryId: productForm.categoryId,
      price: Number(productForm.price),
      imageUrl: productForm.imageUrl.trim(),
      brandName: productForm.brandName.trim() || undefined,
      sku: productForm.sku.trim(),
      stock: Number(productForm.stock),
      attributes: cleanedAttributes.length > 0 ? cleanedAttributes : undefined,
    })
    productMessage.value = `Dodano produkt „${created.name}".`
    resetProductForm()
    await refreshList()
  } catch (caught) {
    productError.value = caught instanceof Error ? caught.message : 'Nie udało się zapisać produktu.'
  }
}

// --- Add offer (variant) ---
const offerForm = reactive({
  productId: '',
  sku: '',
  price: 0,
  stock: 0,
})
type OfferAttributeRow = {
  name: string
  value: string
}
const offerAttributes = ref<OfferAttributeRow[]>([{ name: '', value: '' }])
const offerImages = ref<{ url: string }[]>([{ url: '' }])
const offerMessage = ref<string | null>(null)
const offerError = ref<string | null>(null)
const editingOfferId = ref<string | null>(null)

const categoryOptions = computed(() =>
  leafCategories.value.map((category) => ({ value: category.id, label: category.name })),
)
const productOptions = computed(() =>
  productList.value.map((product) => ({ value: product.id, label: product.name })),
)

const addOfferAttributeRow = (): void => {
  offerAttributes.value.push({ name: '', value: '' })
}

const removeOfferAttributeRow = (index: number): void => {
  if (offerAttributes.value.length === 1) {
    offerAttributes.value[0] = { name: '', value: '' }
    return
  }

  offerAttributes.value.splice(index, 1)
}

const addOfferImageRow = (): void => {
  offerImages.value.push({ url: '' })
}

const removeOfferImageRow = (index: number): void => {
  if (offerImages.value.length === 1) {
    offerImages.value[0] = { url: '' }
    return
  }

  offerImages.value.splice(index, 1)
}

const resetOfferForm = (): void => {
  offerForm.sku = ''
  offerForm.price = 0
  offerForm.stock = 0
  offerAttributes.value = [{ name: '', value: '' }]
  offerImages.value = [{ url: '' }]
  editingOfferId.value = null
}

const attrToValue = (attribute: AttributeValue): string => {
  if (attribute.textValue != null) return attribute.textValue
  if (attribute.numValue != null) return String(attribute.numValue)
  if (attribute.boolValue != null) return attribute.boolValue ? 'Tak' : 'Nie'
  return ''
}

const startEditOffer = (product: Product, offer: AdminOffer): void => {
  editingOfferId.value = offer.id
  offerForm.productId = product.id
  offerForm.sku = offer.sku
  offerForm.price = offer.price?.amount ?? 0
  offerForm.stock = offer.stock ?? 0
  const attrs = (offer.attributes ?? []).map((a) => ({ name: a.name, value: attrToValue(a) }))
  offerAttributes.value = attrs.length > 0 ? attrs : [{ name: '', value: '' }]
  const imgs = (offer.images ?? []).map((image) => ({ url: image.url }))
  offerImages.value = imgs.length > 0 ? imgs : [{ url: '' }]
  offerMessage.value = null
  offerError.value = null
}

const cancelEditOffer = (): void => {
  resetOfferForm()
  offerMessage.value = null
  offerError.value = null
}

const submitOffer = async (): Promise<void> => {
  offerMessage.value = null
  offerError.value = null

  if (!offerForm.productId) {
    offerError.value = 'Wybierz produkt.'
    return
  }
  if (offerForm.price <= 0) {
    offerError.value = 'Cena musi być większa od zera.'
    return
  }

  const cleanedAttributes = cleanAttributeRows(offerAttributes.value)
  if (cleanedAttributes.some((row) => !row.name || !row.value)) {
    offerError.value = 'Każda cecha wariantu musi mieć nazwę i wartość.'
    return
  }

  const cleanedImages = offerImages.value.map((row) => row.url.trim()).filter(Boolean)

  try {
    if (editingOfferId.value) {
      await catalogAdminService.updateOffer({
        id: editingOfferId.value,
        price: Number(offerForm.price),
        stock: Number(offerForm.stock),
        attributes: cleanedAttributes.length > 0 ? cleanedAttributes : undefined,
        images: cleanedImages.length > 0 ? cleanedImages : undefined,
      })
      offerMessage.value = 'Zaktualizowano wariant.'
    } else {
      if (!offerForm.sku.trim()) {
        offerError.value = 'SKU jest wymagane.'
        return
      }
      await catalogAdminService.addOffer({
        productId: offerForm.productId,
        sku: offerForm.sku.trim(),
        price: Number(offerForm.price),
        stock: Number(offerForm.stock),
        attributes: cleanedAttributes.length > 0 ? cleanedAttributes : undefined,
        images: cleanedImages.length > 0 ? cleanedImages : undefined,
      })
      offerMessage.value = 'Dodano wariant.'
    }
    resetOfferForm()
    await refreshList()
  } catch (caught) {
    offerError.value = caught instanceof Error ? caught.message : 'Nie udało się zapisać wariantu.'
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

      <div class="catalog-admin__forms">
        <BaseCard class="panel">
          <h2 class="panel__title">{{ editingProductId ? 'Edytuj produkt' : 'Dodaj produkt' }}</h2>
          <form class="form" @submit.prevent="submitProduct">
            <label class="form__field">
              <span>Nazwa *</span>
              <input v-model="productForm.name" type="text" required />
            </label>
            <label class="form__field">
              <span>Opis</span>
              <textarea v-model="productForm.description" rows="3" />
            </label>
            <div class="form__field">
              <span>Kategoria *</span>
              <BaseSelectize
                v-model="productForm.categoryId"
                :options="categoryOptions"
                placeholder="Wybierz kategorię"
                aria-label="Kategoria"
              />
            </div>
            <div v-if="!editingProductId" class="form__row">
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
              <label v-if="!editingProductId" class="form__field">
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
              <input v-model="productForm.imageUrl" type="url" placeholder="https://..." />
            </label>

            <div v-if="!editingProductId" class="form__field form__field--full">
              <span>Cechy produktu</span>
              <div class="variant-attributes">
                <div
                  v-for="(attribute, index) in productAttributes"
                  :key="index"
                  class="variant-attributes__row"
                >
                  <input v-model="attribute.name" type="text" placeholder="Nazwa cechy (np. Kolor)" />
                  <input v-model="attribute.value" type="text" placeholder="Wartość (np. Czerwony)" />
                  <button
                    type="button"
                    class="variant-attributes__remove"
                    @click="removeProductAttributeRow(index)"
                  >
                    Usuń
                  </button>
                </div>

                <button
                  type="button"
                  class="variant-attributes__add"
                  @click="addProductAttributeRow"
                >
                  Dodaj cechę
                </button>
              </div>
            </div>

            <p v-if="productError" class="form__error">{{ productError }}</p>
            <p v-if="productMessage" class="form__ok">{{ productMessage }}</p>

            <div class="form__actions">
              <button class="form__submit" type="submit">
                {{ editingProductId ? 'Zapisz zmiany' : 'Dodaj produkt' }}
              </button>
              <button
                v-if="editingProductId"
                type="button"
                class="form__cancel"
                @click="cancelEditProduct"
              >
                Anuluj
              </button>
            </div>
          </form>
        </BaseCard>

        <BaseCard class="panel">
          <h2 class="panel__title">
            {{ editingOfferId ? 'Edytuj wariant' : 'Dodaj wariant (ofertę)' }}
          </h2>
          <form class="form" @submit.prevent="submitOffer">
            <div class="form__field">
              <span>Produkt *</span>
              <BaseSelectize
                v-model="offerForm.productId"
                :options="productOptions"
                placeholder="— wybierz produkt —"
                aria-label="Produkt"
                :disabled="!!editingOfferId"
              />
            </div>
            <div class="form__row">
              <label class="form__field">
                <span>SKU *</span>
                <input v-model="offerForm.sku" type="text" :readonly="!!editingOfferId" />
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
            </div>

            <div class="form__field form__field--full">
              <span>Cechy wariantu</span>
              <div class="variant-attributes">
                <div
                  v-for="(attribute, index) in offerAttributes"
                  :key="index"
                  class="variant-attributes__row"
                >
                  <input
                    v-model="attribute.name"
                    type="text"
                    placeholder="Nazwa cechy (np. Kolor)"
                  />
                  <input
                    v-model="attribute.value"
                    type="text"
                    placeholder="Wartość (np. Czerwony)"
                  />
                  <button
                    type="button"
                    class="variant-attributes__remove"
                    @click="removeOfferAttributeRow(index)"
                  >
                    Usuń
                  </button>
                </div>

                <button
                  type="button"
                  class="variant-attributes__add"
                  @click="addOfferAttributeRow"
                >
                  Dodaj cechę
                </button>
              </div>
            </div>

            <div class="form__field form__field--full">
              <span>Zdjęcia wariantu (miniatury)</span>
              <div class="variant-images">
                <div
                  v-for="(image, index) in offerImages"
                  :key="index"
                  class="variant-images__row"
                >
                  <img
                    v-if="image.url.trim()"
                    :src="image.url.trim()"
                    alt=""
                    class="variant-images__thumb"
                  />
                  <input v-model="image.url" type="url" placeholder="https://... (URL zdjęcia)" />
                  <button
                    type="button"
                    class="variant-attributes__remove"
                    @click="removeOfferImageRow(index)"
                  >
                    Usuń
                  </button>
                </div>

                <button type="button" class="variant-attributes__add" @click="addOfferImageRow">
                  Dodaj zdjęcie
                </button>
              </div>
            </div>

            <p v-if="offerError" class="form__error">{{ offerError }}</p>
            <p v-if="offerMessage" class="form__ok">{{ offerMessage }}</p>

            <div class="form__actions">
              <button class="form__submit" type="submit">
                {{ editingOfferId ? 'Zapisz zmiany' : 'Dodaj wariant' }}
              </button>
              <button
                v-if="editingOfferId"
                type="button"
                class="form__cancel"
                @click="cancelEditOffer"
              >
                Anuluj
              </button>
            </div>
          </form>
        </BaseCard>
      </div>

      <BaseCard class="panel">
        <h2 class="panel__title">Produkty w katalogu ({{ productList.length }})</h2>
        <ul class="catalog-list">
          <li
            v-for="product in productList"
            :key="product.id"
            class="catalog-item"
            :class="{ 'catalog-item--inactive': product.status !== 'ACTIVE' }"
          >
            <div class="catalog-item__head">
              <span class="catalog-item__name">{{ product.name }}</span>
              <span
                class="catalog-item__status"
                :class="{ 'catalog-item__status--off': product.status !== 'ACTIVE' }"
              >
                {{ product.status === 'ACTIVE' ? 'Aktywny' : 'Nieaktywny' }}
              </span>
            </div>

            <div class="catalog-item__meta">
              <span>{{ product.category.name }}</span>
              <span>{{ product.allOffers?.length ?? 0 }} wariant(ów)</span>
              <span v-if="product.priceFrom" class="catalog-item__price">
                od {{ formatPrice(product.priceFrom.amount) }}
              </span>
            </div>

            <div class="catalog-item__actions">
              <button type="button" class="catalog-item__btn" @click="startEditProduct(product)">
                Edytuj
              </button>
              <button type="button" class="catalog-item__btn" @click="toggleProductStatus(product)">
                {{ product.status === 'ACTIVE' ? 'Dezaktywuj' : 'Aktywuj' }}
              </button>
            </div>

            <ul v-if="product.allOffers?.length" class="offer-list">
              <li v-for="offer in product.allOffers" :key="offer.id" class="offer-list__row">
                <span class="offer-list__sku">{{ offer.sku }}</span>
                <span
                  class="offer-list__status"
                  :class="{ 'offer-list__status--off': offer.status !== 'ACTIVE' }"
                >
                  {{ offer.status === 'ACTIVE' ? 'aktywny' : 'nieaktywny' }}
                </span>
                <button type="button" class="offer-list__btn" @click="startEditOffer(product, offer)">
                  Edytuj
                </button>
                <button type="button" class="offer-list__btn" @click="toggleOfferStatus(offer)">
                  {{ offer.status === 'ACTIVE' ? 'Dezaktywuj' : 'Aktywuj' }}
                </button>
              </li>
            </ul>
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
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
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

.form__field--full {
  width: 100%;
}

.form__field input,
.form__field select,
.form__field textarea {
  width: 100%;
  min-width: 0;
  border: 1px solid var(--color-border-soft);
  border-radius: 10px;
  padding: 0.5rem 0.6rem;
  font: inherit;
  color: var(--color-text-primary);
  background: #fff;
}

.form__field textarea {
  resize: vertical;
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

.variant-attributes {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.variant-attributes__row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;
  gap: 0.55rem;
}

.variant-attributes__add,
.variant-attributes__remove {
  border: 1px solid var(--color-border-soft);
  border-radius: 10px;
  background: #fff;
  color: var(--color-text-secondary);
  font: inherit;
  cursor: pointer;
}

.variant-attributes__add {
  align-self: flex-start;
  padding: 0.45rem 0.8rem;
}

.variant-attributes__remove {
  padding: 0.45rem 0.7rem;
}

.variant-attributes__add:hover,
.variant-attributes__remove:hover {
  border-color: var(--color-brand-strong);
  color: var(--color-brand-strong);
}

.variant-images {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.variant-images__row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 0.55rem;
  align-items: center;
}

.variant-images__thumb {
  width: 40px;
  height: 40px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid var(--color-border-soft);
}

.catalog-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.catalog-item {
  border: 1px solid var(--color-border-soft);
  border-radius: 14px;
  padding: 0.7rem 0.8rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.catalog-item--inactive {
  opacity: 0.7;
  background: rgba(148, 163, 184, 0.08);
}

.catalog-item__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
}

.catalog-item__name {
  font-weight: 600;
  color: var(--color-text-primary);
}

.catalog-item__status {
  font-size: 0.72rem;
  border-radius: 999px;
  padding: 0.15rem 0.55rem;
  background: rgba(20, 184, 166, 0.14);
  color: var(--color-brand-strong);
  white-space: nowrap;
}

.catalog-item__status--off {
  background: rgba(148, 163, 184, 0.22);
  color: var(--color-text-secondary);
}

.catalog-item__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  font-size: 0.82rem;
  color: var(--color-text-secondary);
}

.catalog-item__price {
  font-weight: 600;
  color: var(--color-brand-strong);
}

.catalog-item__actions {
  display: flex;
  gap: 0.4rem;
}

.catalog-item__btn {
  border: 1px solid var(--color-border-soft);
  border-radius: 999px;
  background: #fff;
  color: var(--color-text-secondary);
  font-size: 0.78rem;
  padding: 0.28rem 0.75rem;
  cursor: pointer;
}

.catalog-item__btn:hover {
  border-color: var(--color-brand-strong);
  color: var(--color-brand-strong);
}

.offer-list {
  list-style: none;
  margin: 0.2rem 0 0;
  padding: 0.4rem 0 0;
  border-top: 1px dashed var(--color-border-soft);
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.offer-list__row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.8rem;
}

.offer-list__sku {
  flex: 1 1 auto;
  color: var(--color-text-primary);
}

.offer-list__status {
  font-size: 0.72rem;
  color: var(--color-brand-strong);
}

.offer-list__status--off {
  color: var(--color-text-muted);
}

.offer-list__btn {
  border: 1px solid var(--color-border-soft);
  border-radius: 999px;
  background: #fff;
  color: var(--color-text-secondary);
  font-size: 0.74rem;
  padding: 0.2rem 0.6rem;
  cursor: pointer;
}

.offer-list__btn:hover {
  border-color: var(--color-brand-strong);
  color: var(--color-brand-strong);
}

@media (min-width: 820px) {
  .catalog-admin__forms {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .form__row {
    grid-template-columns: 1fr;
  }

  .variant-attributes__row {
    grid-template-columns: 1fr;
  }

  .variant-attributes__remove {
    justify-self: start;
  }
}
</style>
