import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue')
    },
    {
      path: '/rooms',
      name: 'rooms',
      component: () => import('../views/RoomsView.vue')
    },
    {
      path: '/user',
      name: 'user-dashboard',
      component: () => import('../views/user/UserDashboardView.vue')
    },
    {
      path: '/user/complaints',
      name: 'user-complaint',
      component: () => import('../views/user/UserComplaintView.vue')
    },
    {
      path: '/user/payments',
      name: 'user-payments',
      component: () => import('../views/user/UserPaymentsView.vue')
    },
    {
      path: '/admin/tenants',
      name: 'admin-tenants',
      component: () => import('../views/admin/AdminTenantsView.vue')
    },
    {
      path: '/admin/tenants/:id',
      name: 'admin-tenant-detail',
      component: () => import('../views/admin/AdminTenantDetailView.vue')
    },
    {
      path: '/admin/complaints',
      name: 'admin-complaints',
      component: () => import('../views/admin/AdminComplaintsView.vue')
    },
    {
      path: '/admin/complaints/:id',
      name: 'admin-complaint-detail',
      component: () => import('../views/admin/AdminComplaintDetailView.vue')
    }
  ],
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else if (to.hash) {
      return { el: to.hash, behavior: 'smooth' }
    } else {
      return { top: 0 }
    }
  }
})

export default router
