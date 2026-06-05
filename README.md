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
To run local instances of **PostgreSQL** and **ClickHouse**, navigate to the main project directory and execute the command:

```
bash
docker-compose up -d
```

The infrastructure will spin up in the background. Make sure both containers are running properly using the Docker Desktop application (or via docker ps).

### 2. Running the Backend (Java)
Navigate to the `backend` directory and run the application using the Maven wrapper:

```bash
cd backend
./mvnw spring-boot:run
```

The server will start on `http://localhost:8080`.
You can access the GraphiQL interface at `http://localhost:8080/graphiql`.

### 3. Running the Frontend (Vue.js)

TO DO
