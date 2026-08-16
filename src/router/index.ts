import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import { useAuth } from '../composables/useAuth'

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
      alias: '/user/dashboard',
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
      path: '/admin',
      redirect: '/admin/dashboard'
    },
    {
      path: '/admin/dashboard',
      name: 'admin-dashboard',
      component: () => import('../views/admin/AdminDashboardView.vue')
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
      path: '/admin/rooms',
      name: 'admin-rooms',
      component: () => import('../views/admin/AdminRoomsView.vue')
    },
    {
      path: '/admin/payments',
      name: 'admin-payments',
      component: () => import('../views/admin/AdminPaymentsView.vue')
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
    },
    {
      path: '/admin/room-transfers',
      name: 'admin-room-transfers',
      component: () => import('../views/admin/AdminRoomTransfersView.vue')
    },
    {
      path: '/admin/cms',
      name: 'admin-cms',
      component: () => import('../views/admin/AdminCmsView.vue')
    }
  ],
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    if (to.hash) {
      // Biarkan komponen target (HomeView) melakukan smooth scroll dengan timing yang tepat
      return false
    }
    return { top: 0 }
  }
})

router.beforeEach((to, from, next) => {
  const { currentUser } = useAuth()

  if (to.path.startsWith('/admin')) {
    if (!currentUser.value || currentUser.value.role !== 'admin') {
      return next('/login')
    }
  }

  if (to.path.startsWith('/user')) {
    if (!currentUser.value) {
      return next('/login')
    }
  }

  next()
})

export default router

