# Ecommerce Frontend (Nuxt 3 SSR)

Frontend sklepu ecommerce oparty o Nuxt 3 z Server-Side Rendering. Aplikacja zachowuje dotychczasową funkcjonalność (oferty, filtrowanie, PDP, koszyk, logowanie i panel admina), a kluczowe strony są renderowane po stronie serwera.

## Tech Stack

- Nuxt 3 (SSR)
- Vue 3 + TypeScript
- Pinia (przez `@pinia/nuxt`)
- GraphQL + Apollo Client
- Mock GraphQL schema (`@graphql-tools/schema`)
- Tailwind CSS
- VueUse

## Zakres funkcjonalny

- Lista ofert z wyszukiwaniem i filtrowaniem kategorii
- Karta produktu (`/product/[slug]`)
- Koszyk z pamięcią stanu po stronie klienta
- Logowanie mock użytkownika
- Panel administracyjny:
	- Statystyki aktywności
	- Zarządzanie produktami/ofertami
	- Zarządzanie kategoriami

## Struktura projektu

~~~text
ecommerce-frontend/
	nuxt.config.ts
	src/
		app.vue
		pages/             # Routing oparty o system plików Nuxt
			index.vue
			login.vue
			product/[slug].vue
			admin/
				index.vue
				catalog.vue
				categories.vue
		views/             # Dotychczasowe widoki podpięte pod pages
		components/
		composables/
		graphql/
		layouts/
		mocks/
		plugins/
			persisted-state.client.ts
		services/
		stores/
		types/
~~~

## Wymagania

- Node.js 20+
- npm 10+

## Uruchomienie

1. Zainstaluj zależności:

~~~bash
npm install
~~~

2. Uruchom środowisko developerskie:

~~~bash
npm run dev
~~~

3. Otwórz adres wyświetlony w terminalu (domyślnie `http://localhost:3000`).

## Skrypty

~~~bash
npm run dev      # Nuxt dev server (SSR)
npm run build    # Build produkcyjny Nuxt
npm run preview  # Podgląd buildu produkcyjnego
~~~

## Konfiguracja środowiska

Publiczny endpoint dla activity GraphQL można nadpisać zmienną:

~~~bash
NUXT_PUBLIC_ACTIVITY_API=/graphql
~~~

Domyślnie Nuxt proxuje `/graphql` na `http://localhost:8080/graphql` (zobacz `nuxt.config.ts`).

## SSR i stan klienta

- Dane dla głównych widoków są ładowane przez `useAsyncData`, co pozwala renderować strony po stronie serwera.
- Stan `auth` i `cart` jest rehydratowany z `localStorage` tylko po stronie klienta (`src/plugins/persisted-state.client.ts`), co zapobiega błędom SSR i zachowuje dotychczasowe działanie.

## Mock danych

Katalog mockowy znajduje się w:

- `src/mocks/catalogData.ts`

Zmiany danych mock nie wymagają modyfikacji warstwy UI.
