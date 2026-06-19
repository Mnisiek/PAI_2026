import { createRouter, createWebHistory } from 'vue-router'
import OffersView from '../views/OffersView.vue'
import LoginView from '../views/LoginView.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'offers',
      component: OffersView,
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
  ],
})
