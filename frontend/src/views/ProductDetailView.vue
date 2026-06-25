<script setup lang="ts">
import { computed, ref } from 'vue'

import MainLayout from '../layouts/MainLayout.vue'
import BaseCard from '../components/base/BaseCard.vue'
import SkeletonLoader from '../components/base/SkeletonLoader.vue'
import { catalogService } from '../services/catalog.service'
import { activityService } from '../services/activity.service'
import { useCartStore } from '../stores/cart.store'
import { useCurrency } from '../composables/useCurrency'
import type { AttributeValue, Offer, Product } from '../types/catalog'

const cartStore = useCartStore()
const { formatPrice } = useCurrency()
const route = useRoute()

const product = ref<Product | null>(null)
const selectedOffer = ref<Offer | null>(null)
const selectedAttributeValues = ref<Record<string, string>>({})
const overrideImage = ref<string | null>(null)
const isLoading = ref(true)
const error = ref<string | null>(null)

const attributeText = (attribute: AttributeValue): string => {
  if (attribute.textValue != null) {
    return attribute.textValue
  }
  if (attribute.numValue != null) {
    return `${attribute.numValue}${attribute.unit ?? ''}`
  }
  if (attribute.boolValue != null) {
    return attribute.boolValue ? 'Tak' : 'Nie'
  }
  return ''
}

const offerLabel = (offer: Offer): string => {
  const parts = [...(offer.attributes ?? [])]
    .sort((a, b) => a.name.localeCompare(b.name, 'pl-PL'))
    .map(attributeText)
    .filter(Boolean)
  return parts.length ? parts.join(' / ') : offer.sku
}

type VariantAxis = {
  code: string
  name: string
  values: string[]
}

const variantAxes = computed<VariantAxis[]>(() => {
  const offers = product.value?.offers ?? []
  const axesByCode = new Map<string, { name: string; values: Set<string> }>()

  for (const offer of offers) {
    for (const attribute of offer.attributes ?? []) {
      const value = attributeText(attribute)
      if (!value) {
        continue
      }

      const axis = axesByCode.get(attribute.code)
      if (axis) {
        axis.values.add(value)
      } else {
        axesByCode.set(attribute.code, {
          name: attribute.name,
          values: new Set([value]),
        })
      }
    }
  }

  return [...axesByCode.entries()]
    .map(([code, axis]) => ({
      code,
      name: axis.name,
      values: [...axis.values].sort((a, b) => a.localeCompare(b, 'pl-PL')),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'pl-PL'))
})

const hasVariantAxes = computed(() => variantAxes.value.length > 0)

const applyOfferAttributesSelection = (offer: Offer | null): void => {
  // A newly selected variant shows its own image (until the user clicks a thumb).
  overrideImage.value = null

  if (!offer) {
    selectedAttributeValues.value = {}
    return
  }

  const nextSelection: Record<string, string> = {}
  for (const attribute of offer.attributes ?? []) {
    const value = attributeText(attribute)
    if (value) {
      nextSelection[attribute.code] = value
    }
  }

  selectedAttributeValues.value = nextSelection
}

const selectByAttributes = (axisCode: string, value: string): void => {
  const currentSelection = {
    ...selectedAttributeValues.value,
    [axisCode]: value,
  }

  selectedAttributeValues.value = currentSelection

  const offers = product.value?.offers ?? []
  const strictMatch = offers.find((offer) => {
    return variantAxes.value.every((axis) => {
      const wanted = currentSelection[axis.code]
      if (!wanted) {
        return true
      }

      const actual = offer.attributes?.find((attr) => attr.code === axis.code)
      return actual ? attributeText(actual) === wanted : false
    })
  })

  if (strictMatch) {
    selectedOffer.value = strictMatch
    applyOfferAttributesSelection(strictMatch)
    return
  }

  const fallback = offers.find((offer) => offer.stock > 0) ?? offers[0] ?? null
  selectedOffer.value = fallback
  applyOfferAttributesSelection(fallback)
}

const hasVariants = computed(() => (product.value?.offers?.length ?? 0) > 1)
const displayPrice = computed(
  () => selectedOffer.value?.price.amount ?? product.value?.priceFrom.amount ?? 0,
)
const canAddToCart = computed(() => !!selectedOffer.value && selectedOffer.value.stock > 0)

// Image gallery: the selected variant's images plus the product's main image.
const offerImageUrls = computed(() => selectedOffer.value?.images?.map((image) => image.url) ?? [])
const galleryImages = computed(() => {
  const urls: string[] = []
  for (const url of offerImageUrls.value) {
    if (!urls.includes(url)) urls.push(url)
  }
  if (product.value?.mainImageUrl && !urls.includes(product.value.mainImageUrl)) {
    urls.push(product.value.mainImageUrl)
  }
  return urls
})
const heroImage = computed(
  () => overrideImage.value ?? offerImageUrls.value[0] ?? product.value?.mainImageUrl ?? '',
)

const loadProduct = async (): Promise<void> => {
  isLoading.value = true
  error.value = null

  try {
    const slug = String(route.params.slug)
    const found = await catalogService.getProductBySlug(slug)

    if (!found) {
      error.value = 'Nie znaleziono produktu.'
      return
    }

    product.value = found
    selectedOffer.value = found.offers?.[0] ?? null
    applyOfferAttributesSelection(selectedOffer.value)
    // Product detail view — the key retargeting signal.
    activityService.trackProductDetail(found)
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'Nie udało się pobrać produktu.'
  } finally {
    isLoading.value = false
  }
}

const selectOffer = (offer: Offer): void => {
  selectedOffer.value = offer
  applyOfferAttributesSelection(offer)
}

const addToCart = (): void => {
  if (!product.value || !selectedOffer.value) {
    return
  }

  cartStore.addToCart(product.value, selectedOffer.value)
  cartStore.openCart()
}

useAsyncData('product-detail', loadProduct, {
  watch: [() => route.params.slug],
})
</script>

<template>
  <MainLayout>
    <div class="pdp">
      <NuxtLink class="pdp__back" to="/offers">← Wróć do ofert</NuxtLink>

      <SkeletonLoader v-if="isLoading" />

      <p v-else-if="error" class="pdp__error" role="alert">{{ error }}</p>

      <BaseCard v-else-if="product" class="pdp__card">
        <div class="pdp__grid">
          <div class="pdp__media">
            <img :src="heroImage" :alt="product.name" class="pdp__image" loading="lazy" />
            <div v-if="galleryImages.length > 1" class="pdp__thumbs">
              <button
                v-for="url in galleryImages"
                :key="url"
                type="button"
                class="pdp__thumb"
                :class="{ 'pdp__thumb--active': url === heroImage }"
                @click="overrideImage = url"
              >
                <img :src="url" alt="" loading="lazy" />
              </button>
            </div>
          </div>

          <div class="pdp__info">
            <p v-if="product.brand" class="pdp__brand">{{ product.brand.name }}</p>
            <h1 class="pdp__title">{{ product.name }}</h1>
            <p class="pdp__category">{{ product.category.name }}</p>
            <p class="pdp__price">{{ formatPrice(displayPrice) }}</p>

            <div v-if="product.offers.length" class="pdp__variants">
              <p class="pdp__section-label">{{ hasVariants ? 'Wybierz wariant' : 'Wariant' }}</p>
              <div
                v-if="hasVariantAxes"
                class="pdp__axis-list"
                role="group"
                aria-label="Wybór cech wariantu"
              >
                <div v-for="axis in variantAxes" :key="axis.code" class="pdp__axis-row">
                  <p class="pdp__axis-label">{{ axis.name }}</p>
                  <div class="pdp__axis-values">
                    <button
                      v-for="value in axis.values"
                      :key="`${axis.code}:${value}`"
                      type="button"
                      class="pdp__axis-value"
                      :class="{
                        'pdp__axis-value--active': selectedAttributeValues[axis.code] === value,
                      }"
                      @click="selectByAttributes(axis.code, value)"
                    >
                      {{ value }}
                    </button>
                  </div>
                </div>
              </div>

              <div v-else class="pdp__variant-list" role="radiogroup" aria-label="Warianty">
                <button
                  v-for="offer in product.offers"
                  :key="offer.id"
                  type="button"
                  role="radio"
                  :aria-checked="selectedOffer?.id === offer.id"
                  class="pdp__variant"
                  :class="{
                    'pdp__variant--active': selectedOffer?.id === offer.id,
                    'pdp__variant--soldout': offer.stock === 0,
                  }"
                  :disabled="offer.stock === 0"
                  @click="selectOffer(offer)"
                >
                  <img
                    v-if="offer.images?.length"
                    :src="offer.images[0].url"
                    :alt="offer.images[0].alt ?? ''"
                    class="pdp__variant-thumb"
                    loading="lazy"
                  />
                  <span class="pdp__variant-text">
                    <span class="pdp__variant-name">{{ offerLabel(offer) }}</span>
                    <span class="pdp__variant-meta">
                      {{ formatPrice(offer.price.amount) }} ·
                      {{ offer.stock > 0 ? `${offer.stock} szt.` : 'brak' }}
                    </span>
                  </span>
                </button>
              </div>

              <p v-if="selectedOffer" class="pdp__selected-sku">SKU: {{ selectedOffer.sku }}</p>
            </div>

            <button
              class="pdp__action"
              type="button"
              :disabled="!canAddToCart"
              @click="addToCart"
            >
              {{ canAddToCart ? 'Dodaj do koszyka' : 'Brak w magazynie' }}
            </button>

            <dl v-if="product.specs?.length" class="pdp__specs">
              <p class="pdp__section-label">Specyfikacja</p>
              <div v-for="item in product.specs" :key="item.key" class="pdp__spec">
                <dt>{{ item.key }}</dt>
                <dd>{{ item.value }}</dd>
              </div>
            </dl>
          </div>
        </div>

        <section class="pdp__description-block">
          <p class="pdp__section-label">Opis</p>
          <p class="pdp__description">{{ product.description }}</p>
        </section>
      </BaseCard>
    </div>
  </MainLayout>
</template>

<style scoped>
.pdp {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.pdp__back {
  align-self: flex-start;
  color: var(--color-text-secondary);
  text-decoration: none;
  font-size: 0.9rem;
}

.pdp__back:hover {
  color: var(--color-brand-strong);
}

.pdp__error {
  border: 1px solid rgba(220, 38, 38, 0.25);
  border-radius: 14px;
  background: rgba(254, 242, 242, 0.88);
  color: #991b1b;
  padding: 0.9rem 1rem;
}

.pdp__card {
  overflow: hidden;
}

.pdp__grid {
  display: grid;
  gap: 1.2rem;
  padding: 1rem;
}

.pdp__media {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.pdp__image {
  width: 100%;
  height: 320px;
  object-fit: cover;
  border-radius: 16px;
}

.pdp__thumbs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.pdp__thumb {
  width: 56px;
  height: 56px;
  border: 1px solid var(--color-border-soft);
  border-radius: 10px;
  overflow: hidden;
  background: #fff;
  cursor: pointer;
  padding: 0;
}

.pdp__thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.pdp__thumb--active {
  border-color: var(--color-brand-strong);
  box-shadow: 0 0 0 2px rgba(20, 184, 166, 0.25);
}

.pdp__info {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.pdp__brand {
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.74rem;
  color: var(--color-text-muted);
}

.pdp__title {
  margin: 0;
  font-size: 1.6rem;
  line-height: 1.2;
  color: var(--color-text-primary);
}

.pdp__category {
  margin: 0;
  font-size: 0.86rem;
  color: var(--color-text-secondary);
}

.pdp__price {
  margin: 0.3rem 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-brand-strong);
}

.pdp__description-block {
  /* Full card width, below the image/info row. */
  padding: 1.6rem;
  border-top: 1px solid var(--color-border-soft);
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.pdp__description {
  margin: 0;
  color: var(--color-text-secondary);
  line-height: 1.6;
  white-space: pre-line; /* render the \n\n paragraph breaks in the prose */
}

.pdp__section-label {
  margin: 0 0 0.1rem;
  font-size: 0.78rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.pdp__variants {
  margin-top: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.pdp__variant-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.pdp__axis-list {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.pdp__axis-row {
  display: grid;
  grid-template-columns: minmax(90px, auto) 1fr;
  gap: 0.55rem;
  align-items: center;
}

.pdp__axis-label {
  margin: 0;
  font-size: 0.84rem;
  color: var(--color-text-secondary);
}

.pdp__axis-values {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.pdp__axis-value {
  border: 1px solid var(--color-border-soft);
  border-radius: 999px;
  background: #fff;
  color: var(--color-text-primary);
  font: inherit;
  font-size: 0.82rem;
  padding: 0.28rem 0.68rem;
  cursor: pointer;
}

.pdp__axis-value:hover {
  border-color: rgba(15, 118, 110, 0.42);
}

.pdp__axis-value--active {
  border-color: var(--color-brand-strong);
  background: rgba(20, 184, 166, 0.1);
  color: var(--color-brand-strong);
}

.pdp__selected-sku {
  margin: 0;
  font-size: 0.76rem;
  color: var(--color-text-muted);
}

.pdp__variant {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.5rem;
  border: 1px solid var(--color-border-soft);
  border-radius: 12px;
  background: #fff;
  padding: 0.5rem 0.8rem;
  cursor: pointer;
  text-align: left;
  transition: border-color 0.16s ease, background-color 0.16s ease;
}

.pdp__variant-thumb {
  width: 34px;
  height: 34px;
  object-fit: cover;
  border-radius: 8px;
  flex-shrink: 0;
}

.pdp__variant-text {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.pdp__variant:hover {
  border-color: rgba(15, 118, 110, 0.42);
}

.pdp__variant--active {
  border-color: var(--color-brand-strong);
  background: rgba(20, 184, 166, 0.1);
}

.pdp__variant--soldout {
  opacity: 0.5;
  cursor: not-allowed;
  text-decoration: line-through;
}

.pdp__variant-name {
  font-size: 0.92rem;
  color: var(--color-text-primary);
}

.pdp__variant-meta {
  font-size: 0.78rem;
  color: var(--color-text-secondary);
}

.pdp__action {
  margin-top: 0.7rem;
  align-self: flex-start;
  border: none;
  border-radius: 12px;
  background: var(--color-brand-strong);
  color: #fff;
  padding: 0.7rem 1.4rem;
  font-size: 0.92rem;
  cursor: pointer;
  transition: background-color 0.16s ease;
}

.pdp__action:hover:not(:disabled) {
  background: #0d6660;
}

.pdp__action:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.pdp__specs {
  margin: 0.8rem 0 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.pdp__spec {
  display: flex;
  justify-content: space-between;
  gap: 0.8rem;
  border-bottom: 1px solid var(--color-border-soft);
  padding-bottom: 0.35rem;
  font-size: 0.88rem;
}

.pdp__spec dt {
  color: var(--color-text-muted);
}

.pdp__spec dd {
  margin: 0;
  color: var(--color-text-primary);
  text-align: right;
}

@media (min-width: 800px) {
  .pdp__grid {
    grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
    align-items: start;
  }

  .pdp__image {
    height: 420px;
  }
}

@media (max-width: 620px) {
  .pdp__axis-row {
    grid-template-columns: 1fr;
    gap: 0.3rem;
  }
}
</style>
