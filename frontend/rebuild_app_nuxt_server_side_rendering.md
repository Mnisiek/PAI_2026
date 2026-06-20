# Plan: Migracja Vue/Vite do Nuxt 3 (SSR)

Migracja obecnego projektu korzystającego z Vue 3, Vite, stosu Pinia i manualnie konfigurowanego Vue Router na Nuxt 3 w celu wprowadzenia pełnego wspomagania SSR (Server-Side Rendering). Adaptacja wiąże się ze wdrożeniem struktury katalogów wymuszanej przez Nuxt oraz wyrugowaniem kodu powodującego usterki przy generowaniu go po stronie serwera Node.js (m.in. globalnych referencji `window`).

## Kroki wdrożeniowe (Steps)

### Faza 1: Inicjalizacja i konfiguracja bazowa (*niezależna*)
1. **Zależności:** Zainstalować wpisy w `package.json`: `nuxt`, `@pinia/nuxt`. Dodatkowo, wyrzucić zbędny już `vue-router`, ponieważ Nuxt zarządza tym z automatu. Zastąpić skrypty dev/build nowymi z użyciem `nuxt dev` i `nuxt build`.
2. **Punkt startowy:** Usunąć `index.html`. Utworzyć centralny plik `app.vue` lub przystosować bieżący `App.vue`, tak by wywoływał wewnątrz tag: `<NuxtLayout><NuxtPage /></NuxtLayout>`.
3. **Plik nuxt.config.ts:** Stworzyć nową, nadrzędną konfigurację.
    - Dodać proxy dla wywołań `/graphql` pod kluczem `routeRules` (zastępuje to obecne ustawienia w `vite.config.ts`), aby zapytania z modułów (np. `activityClient`) trafiały pod `http://localhost:8080/graphql`.
    - Skonfigurować moduł dla `@nuxtjs/tailwindcss` (aktualizując konfigurację CSS).
    - Zarejestrować w sekcji `modules` wtyczkę `@pinia/nuxt`.
4. **Porządki w koncie:** Pousuwać pliki typowo klienckie zarządzające aplikacją (`src/main.ts`, `vite.config.ts`).

### Faza 2: Przeniesienie Routing -> Pages (*wymaga Fazy 1*)
1. **Wdrożenie File-Based Routing:** Usunąć zawartość i sam plik `src/router/index.ts`.
2. **Zmiana View na Page:** Folder `src/views` przenieść/zmienić w folder `pages` (lub `src/pages`), nadając plikom odpowiednie nazewnictwo:
    - `OffersView.vue` → `pages/index.vue`
    - `ProductDetailView.vue` → `pages/product/[slug].vue`
    - `LoginView.vue` → `pages/login.vue`
    - `AdminDashboardView.vue` → `pages/admin/index.vue`
    - `AdminCatalogView.vue` → `pages/admin/catalog.vue`
    - `AdminCategoriesView.vue` → `pages/admin/categories.vue`
3. Zamienić wszystkie dyrektywy `<router-view>` na `<NuxtPage>` oraz tagi w nawigacji: `<router-link>` na `<NuxtLink>`.

### Faza 3: Przystosowanie stanu i pobierania danych (Resolver SSR)
1. **Layouty:** Przenieść `src/layouts/MainLayout.vue` do folderu dedykowanego layoutom pod nazwą `layouts/default.vue`. Następnie zaktualizować komponenty stron, by osadzały się we wbudowanym znaczniku `<NuxtLayout>`.
2. **SSR Mismatch - API:** Oplatać zapytania realizowane w `onMounted` poprzez wbudowane composables połączone z Nuxt; przykładowo wywoływać metody usług z pakowaniem ich w `useAsyncData('data-key', () => catalogService.getProducts())`. To zagwarantuje, że dane zostaną uwzględnione w docelowym pliku generowanym przez SSR.

### Faza 4: Naprawa błędów specyficznych dla SSR (Brak interfejsu Window)
1. **Activity Service (`src/services/activity.service.ts`):** Metody `localStorage.getItem` zatrzymają renderowanie Node'a rzucając błąd braku obiektu `window`. Zamiast używać globalnego `window.localStorage`, zastosować SSR-bezpieczny helper np. `useCookie('pai-activity-session')`. Pozwoli to również powiązać tracking sesji przed ostatecznym wyrenderowaniem podglądu html u klienta.
2. **Catalog Service (`src/services/catalog.service.ts`):** Zmienić użycie `window.setTimeout` na ustandaryzowane dla interfejsu przeglądarki i platformy serwerowej środowisk `setTimeout`.
3. **Zmienne środowiskowe (`src/services/activityClient.ts`):** Podmienić mapowanie `import.meta.env.VITE_ACTIVITY_API` na wywołanie runtime variables obsługiwane bezpiecznie z `useRuntimeConfig()`.

## Zmodyfikowane i zaangażowane pliki
- Pliki wejściowe pod nóż: `package.json`, `index.html`, `vite.config.ts`, `src/main.ts`, `src/App.vue`.
- Usunięcie sztywnego routingu: `src/router/index.ts` podpiętego uprzednio do views.
- Usługi do oczyszczenia z side-effectów domeny klienta: `src/services/activity.service.ts` oraz `src/services/catalog.service.ts`.
- Przebudowa struktury od góry: Przemianowanie/migracja stref ze `views/` na `pages/` i `layouts/` według nowej hierarchii.

## Weryfikacja działania implementacji (Verification)
1. **Uruchomienie Frameworka:** Skuteczne odpalenie aplikacji z czystym Buildem i dev-serwerem postawionym komendą z CLI Nuxt (`npm run dev`).
2. **Test pre-renderowania (SSR):** Dezaktywować obsługę języka JavaScript w ustawieniach przeglądarki (zablokowany client-side hydratation). Przeładować dowolną poprawną stronę z listą produktów - dane powinny wyświetlić się wyciągnięte do postaci czystego HTML; błędy wykażą ewentualne użycia "window/document" pominięte podczas refaktoringu.
3. **Poprawność Routów & Linkowania:** Sprawdzenie nawigacji pomiedzy adresami `/`, `/product/xxx`, `/admin`, z udziałem działających bez odświeżania domeny `<NuxtLink>`.
4. **Zarządzanie Ciasteczkami Activity:** Monitorować interfejs DevTools -> Application udowadniając poprawną autokreację plików Cookie realizowaną w uniwersalny dla SSR serwisu sposób po podmianie z dawnego Local Storage.