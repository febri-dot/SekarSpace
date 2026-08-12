<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import UserSidebar from '../../components/layout/UserSidebar.vue'
import { RouterLink } from 'vue-router'

// Countdown Timer Logic
const targetDate = new Date('2026-09-01T23:59:59').getTime()
const daysLeft = ref(0)
const hoursLeft = ref(0)
const minutesLeft = ref(0)
const secondsLeft = ref(0)
let timer: any = null

const updateCountdown = () => {
  const now = new Date().getTime()
  const distance = targetDate - now

  if (distance < 0) {
    daysLeft.value = 0
    hoursLeft.value = 0
    minutesLeft.value = 0
    secondsLeft.value = 0
    return
  }

  daysLeft.value = Math.floor(distance / (1000 * 60 * 60 * 24))
  hoursLeft.value = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  minutesLeft.value = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
  secondsLeft.value = Math.floor((distance % (1000 * 60)) / 1000)
}

const currentDateFormatted = computed(() => {
  const now = new Date()
  return now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
})

onMounted(() => {
  updateCountdown()
  timer = setInterval(updateCountdown, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <div class="dashboard-page">
    <UserSidebar />

    <main class="main-content">
      <!-- HEADER -->
      <header class="top-header">
        <div class="header-greeting">
          <h1>Selamat Datang, Keyla! 👋</h1>
          <p>Berikut ringkasan status hunian & tagihan kost Anda</p>
        </div>
        <div class="header-date">
          <i class='bx bx-calendar'></i>
          <span>{{ currentDateFormatted }}</span>
        </div>
      </header>

      <!-- PAGE CONTENT -->
      <div class="page-body container-fluid">
        <!-- COUNTDOWN BANNER -->
        <section class="countdown-card">
          <div class="countdown-header">
            <div>
              <h2><i class='bx bx-time-five'></i> Masa Sewa Kamar Anda</h2>
              <p>Sisa waktu sewa Kamar 07 (Deluxe) sebelum perpanjangan</p>
            </div>
            <span class="status-badge badge-active"><i class='bx bx-check-circle'></i> Aktif</span>
          </div>

          <div class="countdown-grid">
            <div class="time-box">
              <span class="time-value">{{ daysLeft }}</span>
              <span class="time-label">Hari</span>
            </div>
            <div class="time-separator">:</div>
            <div class="time-box">
              <span class="time-value">{{ hoursLeft < 10 ? '0' + hoursLeft : hoursLeft }}</span>
              <span class="time-label">Jam</span>
            </div>
            <div class="time-separator">:</div>
            <div class="time-box">
              <span class="time-value">{{ minutesLeft < 10 ? '0' + minutesLeft : minutesLeft }}</span>
              <span class="time-label">Menit</span>
            </div>
            <div class="time-separator">:</div>
            <div class="time-box">
              <span class="time-value">{{ secondsLeft < 10 ? '0' + secondsLeft : secondsLeft }}</span>
              <span class="time-label">Detik</span>
            </div>
          </div>
        </section>

        <!-- DASHBOARD METRICS GRID -->
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-icon icon-primary"><i class='bx bxs-wallet'></i></div>
            <div class="metric-info">
              <span>Tagihan Bulan Ini</span>
              <h3>Rp 950.000</h3>
              <span class="metric-sub sub-warning">Jatuh Tempo: 1 Sep 2026</span>
            </div>
            <RouterLink to="/user/payments" class="metric-action btn btn-ghost">Bayar Sekarang</RouterLink>
          </div>

          <div class="metric-card">
            <div class="metric-icon icon-warning"><i class='bx bxs-message-square-error'></i></div>
            <div class="metric-info">
              <span>Keluhan Aktif</span>
              <h3>2 Pengaduan</h3>
              <span class="metric-sub sub-info">1 Dalam Proses, 1 Selesai</span>
            </div>
            <RouterLink to="/user/complaints" class="metric-action btn btn-ghost">Lihat Status</RouterLink>
          </div>

          <div class="metric-card">
            <div class="metric-icon icon-success"><i class='bx bxs-home-heart'></i></div>
            <div class="metric-info">
              <span>Informasi Kamar</span>
              <h3>Kamar 07</h3>
              <span class="metric-sub">Gedung Utama · Lt. 2</span>
            </div>
            <RouterLink to="/rooms" class="metric-action btn btn-ghost">Pindah Kamar</RouterLink>
          </div>
        </div>

        <!-- TWO COLUMN SECTION -->
        <div class="dashboard-columns">
          <!-- ANNOUNCEMENTS & RULES -->
          <div class="dashboard-box">
            <div class="box-header">
              <h2><i class='bx bxs-megaphone'></i> Pengumuman Kost</h2>
            </div>
            <div class="announcement-list">
              <div class="announcement-item">
                <div class="announcement-date">10 Ags 2026</div>
                <h4>Pembersihan AC Berkala</h4>
                <p>Jadwal pembersihan AC untuk lantai 2 akan dilaksanakan pada Sabtu, 15 Agustus 2026 pukul 09.00 WIB.</p>
              </div>
              <div class="announcement-item">
                <div class="announcement-date">01 Ags 2026</div>
                <h4>Ketertiban Jam Malam</h4>
                <p>Gerbang utama akan dikunci pada pukul 22.00 WIB. Mohon gunakan akses kunci card jika pulang melebihi jam tersebut.</p>
              </div>
            </div>
          </div>

          <!-- QUICK LINKS / CONTACT MANAGER -->
          <div class="dashboard-box">
            <div class="box-header">
              <h2><i class='bx bxs-user-voice'></i> Bantuan & Pengelola</h2>
            </div>
            <div class="manager-card">
              <div class="manager-info">
                <div class="manager-avatar">BU</div>
                <div>
                  <h4>Ibu Hj. Sekar Wangi</h4>
                  <span>Pengelola Kost Sekar Space</span>
                </div>
              </div>
              <p class="manager-desc">Memiliki pertanyaan seputar kamar, perpanjangan sewa, atau keadaan darurat?</p>
              <a href="https://wa.me/6281234567890" target="_blank" rel="noopener" class="btn btn-primary wa-btn">
                <i class='bx bxl-whatsapp'></i> Chat WhatsApp Pengelola
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.dashboard-page {
  display: flex;
  min-height: 100vh;
  background: var(--off-white);
}

.main-content {
  flex: 1;
  margin-left: 260px;
  padding: 32px;
  min-width: 0;
}

.top-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32px;
}

.header-greeting h1 {
  font-size: 1.8rem;
  margin-bottom: 4px;
}

.header-greeting p {
  color: var(--text-muted);
  font-size: 0.9rem;
}

.header-date {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--white);
  padding: 10px 18px;
  border-radius: var(--radius-full);
  border: 1px solid var(--border);
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--primary);
}

/* COUNTDOWN CARD */
.countdown-card {
  background: linear-gradient(135deg, var(--dark-soft) 0%, var(--primary) 100%);
  color: var(--white);
  border-radius: var(--radius-xl);
  padding: 32px;
  margin-bottom: 32px;
  box-shadow: var(--shadow-lg);
}

.countdown-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.countdown-header h2 {
  color: var(--white);
  font-size: 1.35rem;
  margin-bottom: 4px;
}

.countdown-header p {
  color: var(--secondary-light);
  font-size: 0.88rem;
}

.status-badge {
  padding: 6px 14px;
  border-radius: var(--radius-full);
  font-weight: 700;
  font-size: 0.8rem;
}

.badge-active {
  background: rgba(46, 125, 50, 0.25);
  color: #a5d6a7;
  border: 1px solid #81c784;
}

.countdown-grid {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.time-box {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(8px);
  padding: 16px 24px;
  border-radius: var(--radius-lg);
  text-align: center;
  min-width: 90px;
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.time-value {
  display: block;
  font-family: var(--font-heading);
  font-size: 2.2rem;
  font-weight: 700;
  line-height: 1;
}

.time-label {
  font-size: 0.75rem;
  color: var(--secondary-light);
  text-transform: uppercase;
  margin-top: 4px;
}

.time-separator {
  font-size: 2rem;
  font-weight: 700;
  color: var(--secondary);
}

/* METRICS GRID */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-bottom: 32px;
}

.metric-card {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 24px;
  display: flex;
  flex-direction: column;
  position: relative;
  transition: all var(--transition-smooth);
}

.metric-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
}

.metric-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  margin-bottom: 16px;
}

.icon-primary { background: var(--tertiary); color: var(--primary); }
.icon-warning { background: var(--warning-bg); color: var(--warning); }
.icon-success { background: var(--success-bg); color: var(--success); }

.metric-info span {
  font-size: 0.82rem;
  color: var(--text-muted);
  display: block;
}

.metric-info h3 {
  font-size: 1.5rem;
  margin: 4px 0 8px;
}

.metric-sub {
  font-size: 0.8rem !important;
  font-weight: 500;
}

.sub-warning { color: var(--warning) !important; }
.sub-info { color: var(--info) !important; }

.metric-action {
  margin-top: 20px;
  padding: 8px 16px;
  font-size: 0.85rem;
  width: 100%;
}

/* DASHBOARD COLUMNS */
.dashboard-columns {
  display: grid;
  grid-template-columns: 3fr 2fr;
  gap: 24px;
}

.dashboard-box {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 24px;
}

.box-header h2 {
  font-size: 1.15rem;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.announcement-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.announcement-item {
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border);
}

.announcement-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.announcement-date {
  font-size: 0.75rem;
  color: var(--primary);
  font-weight: 700;
  margin-bottom: 4px;
}

.announcement-item h4 {
  font-size: 0.98rem;
  margin-bottom: 6px;
}

.announcement-item p {
  font-size: 0.88rem;
  color: var(--text-muted);
  line-height: 1.5;
}

.manager-card {
  background: var(--off-white);
  padding: 20px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
}

.manager-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.manager-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}

.manager-info h4 {
  font-size: 0.95rem;
}

.manager-info span {
  font-size: 0.78rem;
  color: var(--text-muted);
}

.manager-desc {
  font-size: 0.88rem;
  color: var(--text-muted);
  margin-bottom: 16px;
}

.wa-btn {
  width: 100%;
  font-size: 0.88rem;
  background: #25D366;
  border: none;
}

.wa-btn:hover {
  background: #20b858;
}

@media (max-width: 992px) {
  .main-content {
    margin-left: 0;
    padding: 20px;
  }
  .metrics-grid {
    grid-template-columns: 1fr;
  }
  .dashboard-columns {
    grid-template-columns: 1fr;
  }
}
</style>
