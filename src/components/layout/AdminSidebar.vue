<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuth } from '../../composables/useAuth'

const route = useRoute()
const router = useRouter()
const { logout } = useAuth()
const isMobileSidebarOpen = ref(false)

const toggleSidebar = () => {
  isMobileSidebarOpen.value = !isMobileSidebarOpen.value
}

const closeSidebar = () => {
  isMobileSidebarOpen.value = false
}

const handleLogout = () => {
  if (confirm('Keluar dari portal Admin?')) {
    logout()
    router.push('/login')
  }
}
</script>

<template>
  <div>
    <!-- Floating Arrow Button on Edge when closed on mobile -->
    <button 
      class="floating-sidebar-trigger" 
      :class="{ 'hide': isMobileSidebarOpen }" 
      @click="toggleSidebar" 
      title="Buka Sidebar Navigasi"
      aria-label="Buka Navigasi"
    >
      <i class='bx bx-right-arrow-alt'></i>
    </button>

    <!-- Sidebar Aside -->
    <aside class="sidebar" :class="{ 'show': isMobileSidebarOpen }">
      <div class="sidebar-header">
        <RouterLink to="/" class="sidebar-logo">
          <i class='bx bxs-shield-quarter'></i>
          <span>Admin<strong>Space</strong></span>
        </RouterLink>
        <button class="mobile-sidebar-close" @click="closeSidebar" aria-label="Tutup Navigasi" title="Tutup Sidebar">
          <i class='bx bx-left-arrow-alt'></i>
        </button>
      </div>

      <nav class="sidebar-nav" aria-label="Menu Admin">
        <span class="nav-section-title">Manajemen Kost</span>
        <RouterLink 
          to="/admin/dashboard" 
          class="sidebar-link" 
          :class="{ active: route.path === '/admin/dashboard' || route.path === '/admin' }"
          @click="closeSidebar"
        >
          <i class='bx bxs-dashboard'></i>
          <span>Dashboard Overview</span>
        </RouterLink>

        <RouterLink 
          to="/admin/tenants" 
          class="sidebar-link" 
          :class="{ active: route.path.startsWith('/admin/tenants') }"
          @click="closeSidebar"
        >
          <i class='bx bxs-user-detail'></i>
          <span>Data Penyewa</span>
        </RouterLink>

        <RouterLink 
          to="/admin/rooms" 
          class="sidebar-link" 
          :class="{ active: route.path.startsWith('/admin/rooms') }"
          @click="closeSidebar"
        >
          <i class='bx bxs-bed'></i>
          <span>Kelola Kamar & Status</span>
        </RouterLink>

        <RouterLink 
          to="/admin/payments" 
          class="sidebar-link" 
          :class="{ active: route.path.startsWith('/admin/payments') }"
          @click="closeSidebar"
        >
          <i class='bx bxs-credit-card-front'></i>
          <span>Tagihan & Pembayaran</span>
        </RouterLink>

        <RouterLink 
          to="/admin/complaints" 
          class="sidebar-link" 
          :class="{ active: route.path.startsWith('/admin/complaints') }"
          @click="closeSidebar"
        >
          <i class='bx bxs-error-alt'></i>
          <span>Keluhan Penyewa</span>
        </RouterLink>

        <span class="nav-section-title">Pengaturan Website</span>
        <RouterLink 
          to="/admin/cms" 
          class="sidebar-link" 
          :class="{ active: route.path.startsWith('/admin/cms') }"
          @click="closeSidebar"
        >
          <i class='bx bxs-megaphone'></i>
          <span>Kelola Landing Page</span>
        </RouterLink>

        <span class="nav-section-title">Navigasi Utama</span>
        <RouterLink to="/user" class="sidebar-link" @click="closeSidebar">
          <i class='bx bxs-user-circle'></i>
          <span>Portal Penyewa</span>
        </RouterLink>
        <RouterLink to="/" class="sidebar-link" @click="closeSidebar">
          <i class='bx bx-globe'></i>
          <span>Website Utama</span>
        </RouterLink>
      </nav>

      <div class="sidebar-profile">
        <div class="profile-avatar">AD</div>
        <div class="profile-info">
          <h4>Pengelola Admin</h4>
          <span>Super Admin</span>
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
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--tertiary-light);
  border: 1px solid var(--border);
  color: var(--primary);
  padding: 6px 14px;
  border-radius: var(--radius-full);
  font-size: 0.88rem;
  font-weight: 700;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.mobile-toggle i {
  font-size: 1.4rem;
  transition: transform var(--transition-fast);
}

.mobile-toggle:hover i {
  transform: translateX(3px);
}

.floating-sidebar-trigger {
  display: none;
  position: fixed;
  top: 50%;
  left: 0;
  transform: translateY(-50%);
  z-index: 890;
  background: var(--primary);
  color: var(--white);
  border: none;
  border-radius: 0 10px 10px 0;
  padding: 12px 10px;
  font-size: 1.5rem;
  cursor: pointer;
  box-shadow: 2px 4px 12px rgba(0, 0, 0, 0.2);
  transition: all var(--transition-smooth);
}

.floating-sidebar-trigger i {
  animation: pulseArrow 1.5s infinite ease-in-out;
}

.floating-sidebar-trigger.hide {
  opacity: 0;
  pointer-events: none;
  transform: translateY(-50%) translateX(-100%);
}

@keyframes pulseArrow {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(4px); }
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
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.mobile-sidebar-close {
  display: none;
  background: none;
  border: none;
  font-size: 1.6rem;
  color: var(--text-muted);
  cursor: pointer;
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
}

.sidebar-overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 940;
}

@media (max-width: 992px) {
  .mobile-sidebar-close { display: block; }
  .floating-sidebar-trigger { display: flex; align-items: center; justify-content: center; }
  .sidebar { transform: translateX(-100%); }
  .sidebar.show { transform: translateX(0); }
  .sidebar-overlay.show { display: block; }
}
</style>
