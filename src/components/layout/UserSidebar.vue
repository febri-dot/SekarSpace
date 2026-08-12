<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuth } from '../../composables/useAuth'

const route = useRoute()
const router = useRouter()
const { currentUser, logout } = useAuth()
const isMobileSidebarOpen = ref(false)

const toggleSidebar = () => {
  isMobileSidebarOpen.value = !isMobileSidebarOpen.value
}

const closeSidebar = () => {
  isMobileSidebarOpen.value = false
}

const handleLogout = () => {
  if (confirm('Apakah Anda yakin ingin keluar dari portal penyewa?')) {
    logout()
    router.push('/login')
  }
}

const userInitials = computed(() => {
  const name = currentUser.value?.name || 'Keyla Asyfa'
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
})
</script>

<template>
  <div>
    <!-- Mobile Toggle Header -->
    <div class="mobile-dashboard-header">
      <button class="mobile-toggle" @click="toggleSidebar" aria-label="Toggle Navigation">
        <i class='bx bx-menu'></i>
      </button>
      <span class="mobile-brand">Sekar<strong>Space</strong></span>
    </div>

    <!-- Sidebar Aside -->
    <aside class="sidebar" :class="{ 'show': isMobileSidebarOpen }">
      <div class="sidebar-header">
        <RouterLink to="/" class="sidebar-logo">
          <i class='bx bxs-home-heart'></i>
          <span>Sekar<strong>Space</strong></span>
        </RouterLink>
      </div>

      <nav class="sidebar-nav" aria-label="Menu Dashboard">
        <span class="nav-section-title">Menu Utama</span>
        <RouterLink 
          to="/user" 
          class="sidebar-link" 
          :class="{ active: route.path === '/user' }"
          @click="closeSidebar"
        >
          <i class='bx bxs-dashboard'></i>
          <span>Dashboard</span>
        </RouterLink>

        <RouterLink 
          to="/user/complaints" 
          class="sidebar-link" 
          :class="{ active: route.path === '/user/complaints' }"
          @click="closeSidebar"
        >
          <i class='bx bxs-message-square-error'></i>
          <span>Keluhan</span>
          <span class="badge-count">2</span>
        </RouterLink>

        <RouterLink 
          to="/user/payments" 
          class="sidebar-link" 
          :class="{ active: route.path === '/user/payments' }"
          @click="closeSidebar"
        >
          <i class='bx bxs-wallet'></i>
          <span>Pembayaran</span>
        </RouterLink>

        <span class="nav-section-title">Portal Lain</span>
        <RouterLink to="/" class="sidebar-link" @click="closeSidebar">
          <i class='bx bx-globe'></i>
          <span>Website Utama</span>
        </RouterLink>
        <RouterLink to="/admin/tenants" class="sidebar-link" @click="closeSidebar">
          <i class='bx bxs-user-badge'></i>
          <span>Portal Admin</span>
        </RouterLink>
      </nav>

      <div class="sidebar-profile">
        <div class="profile-avatar">{{ userInitials }}</div>
        <div class="profile-info">
          <h4>{{ currentUser?.name || 'Keyla Asyfa' }}</h4>
          <span>{{ currentUser?.roomNumber || 'Kamar 07' }} · Deluxe</span>
        </div>
        <button class="logout-btn" title="Keluar" @click="handleLogout">
          <i class='bx bx-log-out'></i>
        </button>
      </div>
    </aside>

    <!-- Overlay -->
    <div 
      class="sidebar-overlay" 
      :class="{ 'show': isMobileSidebarOpen }" 
      @click="closeSidebar"
    ></div>
  </div>
</template>

<style scoped>
.mobile-dashboard-header {
  display: none;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  background: var(--white);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 900;
}

.mobile-toggle {
  background: none;
  border: none;
  font-size: 1.6rem;
  color: var(--dark);
  cursor: pointer;
}

.mobile-brand {
  font-family: var(--font-heading);
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--primary);
}

.sidebar {
  width: 260px;
  height: 100vh;
  background: var(--white);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 950;
  transition: transform var(--transition-smooth);
}

.sidebar-header {
  padding: 24px;
  border-bottom: 1px solid var(--border);
}

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-heading);
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--primary);
}

.sidebar-nav {
  padding: 24px 16px;
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.nav-section-title {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: var(--text-muted);
  margin: 16px 12px 6px;
}

.sidebar-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: var(--radius-md);
  color: var(--text);
  font-weight: 500;
  font-size: 0.95rem;
  transition: all var(--transition-fast);
}

.sidebar-link i {
  font-size: 1.25rem;
  color: var(--text-muted);
}

.sidebar-link:hover {
  background: var(--tertiary-light);
  color: var(--primary);
}

.sidebar-link.active {
  background: var(--primary);
  color: var(--white);
}

.sidebar-link.active i {
  color: var(--secondary);
}

.badge-count {
  margin-left: auto;
  background: var(--primary-light);
  color: var(--white);
  font-size: 0.75rem;
  padding: 2px 8px;
  border-radius: var(--radius-full);
}

.sidebar-link.active .badge-count {
  background: var(--secondary);
  color: var(--dark);
}

.sidebar-profile {
  padding: 16px 20px;
  border-top: 1px solid var(--border);
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--off-white);
}

.profile-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--primary);
  color: var(--white);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.9rem;
}

.profile-info {
  flex: 1;
  overflow: hidden;
}

.profile-info h4 {
  font-size: 0.9rem;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

.profile-info span {
  font-size: 0.75rem;
  color: var(--text-muted);
  display: block;
}

.logout-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 1.25rem;
  cursor: pointer;
  padding: 6px;
  border-radius: var(--radius-sm);
  transition: color var(--transition-fast);
}

.logout-btn:hover {
  color: var(--danger);
}

.sidebar-overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 940;
}

@media (max-width: 992px) {
  .mobile-dashboard-header { display: flex; }
  .sidebar { transform: translateX(-100%); }
  .sidebar.show { transform: translateX(0); }
  .sidebar-overlay.show { display: block; }
}
</style>
