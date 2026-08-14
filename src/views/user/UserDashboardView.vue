<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import UserSidebar from '../../components/layout/UserSidebar.vue'
import { RouterLink } from 'vue-router'
import { useAuth } from '../../composables/useAuth'
import { useDataStore } from '../../composables/useDataStore'

const { currentUser } = useAuth()
const { cmsSettings, complaints, payments, getRoomById, getBuildingName } = useDataStore()

const currentRoom = computed(() => {
  const roomId = currentUser.value?.roomId || 'A-13'
  return getRoomById(roomId)
})

const userName = computed(() => currentUser.value?.name || 'Keyla Asyfa Zahra')
const roomNumber = computed(() => currentRoom.value ? `Kamar ${currentRoom.value.number}` : 'Kamar A13')
const roomType = computed(() => currentRoom.value?.typeName || 'Kamar Mandi Dalam')
const building = computed(() => currentRoom.value ? getBuildingName(currentRoom.value.buildingId) : 'Gedung A')
const monthlyRent = computed(() => currentUser.value?.monthlyRent || currentRoom.value?.price || 950000)

// Countdown Timer Logic
const targetDateStr = computed(() => currentUser.value?.endDate || '2027-08-31')
const daysLeft = ref(0)
const hoursLeft = ref(0)
const minutesLeft = ref(0)
const secondsLeft = ref(0)
let timer: any = null

const updateCountdown = () => {
  const target = new Date(`${targetDateStr.value}T23:59:59`).getTime()
  const now = new Date().getTime()
  const distance = target - now

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

// User Complaints & Payments
const myComplaints = computed(() => {
  const memberId = currentUser.value?.id || 'MBR-01'
  return complaints.value.filter(c => c.memberId === memberId)
})

const activeComplaintsCount = computed(() => {
  return myComplaints.value.filter(c => c.status !== 'resolved').length
})

const myPayments = computed(() => {
  const memberId = currentUser.value?.id || 'MBR-01'
  return payments.value.filter(p => p.memberId === memberId)
})

const isHMinus1Month = computed(() => {
  return daysLeft.value <= 30 || currentUser.value?.status === 'hampir-habis'
})

const formatRupiah = (val: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)
}

const waLink = computed(() => {
  const phone = cmsSettings.value.contactPhone ? cmsSettings.value.contactPhone.replace(/[^0-9]/g, '') : '62895378020456'
  return `https://wa.me/${phone}`
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
          <h1>Selamat Datang, {{ userName }}! 👋</h1>
          <p>Berikut ringkasan status hunian & tagihan kost Anda</p>
        </div>
        <div class="header-date">
          <i class='bx bx-calendar'></i>
          <span>{{ currentDateFormatted }}</span>
        </div>
      </header>

      <!-- PAGE CONTENT -->
      <div class="page-body container-fluid">
        <!-- H-1 MONTH PAYMENT URGENCY ALERT BANNER -->
        <div v-if="isHMinus1Month" class="bill-urgency-banner">
          <div class="urgency-icon"><i class='bx bxs-bell-ring bx-tada'></i></div>
          <div class="urgency-content">
            <h3>⚠️ PERINGATAN: Masa Sewa Berakhir dalam {{ daysLeft }} Hari (H-1 Bulan)!</h3>
            <p>Masa sewa {{ roomNumber }} Anda jatuh tempo pada <strong>{{ targetDateStr }}</strong>. Silakan segera lakukan pembayaran tagihan perpanjangan sewa seharga <strong>{{ formatRupiah(monthlyRent) }}</strong> agar kamar Anda tidak terisi oleh penghuni lain.</p>
          </div>
          <RouterLink to="/user/payments" class="btn-pay-now">
            <i class='bx bxs-wallet'></i> Bayar Tagihan Sekarang
          </RouterLink>
        </div>

        <!-- COUNTDOWN BANNER -->
        <section class="countdown-card">
          <div class="countdown-header">
            <div>
              <h2><i class='bx bx-time-five'></i> Masa Sewa Kamar Anda</h2>
              <p>Sisa waktu sewa {{ roomNumber }} ({{ roomType }}) sebelum perpanjangan (s.d. {{ targetDateStr }})</p>
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
              <span>Tagihan Sewa Bulanan</span>
              <h3>{{ formatRupiah(monthlyRent) }}</h3>
              <span class="metric-sub sub-warning">Batas Bayar: Tanggal 05</span>
            </div>
            <RouterLink to="/user/payments" class="metric-action btn btn-ghost">Bayar Sekarang</RouterLink>
          </div>

          <div class="metric-card">
            <div class="metric-icon icon-warning"><i class='bx bxs-message-square-error'></i></div>
            <div class="metric-info">
              <span>Keluhan Aktif</span>
              <h3>{{ activeComplaintsCount }} Pengaduan</h3>
              <span class="metric-sub sub-info">Total {{ myComplaints.length }} Pengaduan diajukan</span>
            </div>
            <RouterLink to="/user/complaints" class="metric-action btn btn-ghost">Lihat Status</RouterLink>
          </div>

          <div class="metric-card">
            <div class="metric-icon icon-success"><i class='bx bxs-home-heart'></i></div>
            <div class="metric-info">
              <span>Informasi Kamar</span>
              <h3>{{ roomNumber }}</h3>
              <span class="metric-sub">{{ building }} · {{ roomType }}</span>
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
                <div class="announcement-date">Pengumuman Terkini</div>
                <h4>{{ cmsSettings.heroBadgeText || 'Pengumuman Kost Muslimah Sekar Wangi' }}</h4>
                <p>{{ cmsSettings.announcementBarText || 'Mohon selalu menjaga kebersihan dan ketertiban bersama.' }}</p>
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
                  <h4>Pengelola Kost Sekar Space</h4>
                  <span>{{ cmsSettings.contactPhone || '+62 895-3780-20456' }}</span>
                </div>
              </div>
              <p class="manager-desc">Memiliki pertanyaan seputar kamar, perpanjangan sewa, atau keadaan darurat?</p>
              <a :href="waLink" target="_blank" rel="noopener" class="btn btn-primary wa-btn">
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

.bill-urgency-banner {
  background: linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%);
  border: 2px solid #F59E0B;
  border-radius: var(--radius-lg);
  padding: 20px 24px;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 4px 15px rgba(245, 158, 11, 0.15);
}

.urgency-icon {
  font-size: 2.5rem;
  color: #D97706;
}

.urgency-content {
  flex: 1;
}

.urgency-content h3 {
  font-size: 1.1rem;
  color: #92400E;
  margin-bottom: 4px;
  font-weight: 700;
}

.urgency-content p {
  font-size: 0.9rem;
  color: #78350F;
}

.btn-pay-now {
  background: #D97706;
  color: #fff;
  font-weight: 700;
  padding: 10px 20px;
  border-radius: var(--radius-full);
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.btn-pay-now:hover {
  background: #B45309;
  color: #fff;
  transform: translateY(-2px);
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

@media (max-width: 768px) {
  .main-content {
    padding: 16px;
  }
  .top-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 20px;
  }
  .header-greeting h1 {
    font-size: 1.4rem;
  }
  .countdown-card {
    padding: 20px 16px;
    margin-bottom: 20px;
  }
  .countdown-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  .countdown-header h2 {
    font-size: 1.15rem;
  }
  .countdown-grid {
    gap: 6px;
  }
  .time-box {
    min-width: 55px;
    padding: 10px 6px;
  }
  .time-value {
    font-size: 1.3rem;
  }
  .time-separator {
    font-size: 1.2rem;
  }
  .dashboard-box {
    padding: 16px;
  }
}

@media (max-width: 480px) {
  .countdown-grid {
    justify-content: space-between;
    width: 100%;
  }
  .time-box {
    flex: 1;
    min-width: 0;
    padding: 8px 4px;
  }
  .time-value {
    font-size: 1.1rem;
  }
  .time-label {
    font-size: 0.65rem;
  }
  .time-separator {
    display: none;
  }
}
</style>
