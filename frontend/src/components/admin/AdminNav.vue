<script setup lang="ts"></script>

<template>
  <nav class="admin-nav" aria-label="Nawigacja panelu administracyjnego">
    <RouterLink class="admin-nav__tab" :to="{ name: 'admin' }">Statystyki</RouterLink>
    <RouterLink class="admin-nav__tab" :to="{ name: 'admin-catalog' }">Produkty i oferty</RouterLink>
    <RouterLink class="admin-nav__tab" :to="{ name: 'admin-categories' }">Kategorie</RouterLink>
  </nav>
</template>

<style scoped>
.admin-nav {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  padding: 0.3rem;
  border: 1px solid var(--color-border-soft);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.72);
}

.admin-nav__tab {
  text-decoration: none;
  font-size: 0.86rem;
  color: var(--color-text-secondary);
  padding: 0.42rem 0.95rem;
  border-radius: 999px;
  transition: background-color 0.16s ease, color 0.16s ease;
}

.admin-nav__tab:hover {
  color: var(--color-brand-strong);
}

.admin-nav__tab.router-link-exact-active {
  background: var(--color-brand-strong);
  color: #fff;
}
</style>
