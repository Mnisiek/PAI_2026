# Ecommerce Frontend

A Vue 3 + TypeScript ecommerce frontend focused on a product offers page with search and category filtering.

## Tech Stack

- Vue 3 (Composition API, script setup)
- TypeScript
- Vite
- Pinia
- Vue Router
- GraphQL with Apollo Client
- GraphQL mock schema via GraphQL Tools
- Tailwind CSS
- VueUse

## Current Scope

- Product offers page
- Search bar
- Category and subcategory filter pills
- Product grid with cards
- Loading skeleton state
- Cart
- Login page
- Mock GraphQL data source (no real backend required)

## Project Structure

~~~text
ecommerce-frontend/
	src/
		components/
			base/         # Reusable UI building blocks
			catalog/      # Catalog-specific UI (search, categories, products)
			navigation/   # Top navigation components
		composables/    # Reusable Composition API helpers
		graphql/        # GraphQL queries
		layouts/        # App/page layouts
		mocks/          # Mock catalog data
		router/         # Route definitions
		services/       # Apollo client and API services
		stores/         # Pinia stores
		types/          # TypeScript domain models
		views/          # Route views
~~~

## Getting Started

### Prerequisites

- Node.js 20 or newer
- npm 10 or newer

### Installation

1. Open a terminal in the project directory.
2. Install dependencies:

~~~bash
npm install
~~~

3. Start the development server:

~~~bash
npm run dev
~~~

4. Open the local URL shown in the terminal (typically http://localhost:5173).

### Windows PowerShell Note

If execution policy blocks npm.ps1, use npm.cmd instead:

~~~bash
npm.cmd install
npm.cmd run dev
~~~

## Available Scripts

~~~bash
npm run dev      # Start development server
npm run build    # Type check and create production build
npm run preview  # Preview production build locally
~~~

## Mock Data

Catalog data is defined in:

- src/mocks/catalogData.ts

You can update products and categories there without changing UI components.

## Build Output

The production build is generated in the dist directory.
