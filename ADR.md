# Architecture Decision Records (ADR)

Zbiór decyzji architektonicznych.

## ADR-000: Architektura backendu

| Pole | Treść |
|---|---|
| **Decyzja** | Monolit modularny jako architektura backendu. |
| **Kontekst** | Projekt realizuje jeden spójny produkt e-commerce: katalog, oferty, autentykację, śledzenie aktywności i analitykę. Zespół jest mały, a priorytetem jest szybkie dostarczenie działającego systemu przy zachowaniu czytelnych granic domenowych. Backend działa jako jedna aplikacja Spring Boot, a domeny są wydzielone w osobnych pakietach i współdzielą jeden proces uruchomieniowy oraz wspólny kontrakt API. |
| **Alternatywy** | **Klasyczny monolit**: prostszy na start, ale z czasem prowadzi do większego chaosu strukturalnego i trudniejszego utrzymania granic domenowych. **Mikroserwisy**: dobre przy dużej skali i wielu niezależnych zespołach, ale w naszym przypadku dodałyby złożoność operacyjną, sieciową i wdrożeniową bez realnej korzyści biznesowej. |
| **Uzasadnienie** | Monolit modularny daje najlepszy kompromis między prostotą wdrożenia a utrzymaniem porządku architektonicznego. Mamy jeden deployable backend, co upraszcza development, testy, debugowanie i deployment, ale jednocześnie kod jest podzielony na logiczne moduły domenowe, np. offers, activity, user oraz warstwę infrastructure. To ogranicza sprzężenie, ułatwia pracę nad funkcjami w obrębie jednej domeny i przygotowuje projekt na ewentualną ekstrakcję usług w przyszłości, jeśli skala tego wymaga. |
| **Trade-offy** | Nadal pozostaje jeden wspólny proces i jeden cykl wdrożeniowy, więc awaria lub regresja w jednej części backendu może wpływać na cały system. Nie uzyskujemy też pełnej niezależności skalowania poszczególnych domen tak jak w mikroserwisach. Wymaga to dyscypliny, żeby granice modułów nie rozmywały się z czasem. |

---

## ADR-001: Język/platforma backendu

| Pole          | Treść |
|---------------|-------|
| **Decyzja**   | Java jako język i platforma backendu. |
| **Kontekst**  | Musimy wybrać język i runtime dla usług backendowych. Zespół ma mieszane doświadczenie, projekt jest długoterminowy, a przyszli kontrybutorzy będą rekrutowani z lokalnego rynku. |
| **Alternatywy** | JS/TS (Node.js — szybki dev, ale single-thread i mniejsze doświadczenie zespołu), Go (wydajny i prosty, ale brak doświadczenia i biblioteki, których potrzebujemy), Rust (świetna wydajność i bezpieczeństwo pamięci, ale wysoki próg wejścia). |
| **Uzasadnienie** | Java daje nam największą pulę programistów na rynku, statyczne typowanie redukuje klasę błędów już na etapie kompilacji, JIT zapewnia dobry performance dla naszego profilu obciążenia, a dojrzały ekosystem (Spring, Hibernate, biblioteki testowe) skraca time-to-market. |
| **Trade-offy** | Większy footprint pamięciowy i dłuższy startup vs. Go/Rust. Verbosity języka (mimo Java 17+) i ciężki ekosystem konfiguracyjny (Spring) wymaga onboardingu. |

---

## ADR-002: Styl API

| Pole          | Treść |
|---------------|-------|
| **Decyzja**   | GraphQL jako warstwa API między frontendem a backendem. |
| **Kontekst**  | Frontend potrzebuje różnych zestawów pól na różnych widokach (lista vs szczegóły produktu, koszyk, profil). REST wymuszałby albo over-fetching, albo dedykowane endpointy per widok. Zależy nam też na samodokumentującym się kontrakcie między front a back. |
| **Alternatywy** | REST (prostsze cachowanie HTTP, większy ekosystem narzędzi, ale brak natywnej dokumentacji i ryzyko N+1), gRPC (świetna wydajność i typowanie, ale słabe wsparcie dla przeglądarek i zyski z keep-alive mogą być nieosiągalne w naszej topologii). |
| **Uzasadnienie** | GraphQL sam się dokumentuje przez schemat, jest silnie typowany — co dobrze współgra z Javą i pozwala na codegen po obu stronach. Eliminuje N+1 po stronie klienta i daje elastyczne pobieranie danych oraz mutacje. |
| **Trade-offy** | Tracimy natywne HTTP caching (POST /graphql). Musimy zaimplementować DataLoadery, żeby uniknąć N+1 po stronie serwera. Krzywa uczenia dla członków zespołu nieobeznanych z GraphQL. |

---

## ADR-003: Baza danych

| Pole          | Treść |
|---------------|-------|
| **Decyzja**   | PostgreSQL jako główny system trwałego przechowywania danych. |
| **Kontekst**  | Domena (e-commerce z zamówieniami, użytkownikami, produktami) jest mocno relacyjna i wymaga gwarancji ACID. Schemat danych jest stabilny i znany z góry. |
| **Alternatywy** | MySQL (popularny, dobrze znany, ale historycznie mniej wydajny i nie wspiera pełnego standardu SQL), MongoDB (elastyczny schemat dokumentowy, ale nierelacyjny i mniej wydajny dla naszych zapytań analitycznych — a my mamy schemat statyczny). |
| **Uzasadnienie** | PostgreSQL jest wydajny, w pełni transakcyjny (ACID), ma bardzo dobre indeksowanie (B-tree, GIN, BRIN, partial) i naturalnie wspiera relacyjność danych. Wspiera szeroki standard SQL i daje dużą przestrzeń do rozwoju (CTE, window functions, JSONB jako fallback dla pól nieustrukturyzowanych). |
| **Trade-offy** | Skomplikowane operacyjnie w skali (replikacja, vacuum, tuning autovacuum), wymaga większej dyscypliny w migracjach niż bazy schemaless. |

---

## ADR-004: Framework frontendowy

| Pole          | Treść |
|---------------|-------|
| **Decyzja**   | Vue.js jako framework frontendowy. |
| **Kontekst**  | Budujemy prosty interfejs e-commerce. Dwie osoby z zespołu nie mają wcześniejszego doświadczenia we frontendzie i muszą być produktywne w krótkim czasie. |
| **Alternatywy** | React (większy ekosystem i pula programistów, ale stromsza krzywa nauki), Angular (kompletny framework, ale ciężki i opinionated — overkill dla prostego e-commerce). |
| **Uzasadnienie** | Vue.js ma najniższą krzywą wejścia z rozważanych opcji, jest wystarczający funkcjonalnie do prostego e-commerce, a osoby w zespole, które mają jakiekolwiek doświadczenie frontendowe, miały je właśnie z Vue. |
| **Trade-offy** | Mniejsza pula programistów na rynku niż React. Mniejszy ekosystem gotowych komponentów i bibliotek third-party. |

---

## ADR-005: Autentykacja

| Pole          | Treść |
|---------------|-------|
| **Decyzja**   | JWT jako mechanizm autentykacji użytkowników. |
| **Kontekst**  | API musi być dostępne dla różnych klientów (web, w przyszłości potencjalnie aplikacja mobilna) oraz dla integracji backendowych z systemami trzecimi. |
| **Alternatywy** | OAuth (standard dla integracji z dostawcami tożsamości, ale utrudnia czyste backendowe integracje serwer-do-serwera w naszym scenariuszu), sesje (proste, ale wiążą nas z kontekstem domeny i utrudniają backendowe integracje oraz klientów mobilnych). |
| **Uzasadnienie** | JWT daje niezależność od domeny, łatwo integruje się z API (Bearer token w nagłówku), nie wymaga sticky session po stronie loadbalancera i otwiera drogę do aplikacji mobilnej bez przepisywania warstwy auth. |
| **Trade-offy** | Brak natywnego mechanizmu unieważniania tokenu — trzeba zbudować blacklistę lub stosować krótkie TTL + refresh tokeny. Większy rozmiar tokenu w każdym requeście. Sekrety/klucze podpisujące wymagają rotacji i bezpiecznego przechowywania. |

---

## ADR-006: OLAP / Analityka

| Pole          | Treść |
|---------------|-------|
| **Decyzja**   | ClickHouse jako silnik analityczny (OLAP). |
| **Kontekst**  | Potrzebujemy oddzielić obciążenie analityczne (raporty, agregacje, dashboardy) od OLTP (PostgreSQL). Większość zapytań analitycznych ma wymiar czasowy. |
| **Alternatywy** | Druid (bardzo wydajny przy strumieniach, ale skomplikowany operacyjnie i drogi w utrzymaniu — wiele komponentów do zarządzania), DuckDB (świetny do analityki embedded, ale niewystarczająco wydajny dla naszego wolumenu i nieprzeznaczony do pracy serwerowej w naszej skali). |
| **Uzasadnienie** | ClickHouse rozprowadza się jako pojedyncza binarka — minimalna złożoność operacyjna na start. Świetnie radzi sobie z indeksowaniem po czasie (MergeTree) i agregacjami kolumnowymi, czyli dokładnie naszym profilem zapytań. |
| **Trade-offy** | Słabsze wsparcie dla UPDATE/DELETE (eventual, kosztowne) — projektujemy pod append-only. Inny dialekt SQL niż PostgreSQL — zespół musi się go nauczyć. |

---

## ADR-007: Zarządzanie migracjami bazy danych

| Pole          | Treść |
|---------------|-------|
| **Decyzja**   | Liquibase jako narzędzie do wersjonowania i wykonywania migracji schematu DB. |
| **Kontekst**  | Schemat bazy ewoluuje, deployujemy na wiele środowisk (dev/stage/prod) i chcemy mieć powtarzalność oraz integrację z CI/CD. Wszystko ma być as-code, m.in. po to, by agenci AI/LLM mogli efektywnie pracować z migracjami. |
| **Alternatywy** | Prisma (świetny DX, ale brak natywnego wsparcia dla Javy — wymuszałby drugi runtime tylko pod migracje), Flyway (porównywalny do Liquibase, ale Liquibase oferuje większą elastyczność opisów zmian — XML/YAML/SQL — i lepsze rollbacki). Brak narzędzia (ręczne SQL) odpada — uniemożliwia powtarzalne wdrożenia, automatyzację w CI/CD i utrudnia onboarding. |
| **Uzasadnienie** | Liquibase ma natywne wsparcie dla Javy, integruje się ze Springiem i Gradle, pozwala opisywać migracje deklaratywnie, generuje rollbacki i dobrze wpina się w pipeline CI/CD. |
| **Trade-offy** | Dodatkowe narzędzie i format opisu zmian, którego trzeba się nauczyć. Liquibase XML/YAML jest bardziej rozwlekły niż czysty SQL Flywaya. |

---

## ADR-008: Cache / Warstwa cache'ująca

| Pole          | Treść |
|---------------|-------|
| **Decyzja**   | Valkey jako rozproszona warstwa cache (in-memory key-value store). |
| **Kontekst**  | Zapytania o popularne oferty oraz retargeting są kosztowne i często powtarzalne — chcemy odciążyć ClickHouse i skrócić czasy odpowiedzi API. Potrzebujemy szybkiego store'a in-memory ze wsparciem dla struktur danych — w projekcie powszechnie korzystamy z hashtable'i (mapy hash) do przechowywania złożonych obiektów cache. Istotne są też względy licencyjne i kosztowe. |
| **Alternatywy** | **Redis**: dojrzały i bogaty funkcjonalnie, ale po zmianie licencji (SSPL/RSALv2) jest własnościowy, a wersje komercyjne/managed są kosztowne. **Memcached**: prosty i szybki, ale brak wsparcia dla hashtable'i i bogatszych struktur danych, których powszechnie używamy w tym projekcie — wymuszałby serializację i obejścia po stronie aplikacji. |
| **Uzasadnienie** | Valkey jest open source (fork Redisa pod Linux Foundation), więc unikamy ryzyka licencyjnego i kosztów Redisa, zachowując zgodność protokołu i API (RESP) — istniejące klienty i wiedza zespołu są w pełni przenośne. Wspiera natywnie hashtable'e oraz pozostałe struktury danych, których potrzebujemy, dzięki czemu nie musimy zmieniać modelu cache w aplikacji. |
| **Trade-offy** | Mniej funkcjonalności niż Redis — przykładowo vector search w Valkey jest dostępny tylko jako moduł społecznościowy (valkey-search), mniej dojrzały i wolniejszy niż natywne Vector Sets w Redis (parytet zapowiadany dopiero w Valkey 9.0). Młodszy projekt/ekosystem (krótsza historia, mniejsza pula gotowych integracji i materiałów) oraz mniejsza oferta managed na rynku. Jak każdy cache wprowadza ryzyko niespójności danych i wymaga przemyślanej strategii inwalidacji oraz TTL. |

---

