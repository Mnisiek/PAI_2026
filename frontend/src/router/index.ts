import { createRouter, createWebHistory } from 'vue-router'
import OffersView from '../views/OffersView.vue'
import LoginView from '../views/LoginView.vue'
import ProductDetailView from '../views/ProductDetailView.vue'
import AdminDashboardView from '../views/AdminDashboardView.vue'
import AdminCatalogView from '../views/AdminCatalogView.vue'
import AdminCategoriesView from '../views/AdminCategoriesView.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'offers',
      component: OffersView,
    },
    {
      path: '/product/:slug',
      name: 'product',
      component: ProductDetailView,
    },
    {
      path: '/admin',
      name: 'admin',
      component: AdminDashboardView,
    },
    {
      path: '/admin/catalog',
      name: 'admin-catalog',
      component: AdminCatalogView,
    },
    {
      path: '/admin/categories',
      name: 'admin-categories',
      component: AdminCategoriesView,
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
  ],
})
