<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuth } from '../../composables/useAuth'

const route = useRoute()
const router = useRouter()
const { isLoggedIn, currentUser, isAdmin } = useAuth()

const portalTarget = computed(() => {
  if (!currentUser.value) {
    return {
      path: '/login',
      label: 'Login',
      icon: 'bx bx-log-in'
    }
  }
  if (currentUser.value.role === 'admin') {
    return {
      path: '/admin/dashboard',
      label: 'Portal Admin',
      icon: 'bx bxs-dashboard'
    }
  }
  return {
    path: '/user/dashboard',
    label: 'Portal Penyewa',
    icon: 'bx bxs-user-circle'
  }
})

const isMobileNavOpen = ref(false)
const isScrolled = ref(false)
const activeSection = ref('hero')

const navMenuRef = ref<HTMLElement | null>(null)
const indicatorStyle = ref<{ left: string; width: string; opacity: string }>({
  left: '0px',
  width: '0px',
  opacity: '0'
})

const updateIndicator = () => {
  if (!navMenuRef.value) return
  const activeLink = navMenuRef.value.querySelector('.nav-link.active') as HTMLElement
  if (activeLink) {
    const linkRect = activeLink.getBoundingClientRect()
    const menuRect = navMenuRef.value.getBoundingClientRect()
    const left = linkRect.left - menuRect.left
    const width = linkRect.width
    indicatorStyle.value = {
      left: `${left}px`,
      width: `${width}px`,
      opacity: '1'
    }
  } else {
    indicatorStyle.value = {
      ...indicatorStyle.value,
      opacity: '0'
    }
  }
}

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

const handleNavClick = (e: MouseEvent, target: string) => {
  closeMobileNav()
  
  if (target === '/') {
    if (route.path === '/') {
      e.preventDefault()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
    return
  }

  if (target.startsWith('/#')) {
    const hash = target.replace('/', '')
    if (route.path === '/') {
      e.preventDefault()
      const element = document.querySelector(hash)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
        history.pushState(null, '', hash)
      }
    } else {
      e.preventDefault()
      router.push({ path: '/', hash })
    }
  }
}

const handleScroll = () => {
  isScrolled.value = window.scrollY > 50

  if (route.path === '/') {
    const sections = [
      { id: 'contact', name: 'contact' },
      { id: 'faq', name: 'faq' },
      { id: 'gallery', name: 'gallery' },
      { id: 'rooms', name: 'rooms' },
      { id: 'facilities', name: 'facilities' },
      { id: 'hero', name: 'hero' }
    ]

    const scrollY = window.scrollY
    const windowHeight = window.innerHeight
    const documentHeight = document.documentElement.scrollHeight

    if (scrollY + windowHeight >= documentHeight - 80) {
      if (activeSection.value !== 'contact') {
        activeSection.value = 'contact'
      }
      return
    }

    const scrollPosition = scrollY + 160

    for (const sec of sections) {
      const el = document.getElementById(sec.id)
      if (el) {
        const top = el.offsetTop
        if (scrollPosition >= top) {
          if (activeSection.value !== sec.name) {
            activeSection.value = sec.name
          }
          break
        }
      }
    }
  } else if (route.path === '/rooms') {
    activeSection.value = 'rooms'
  } else {
    activeSection.value = ''
  }
}

watch([() => route.path, activeSection], () => {
  handleScroll()
  nextTick(() => {
    updateIndicator()
  })
})

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
  window.addEventListener('resize', updateIndicator, { passive: true })
  handleScroll()
  nextTick(() => {
    updateIndicator()
  })
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('resize', updateIndicator)
  document.body.style.overflow = ''
})
</script>

<template>
  <header id="header" class="header" :class="{ 'scrolled': isScrolled }">
    <nav class="navbar" aria-label="Navigasi Utama">
      <RouterLink to="/" class="nav-logo" aria-label="Sekar Space - Beranda" @click="handleNavClick($event, '/')">
        <i class='bx bxs-home-heart'></i>
        <span>Sekar<strong>Space</strong></span>
      </RouterLink>

      <ul class="nav-menu" ref="navMenuRef" :class="{ 'show': isMobileNavOpen }" role="menubar">
        <!-- Mobile Drawer Header -->
        <li role="none" class="mobile-nav-header">
          <div class="mobile-logo">
            <i class='bx bxs-home-heart'></i>
            <span>Sekar<strong>Space</strong></span>
          </div>
          <button class="mobile-close-btn" @click="closeMobileNav" aria-label="Tutup menu">
            <i class='bx bx-x'></i>
          </button>
        </li>

        <li role="none">
          <RouterLink to="/" class="nav-link" :class="{ active: route.path === '/' && activeSection === 'hero' }" role="menuitem" @click="handleNavClick($event, '/')">
            <i class='bx bx-home-alt mobile-nav-icon'></i>
            <span>Beranda</span>
          </RouterLink>
        </li>
        <li role="none">
          <a href="/#facilities" class="nav-link" :class="{ active: route.path === '/' && activeSection === 'facilities' }" role="menuitem" @click="handleNavClick($event, '/#facilities')">
            <i class='bx bx-check-shield mobile-nav-icon'></i>
            <span>Fasilitas</span>
          </a>
        </li>
        <li role="none">
          <RouterLink to="/rooms" class="nav-link" :class="{ active: route.path === '/rooms' || (route.path === '/' && activeSection === 'rooms') }" role="menuitem" @click="closeMobileNav">
            <i class='bx bx-door-open mobile-nav-icon'></i>
            <span>Kamar</span>
          </RouterLink>
        </li>
        <li role="none">
          <a href="/#gallery" class="nav-link" :class="{ active: route.path === '/' && activeSection === 'gallery' }" role="menuitem" @click="handleNavClick($event, '/#gallery')">
            <i class='bx bx-images mobile-nav-icon'></i>
            <span>Galeri</span>
          </a>
        </li>
        <li role="none">
          <a href="/#faq" class="nav-link" :class="{ active: route.path === '/' && activeSection === 'faq' }" role="menuitem" @click="handleNavClick($event, '/#faq')">
            <i class='bx bx-help-circle mobile-nav-icon'></i>
            <span>FAQ</span>
          </a>
        </li>
        <li role="none">
          <a href="/#contact" class="nav-link" :class="{ active: route.path === '/' && activeSection === 'contact' }" role="menuitem" @click="handleNavClick($event, '/#contact')">
            <i class='bx bx-map-pin mobile-nav-icon'></i>
            <span>Kontak</span>
          </a>
        </li>

        <li role="none" class="portal-nav-item">
          <RouterLink :to="portalTarget.path" class="portal-mobile-btn" @click="closeMobileNav">
            <i :class="portalTarget.icon"></i>
            <span>{{ portalTarget.label }}</span>
          </RouterLink>
        </li>
        <div class="nav-indicator" :style="indicatorStyle"></div>
      </ul>

      <div class="nav-actions">
        <RouterLink :to="portalTarget.path" class="btn btn-primary nav-btn" id="navAuthBtn">
          <i :class="portalTarget.icon"></i> {{ portalTarget.label }}
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
  position: relative;
}

.nav-link {
  font-weight: 500;
  font-size: 0.95rem;
  color: var(--text);
  position: relative;
  padding: 6px 0;
  transition: color 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.nav-link::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 1.5px;
  background-color: var(--primary);
  border-radius: 2px;
  transform: scaleX(0);
  transform-origin: center;
  transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease;
  opacity: 0;
}

.nav-link:hover::after {
  transform: scaleX(1);
  opacity: 0.4;
}

.nav-link.active {
  color: var(--primary);
  font-weight: 600;
}

/* Hide static line on desktop when active because dynamic sliding indicator handles active track */
.nav-link.active::after {
  display: none;
}

/* Dynamic sliding indicator track across active navbar items */
.nav-indicator {
  position: absolute;
  bottom: 0;
  height: 1.5px;
  background: var(--primary);
  border-radius: 2px;
  box-shadow: 0 1px 3px rgba(84, 26, 26, 0.15);
  pointer-events: none;
  transition: left 0.35s cubic-bezier(0.16, 1, 0.3, 1), width 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease;
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

.mobile-nav-header {
  display: none;
}

.mobile-nav-icon {
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

  .nav-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: var(--radius-sm);
  }

  .mobile-nav-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    margin-bottom: 12px;
    padding-bottom: 14px;
    border-bottom: 1px solid var(--border);
  }

  .mobile-logo {
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: var(--font-heading);
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--primary);
  }

  .mobile-logo i {
    font-size: 1.45rem;
  }

  .mobile-logo span strong {
    color: var(--dark);
  }

  .mobile-close-btn {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: var(--bg-light);
    border: 1px solid var(--border);
    color: var(--dark);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.4rem;
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .mobile-close-btn:hover {
    background: var(--primary);
    color: var(--white);
  }

  .mobile-nav-icon {
    display: inline-flex;
    font-size: 1.25rem;
    color: var(--text-muted);
    transition: color var(--transition-fast);
  }

  .nav-menu {
    position: fixed;
    top: 0;
    right: -100%;
    width: min(320px, 85vw);
    height: 100vh;
    height: 100dvh;
    background: var(--white);
    flex-direction: column;
    align-items: stretch;
    padding: 24px 20px;
    gap: 8px;
    box-shadow: -10px 0 35px rgba(44, 24, 16, 0.18);
    z-index: 1001;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    transition: right var(--transition-smooth);
  }

  .nav-menu.show {
    right: 0;
  }

  .nav-menu li {
    width: 100%;
  }

  .nav-link {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    border-radius: var(--radius-md);
    font-size: 0.98rem;
    color: var(--text);
    transition: all var(--transition-fast);
  }

  .nav-link:hover {
    background: var(--bg-light);
    color: var(--primary);
  }

  .nav-link:hover .mobile-nav-icon {
    color: var(--primary);
  }

  .nav-link.active {
    background: var(--tertiary-light);
    color: var(--primary);
    font-weight: 700;
    border-left: 3px solid var(--primary);
  }

  .nav-link.active .mobile-nav-icon {
    color: var(--primary);
  }

  .nav-link.active::after {
    display: none;
  }

  .nav-indicator {
    display: none;
  }

  .portal-nav-item {
    display: block;
    width: 100%;
    margin-top: 14px;
    padding-top: 14px;
    border-top: 1px solid var(--border);
  }

  .portal-mobile-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    width: 100%;
    padding: 14px 20px;
    background: linear-gradient(135deg, var(--primary), var(--primary-light));
    color: var(--white);
    font-weight: 600;
    font-size: 0.95rem;
    border-radius: var(--radius-lg);
    box-shadow: 0 4px 14px rgba(84, 26, 26, 0.22);
    transition: all var(--transition-fast);
  }

  .portal-mobile-btn:hover {
    filter: brightness(1.1);
    transform: translateY(-2px);
    color: var(--white);
  }

  .portal-mobile-btn i {
    font-size: 1.3rem;
  }
}
</style>
