<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useAuth } from '../../composables/useAuth'

const route = useRoute()
const { isLoggedIn, currentUser, isAdmin } = useAuth()
const isMobileNavOpen = ref(false)
const isScrolled = ref(false)

const toggleMobileNav = () => {
  isMobileNavOpen.value = !isMobileNavOpen.value
  if (isMobileNavOpen.value) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
}

const closeMobileNav = () => {
  isMobileNavOpen.value = false
  document.body.style.overflow = ''
}

const handleScroll = () => {
  isScrolled.value = window.scrollY > 50
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<template>
  <header id="header" class="header" :class="{ 'scrolled': isScrolled }">
    <nav class="navbar" aria-label="Navigasi Utama">
      <RouterLink to="/" class="nav-logo" aria-label="Sekar Space - Beranda" @click="closeMobileNav">
        <i class='bx bxs-home-heart'></i>
        <span>Sekar<strong>Space</strong></span>
      </RouterLink>

      <ul class="nav-menu" :class="{ 'show': isMobileNavOpen }" role="menubar">
        <li role="none">
          <RouterLink to="/" class="nav-link" :class="{ active: route.path === '/' }" role="menuitem" @click="closeMobileNav">
            Beranda
          </RouterLink>
        </li>
        <li role="none">
          <a href="/#facilities" class="nav-link" role="menuitem" @click="closeMobileNav">Fasilitas</a>
        </li>
        <li role="none">
          <RouterLink to="/rooms" class="nav-link" :class="{ active: route.path === '/rooms' }" role="menuitem" @click="closeMobileNav">
            Kamar
          </RouterLink>
        </li>
        <li role="none">
          <a href="/#gallery" class="nav-link" role="menuitem" @click="closeMobileNav">Galeri</a>
        </li>
        <li role="none">
          <a href="/#contact" class="nav-link" role="menuitem" @click="closeMobileNav">Kontak</a>
        </li>
        <li role="none" class="portal-nav-item">
          <RouterLink v-if="isAdmin" to="/admin/tenants" class="nav-link" @click="closeMobileNav">
            <i class='bx bxs-shield'></i> Portal Admin
          </RouterLink>

          <RouterLink v-else-if="isLoggedIn" to="/user" class="nav-link" @click="closeMobileNav">
            <i class='bx bxs-user-circle'></i> Portal Penyewa
          </RouterLink>

          <RouterLink v-else to="/login" class="nav-link" @click="closeMobileNav">
            <i class='bx bx-log-in'></i> Login Akun
          </RouterLink>
        </li>
      </ul>

      <div class="nav-actions">
        <RouterLink v-if="isAdmin" to="/admin/tenants" class="btn btn-primary nav-btn">
          <i class='bx bxs-shield'></i> Portal Admin
        </RouterLink>

        <RouterLink v-else-if="isLoggedIn" to="/user" class="btn btn-primary nav-btn">
          <i class='bx bxs-user'></i> Portal Penyewa
        </RouterLink>

        <RouterLink v-else to="/login" class="btn btn-primary nav-btn">
          <i class='bx bx-log-in'></i> Login
        </RouterLink>

        <button 
          class="nav-toggle" 
          id="navToggle" 
          aria-label="Toggle navigasi" 
          :aria-expanded="isMobileNavOpen" 
          @click="toggleMobileNav"
        >
          <i :class="isMobileNavOpen ? 'bx bx-x' : 'bx bx-menu'"></i>
        </button>
      </div>
    </nav>
  </header>

  <!-- Mobile Overlay -->
  <div 
    class="nav-overlay" 
    :class="{ 'show': isMobileNavOpen }" 
    @click="closeMobileNav"
  ></div>
</template>

<style scoped>
.header {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 1000;
  background: rgba(253, 251, 249, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(232, 221, 210, 0.5);
  transition: all var(--transition-smooth);
}

.header.scrolled {
  background: rgba(253, 251, 249, 0.98);
  box-shadow: var(--shadow-md);
  padding: 4px 0;
}

.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: var(--container-max);
  margin: 0 auto;
  padding: 16px 24px;
}

.nav-logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-heading);
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--primary);
  letter-spacing: -0.5px;
}

.nav-logo i {
  font-size: 1.6rem;
}

.nav-logo span strong {
  color: var(--dark);
}

.nav-menu {
  display: flex;
  align-items: center;
  gap: 32px;
}

.nav-link {
  font-weight: 500;
  font-size: 0.95rem;
  color: var(--text);
  position: relative;
  padding: 4px 0;
}

.nav-link::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 2px;
  background-color: var(--primary);
  transition: width var(--transition-fast);
}

.nav-link:hover::after,
.nav-link.active::after {
  width: 100%;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.nav-btn {
  padding: 8px 18px;
  font-size: 0.85rem;
}

.nav-toggle {
  display: none;
  background: none;
  border: none;
  font-size: 1.8rem;
  color: var(--dark);
  cursor: pointer;
}

.portal-nav-item {
  display: none;
}

.nav-overlay {
  position: fixed;
  inset: 0;
  background: rgba(44, 24, 16, 0.4);
  backdrop-filter: blur(4px);
  z-index: 998;
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--transition-base);
}

.nav-overlay.show {
  opacity: 1;
  pointer-events: auto;
}

@media (max-width: 900px) {
  .nav-btn {
    display: none;
  }
  
  .portal-nav-item {
    display: block;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid var(--border);
  }

  .nav-toggle {
    display: flex;
  }

  .nav-menu {
    position: fixed;
    top: 0;
    right: -100%;
    width: 280px;
    height: 100vh;
    background: var(--white);
    flex-direction: column;
    align-items: flex-start;
    padding: 80px 32px 32px;
    gap: 20px;
    box-shadow: var(--shadow-xl);
    z-index: 999;
    transition: right var(--transition-smooth);
  }

  .nav-menu.show {
    right: 0;
  }
}
</style>
