# PAI_2026
Final project for the subject Projektownie Aplikacji Internetowych

Project realized as part of the Internet Application Design (Projektowanie Aplikacji Internetowych) course. The goal of the project is to create a comprehensive e-commerce platform based on conscious and justified architectural decisions.

## Architecture and Technology Stack

Each technology in this project was selected based on an analysis of the business context and the team's capabilities. A full record of decisions, along with a trade-off analysis, can be found in the **ADR.md** document.

* **Backend:** `Java (Spring Boot)` – chosen for its static typing (reducing compile-time errors), good performance (JIT), and mature ecosystem.
* **Frontend:** `Vue.js` – the framework with the lowest learning curve for our team, allowing for fast and productive delivery of the user interface.
* **API:** `GraphQL` – eliminates over-fetching and the N+1 problem on the client side, providing flexible data fetching for individual store views and serving as a strongly-typed contract between the frontend and backend.
* **Main Database (OLTP):** `PostgreSQL` – a relational engine guaranteeing transactional consistency (ACID), efficient indexing, and secure storage of order and user data.
* **Analytical Layer (OLAP):** `ClickHouse` – a dedicated, high-performance analytical engine. It separates heavy workloads related to data aggregation and reporting from the main OLTP database.
* **Database Migrations:** `Liquibase` – database schema versioning as code (as-code), ensuring full integration with Java and reproducibility in CI/CD pipelines.
* **Authentication:** `JWT` (JSON Web Tokens) – a stateless authentication mechanism supporting server-to-server integrations and paving the way for potential mobile clients without modifying the API.

---

## How to Run Locally

The following step-by-step guide will help you run the full development environment on your machine.

### Prerequisites
* Installed and running [Docker](https://www.docker.com/) and Docker Compose.
* `Java 17+` environment and a build tool (e.g., Maven/Gradle).
* Installed `Node.js` along with a package manager (npm/yarn) for the frontend.

### 1. Running the Infrastructure (Databases)
To run local instances of **PostgreSQL**, **ClickHouse** and **Valkey** for host-based
development, navigate to the main project directory and execute:

```bash
docker compose -f docker/infra/docker-compose.yml up -d
```

The infrastructure will spin up in the background. Make sure the containers are running
properly using the Docker Desktop application (or via `docker ps`). Then continue with the
backend and frontend steps below.

> **Run the whole app in containers instead?** The repo-root `docker-compose.yml` builds and
> runs everything — frontend, backend and the data stores — with the right startup ordering
> (`frontend → backend → {clickhouse, postgres, valkey}`). It reuses the infra defined above
> via `include`, so you can skip steps 2 and 3:
>
> ```bash
> docker compose up --build
> ```
>
> The storefront is then served at `http://localhost:3000` and the backend at `http://localhost:8080`.

### 2. Running the Backend (Java)
Navigate to the `backend` directory and run the application using the Maven wrapper:

```bash
cd backend
./mvnw spring-boot:run
```

The server will start on `http://localhost:8080`.
You can access the GraphiQL interface at `http://localhost:8080/graphiql`.

### 3. Running the Frontend (Vue.js)

#### Prerequisites

- Node.js 20 or newer
- npm 10 or newer

#### Installation

1. Open a terminal in the project directory.
2. Go to `./frontend` directory.
3. Install dependencies:

~~~bash
npm install
~~~

3. Start the development server:

~~~bash
npm run dev
~~~

4. Open the local URL shown in the terminal (typically http://localhost:5173).

#### Windows PowerShell Note

If execution policy blocks npm.ps1, use npm.cmd instead:

~~~bash
npm.cmd install
npm.cmd run dev
~~~

#### Available Scripts

~~~bash
npm run dev      # Start development server
npm run build    # Type check and create production build
npm run preview  # Preview production build locally
~~~
