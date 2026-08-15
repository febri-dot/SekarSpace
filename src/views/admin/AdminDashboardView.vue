<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'
import AdminSidebar from '../../components/layout/AdminSidebar.vue'
import { useDataStore, type RoomData, type ComplaintData } from '../../composables/useDataStore'
import { useAuth } from '../../composables/useAuth'

const { rooms, complaints, payments, updateComplaintResponse, getBuildingName, getRoomById } = useDataStore()
const { tenants: memberTenants, getTenantById } = useAuth()

const getTenantName = (memberId: string) => {
  const t = getTenantById(memberId)
  return t ? t.name : 'Penyewa'
}

const getTenantRoomNumber = (tenant: any) => {
  const rm = getRoomById(tenant.roomId || '')
  return rm ? `Kamar ${rm.number}` : 'Kamar A13'
}

const getTenantBuildingName = (tenant: any) => {
  const rm = getRoomById(tenant.roomId || '')
  return rm ? getBuildingName(rm.buildingId) : 'Gedung A'
}

const getComplaintRoomNumber = (c: ComplaintData) => {
  const t = getTenantById(c.memberId)
  if (t && t.roomId) {
    const rm = getRoomById(t.roomId)
    if (rm) return `Kamar ${rm.number}`
  }
  return 'Kamar A13'
}

// KPI Calculations
const totalTenantsCount = computed(() => memberTenants.value.length)
const totalRoomsCount = computed(() => rooms.value.length)
const occupiedRoomsCount = computed(() => rooms.value.filter(r => r.status === 'occupied').length)
const availableRoomsCount = computed(() => rooms.value.filter(r => r.status === 'available').length)
const occupancyRate = computed(() => totalRoomsCount.value > 0 ? Math.round((occupiedRoomsCount.value / totalRoomsCount.value) * 100) : 0)

const totalMonthlyRevenue = computed(() => {
  return memberTenants.value.reduce((acc, tenant) => acc + (tenant.monthlyRent || 700000), 0)
})

const pendingComplaintsCount = computed(() => {
  return complaints.value.filter(c => c.status === 'pending' || c.status === 'in-progress').length
})

// Summary Status Ketersediaan Kamar
const roomSummary = computed(() => {
  const total = rooms.value.length
  const occupied = occupiedRoomsCount.value
  const available = availableRoomsCount.value
  const percent = occupancyRate.value

  // Summary Per Gedung
  const buildingsMap = new Map<string, { id: string; name: string; total: number; occupied: number; available: number }>()
  rooms.value.forEach(r => {
    const bName = getBuildingName(r.buildingId)
    if (!buildingsMap.has(r.buildingId)) {
      buildingsMap.set(r.buildingId, { id: r.buildingId, name: bName, total: 0, occupied: 0, available: 0 })
    }
    const item = buildingsMap.get(r.buildingId)!
    item.total++
    if (r.status === 'occupied') item.occupied++
    else item.available++
  })

  // Summary Per Tipe Kamar
  const typeMap = new Map<string, { typeName: string; total: number; occupied: number; available: number }>()
  rooms.value.forEach(r => {
    if (!typeMap.has(r.typeId)) {
      typeMap.set(r.typeId, { typeName: r.typeName, total: 0, occupied: 0, available: 0 })
    }
    const item = typeMap.get(r.typeId)!
    item.total++
    if (r.status === 'occupied') item.occupied++
    else item.available++
  })

  return {
    total,
    occupied,
    available,
    percent,
    buildingsList: Array.from(buildingsMap.values()),
    typesList: Array.from(typeMap.values())
  }
})

// Deduplicated Single Notification List
const urgentNotifications = computed(() => {
  const map = new Map<string, {
    id: string
    roomNumber: string
    buildingName: string
    tenantName: string
    dueDate: string
    type: 'reminder' | 'billing'
    typeLabel: string
    targetLink: string
  }>()

  // 1. Check Lease Endings / Reminders
  memberTenants.value.forEach(t => {
    const isHampirHabis = t.status === 'hampir-habis'
    let isEndingSoon = false
    if (t.endDate) {
      const endDateVal = new Date(t.endDate).getTime()
      const nowVal = new Date('2026-08-14').getTime()
      const daysLeft = Math.ceil((endDateVal - nowVal) / (1000 * 3600 * 24))
      if (daysLeft <= 30) isEndingSoon = true
    }

    if (isHampirHabis || isEndingSoon) {
      const rm = getRoomById(t.roomId || '')
      const roomNum = rm ? rm.number : (t.roomId || 'A14')
      map.set(`room-${roomNum}`, {
        id: `rem-${t.id}`,
        roomNumber: roomNum,
        buildingName: rm ? getBuildingName(rm.buildingId) : 'Gedung A',
        tenantName: t.name,
        dueDate: t.endDate || '01 Agustus 2026',
        type: 'reminder',
        typeLabel: 'Jatuh Tempo Sewa',
        targetLink: '/admin/tenants'
      })
    }
  })

  // 2. Check Unpaid Billings
  memberTenants.value.forEach(t => {
    const rm = getRoomById(t.roomId || '')
    const roomNum = rm ? rm.number : 'A11'
    if (!map.has(`room-${roomNum}`)) {
      const hasPaidCurrentMonth = payments.value.some(p => p.memberId === t.id && p.period === 'Agustus 2026' && p.status === 'paid')
      const pendingPay = payments.value.find(p => p.memberId === t.id && p.status === 'pending')

      if (pendingPay) {
        map.set(`room-${roomNum}`, {
          id: `bill-${t.id}`,
          roomNumber: roomNum,
          buildingName: rm ? getBuildingName(rm.buildingId) : 'Gedung A',
          tenantName: t.name,
          dueDate: pendingPay.dueDate || '05 September 2026',
          type: 'billing',
          typeLabel: 'Jatuh Tempo Tagihan',
          targetLink: '/admin/payments'
        })
      } else if (!hasPaidCurrentMonth) {
        map.set(`room-${roomNum}`, {
          id: `bill-${t.id}`,
          roomNumber: roomNum,
          buildingName: rm ? getBuildingName(rm.buildingId) : 'Gedung A',
          tenantName: t.name,
          dueDate: '05 Agustus 2026',
          type: 'billing',
          typeLabel: 'Jatuh Tempo Tagihan',
          targetLink: '/admin/payments'
        })
      }
    }
  })

  // Fallback default
  if (map.size === 0) {
    map.set('room-A14', {
      id: 'default-1',
      roomNumber: 'A14',
      buildingName: 'Gedung A',
      tenantName: 'Zalfa Nadya Alfialini',
      dueDate: '01 Agustus 2026',
      type: 'reminder',
      typeLabel: 'Jatuh Tempo Sewa',
      targetLink: '/admin/tenants'
    })
  }

  return Array.from(map.values())
})

// Quick Reply Modal for Complaints
const selectedComplaint = ref<ComplaintData | null>(null)
const replyText = ref('')
const replyStatus = ref<'pending' | 'in-progress' | 'resolved'>('resolved')

const openReplyModal = (c: ComplaintData) => {
  selectedComplaint.value = c
  replyText.value = c.response || ''
  replyStatus.value = c.status
}

const closeReplyModal = () => {
  selectedComplaint.value = null
}

const saveReply = () => {
  if (selectedComplaint.value) {
    updateComplaintResponse(selectedComplaint.value.id, replyText.value, replyStatus.value)
    closeReplyModal()
  }
}

const formatRupiah = (val: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)
}
</script>

<template>
  <div class="admin-page">
    <AdminSidebar />

    <main class="admin-main">
      <header class="admin-header">
        <div>
          <span class="header-tag">Overview Management</span>
          <h1>Dashboard <span class="text-gradient">Admin Sekar Space</span></h1>
          <p>Ringkasan statistik hunian kost, manajemen penyewa, dan aktivitas keluhan terkini.</p>
        </div>
        <div class="admin-header-actions">
          <RouterLink to="/admin/tenants" class="btn btn-primary btn-sm">
            <i class='bx bxs-user-detail'></i> Kelola Data Penyewa
          </RouterLink>
        </div>
      </header>

      <!-- 1. KPI STATS CARDS GRID -->
      <section class="kpi-grid">
        <!-- Total Tenants -->
        <div class="kpi-card">
          <div class="kpi-icon icon-tenants">
            <i class='bx bxs-user-badge'></i>
          </div>
          <div class="kpi-info">
            <small>Total Penyewa Aktif</small>
            <strong class="kpi-value">{{ totalTenantsCount }} <span class="unit">Orang</span></strong>
            <span class="kpi-subtext"><i class='bx bx-check-double'></i> Terdata di Sistem</span>
          </div>
        </div>

        <!-- Room Occupancy Rate -->
        <div class="kpi-card">
          <div class="kpi-icon icon-rooms">
            <i class='bx bxs-bed'></i>
          </div>
          <div class="kpi-info">
            <small>Tingkat Hunian Kamar</small>
            <strong class="kpi-value">{{ occupancyRate }}%</strong>
            <span class="kpi-subtext">
              <strong>{{ occupiedRoomsCount }} Terisi</strong> · {{ availableRoomsCount }} Kosong
            </span>
          </div>
        </div>

        <!-- Monthly Income Revenue -->
        <div class="kpi-card">
          <div class="kpi-icon icon-revenue">
            <i class='bx bxs-wallet'></i>
          </div>
          <div class="kpi-info">
            <small>Estimasi Omset per Bulan</small>
            <strong class="kpi-value text-primary">{{ formatRupiah(totalMonthlyRevenue) }}</strong>
            <span class="kpi-subtext"><i class='bx bx-trending-up'></i> Total Biaya Sewa Aktif</span>
          </div>
        </div>

        <!-- Active Complaints -->
        <div class="kpi-card">
          <div class="kpi-icon icon-complaints">
            <i class='bx bxs-error-alt'></i>
          </div>
          <div class="kpi-info">
            <small>Keluhan Perlu Penanganan</small>
            <strong class="kpi-value text-danger">{{ pendingComplaintsCount }} <span class="unit">Tiket</span></strong>
            <span class="kpi-subtext">
              {{ complaints.filter(c => c.status === 'resolved').length }} Keluhan Selesai
            </span>
          </div>
        </div>
      </section>

      <!-- 2. ROOM AVAILABILITY SUMMARY & NOTIFICATIONS (UNIFIED ALL-IN-ONE CARD) -->
      <div class="dashboard-columns">
        <!-- Left Main Panel: 1 Single Unified Card -->
        <div class="left-dash-column">
          <div class="dashboard-card unified-room-card">
            <!-- Sleek Card Header -->
            <div class="unified-card-header">
              <div class="header-title-box">
                <div class="header-icon"><i class='bx bxs-building-house'></i></div>
                <div>
                  <h3>Status Ketersediaan & Pengingat Kamar</h3>
                  <p>Ringkasan hunian kost dan pemberitahuan kamar jatuh tempo sewa/tagihan.</p>
                </div>
              </div>
              <RouterLink to="/admin/rooms" class="btn btn-ghost btn-sm header-action-btn">
                <i class='bx bx-door-open'></i> Master Kamar ({{ roomSummary.total }})
              </RouterLink>
            </div>

            <!-- SECTION 1: Summary Metrics Bar -->
            <div class="summary-metric-bar">
              <div class="metric-item">
                <span class="metric-label">Total Kapasitas</span>
                <strong class="metric-val">{{ roomSummary.total }} <small>Kamar</small></strong>
              </div>
              <div class="metric-divider"></div>
              <div class="metric-item">
                <span class="metric-label">Kamar Terisi</span>
                <strong class="metric-val text-amber">{{ roomSummary.occupied }} <small>Kamar ({{ roomSummary.percent }}%)</small></strong>
              </div>
              <div class="metric-divider"></div>
              <div class="metric-item">
                <span class="metric-label">Kamar Tersedia</span>
                <strong class="metric-val text-emerald">{{ roomSummary.available }} <small>Kamar</small></strong>
              </div>
            </div>

            <!-- Progress Box -->
            <div class="occupancy-progress-box">
              <div class="progress-info">
                <small>Tingkat Keterisian Hunian</small>
                <strong>{{ roomSummary.percent }}% Terisi</strong>
              </div>
              <div class="progress-track-bg">
                <div class="progress-fill-bar" :style="{ width: roomSummary.percent + '%' }"></div>
              </div>
            </div>

            <!-- Breakdown Chips Row -->
            <div class="summary-chips-row">
              <div class="chips-group">
                <span class="chips-group-title"><i class='bx bxs-city'></i> Gedung:</span>
                <span v-for="b in roomSummary.buildingsList" :key="b.id" class="chip-item">
                  <strong>{{ b.name }}</strong>: {{ b.occupied }} Terisi / {{ b.available }} Kosong
                </span>
              </div>
              <div class="chips-group">
                <span class="chips-group-title"><i class='bx bxs-category'></i> Tipe:</span>
                <span v-for="t in roomSummary.typesList" :key="t.typeName" class="chip-item">
                  <strong>{{ t.typeName }}</strong>: {{ t.occupied }} Terisi / {{ t.available }} Kosong
                </span>
              </div>
            </div>

            <!-- SECTION 2: Clean Notification Table -->
            <div class="notif-section-container">
              <div class="notif-section-header">
                <div class="section-title">
                  <i class='bx bxs-bell-ring text-warning'></i>
                  <span>Pengingat Jatuh Tempo Kamar</span>
                </div>
                <span class="notif-count-badge">{{ urgentNotifications.length }} Kamar</span>
              </div>

              <div class="clean-notif-table">
                <div v-for="item in urgentNotifications" :key="item.id" class="clean-notif-row">
                  <div class="row-left">
                    <span class="room-pill-tag" :class="item.type">
                      Kamar {{ item.roomNumber }}
                    </span>
                    <div class="tenant-meta">
                      <strong class="t-name">{{ item.tenantName }}</strong>
                      <span class="t-bld">{{ item.buildingName }}</span>
                    </div>
                  </div>

                  <div class="row-middle">
                    <span class="due-badge" :class="item.type">
                      <i class='bx bx-calendar-event'></i> {{ item.typeLabel }}: <strong>{{ item.dueDate }}</strong>
                    </span>
                  </div>

                  <div class="row-right">
                    <RouterLink :to="item.targetLink" class="link-detail-btn">
                      Lihat Detail <i class='bx bx-chevron-right'></i>
                    </RouterLink>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Tenants List Sidebar Widget -->
        <div class="dashboard-card tenants-widget">
          <div class="card-header">
            <h3><i class='bx bxs-user-detail'></i> Penyewa Terbaru</h3>
            <RouterLink to="/admin/tenants" class="view-all-link">Lihat Semua</RouterLink>
          </div>

          <div class="tenant-widget-list">
            <div 
              v-for="tenant in memberTenants.slice(0, 4)" 
              :key="tenant.id"
              class="tenant-widget-item"
            >
              <div class="tenant-avatar">
                {{ tenant.name.split(' ').map(n => n[0]).join('').slice(0, 2) }}
              </div>
              <div class="tenant-widget-info">
                <h4>{{ tenant.name }}</h4>
                <p>{{ getTenantRoomNumber(tenant) }} · {{ getTenantBuildingName(tenant) }}</p>
                <small class="tenant-phone"><i class='bx bxl-whatsapp'></i> {{ tenant.phone }}</small>
              </div>
              <span class="tenant-status-pill" :class="tenant.status">
                {{ tenant.status === 'aktif' ? 'Aktif' : 'Hampir Habis' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 3. RECENT COMPLAINTS & PAYMENTS SECTION -->
      <div class="dashboard-content-grid mt-4">
        <!-- Recent Complaints Card -->
        <div class="dashboard-card">
          <div class="card-header">
            <div>
              <h3><i class='bx bxs-error-alt'></i> Daftar Keluhan Penyewa Terkini</h3>
              <p>Keluhan dan permohonan perbaikan dari para penghuni kost.</p>
            </div>
            <RouterLink to="/admin/complaints" class="btn btn-ghost btn-sm">Lihat Semua Keluhan</RouterLink>
          </div>

          <div class="table-responsive">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Penyewa</th>
                  <th>Nomor Kamar</th>
                  <th>Judul Keluhan</th>
                  <th>Tanggal</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="comp in complaints.slice(0, 5)" :key="comp.id">
                  <td><strong>{{ getTenantName(comp.memberId) }}</strong></td>
                  <td><span class="chip-room">{{ getComplaintRoomNumber(comp) }}</span></td>
                  <td>{{ comp.title }}</td>
                  <td>{{ comp.date }}</td>
                  <td>
                    <span 
                      class="status-badge"
                      :class="comp.status"
                    >
                      {{ comp.status === 'pending' ? 'Perlu Respon' : comp.status === 'in-progress' ? 'Diproses' : 'Selesai' }}
                    </span>
                  </td>
                  <td>
                    <button class="btn btn-ghost btn-xs" @click="openReplyModal(comp)">
                      <i class='bx bx-edit'></i> Respon
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- MOBILE CARD VIEW FOR DASHBOARD COMPLAINTS -->
          <div class="mobile-dash-complaint-cards">
            <div v-for="comp in complaints.slice(0, 5)" :key="'mob-' + comp.id" class="mobile-dash-comp-card">
              <div class="dash-comp-head">
                <div>
                  <strong>{{ getTenantName(comp.memberId) }}</strong>
                  <span class="chip-room ml-2">{{ getComplaintRoomNumber(comp) }}</span>
                </div>
                <span class="status-badge" :class="comp.status">
                  {{ comp.status === 'pending' ? 'Perlu Respon' : comp.status === 'in-progress' ? 'Diproses' : 'Selesai' }}
                </span>
              </div>
              <h4 class="dash-comp-title">{{ comp.title }}</h4>
              <div class="dash-comp-foot">
                <small class="text-muted"><i class='bx bx-calendar'></i> {{ comp.date }}</small>
                <button class="btn btn-ghost btn-xs" @click="openReplyModal(comp)">
                  <i class='bx bx-edit'></i> Respon
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Payments Summary -->
        <div class="dashboard-card">
          <div class="card-header">
            <h3><i class='bx bxs-credit-card'></i> Transaksi Pembayaran</h3>
            <span class="badge-count">{{ payments.length }} Transaksi</span>
          </div>

          <div class="payments-widget-list">
            <div v-for="pay in payments.slice(0, 4)" :key="pay.id" class="payment-widget-item">
              <div class="pay-icon"><i class='bx bx-receipt'></i></div>
              <div class="pay-info">
                <h4>{{ getTenantName(pay.memberId) }}</h4>
                <p>Periode: {{ pay.period }} ({{ pay.method }})</p>
                <small>{{ pay.date }}</small>
              </div>
              <div class="pay-amount">
                <strong>{{ formatRupiah(pay.amount) }}</strong>
                <span class="pay-status paid">Lunas</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- COMPLAINT REPLY MODAL -->
    <div v-if="selectedComplaint" class="modal-backdrop" @click.self="closeReplyModal">
      <div class="modal-box">
        <button class="modal-close" @click="closeReplyModal"><i class='bx bx-x'></i></button>

        <div class="modal-header">
          <h2>Tanggapi Keluhan — {{ getComplaintRoomNumber(selectedComplaint) }}</h2>
          <p>Penyewa: <strong>{{ getTenantName(selectedComplaint.memberId) }}</strong> · {{ selectedComplaint.title }}</p>
        </div>

        <div class="complaint-detail-box mb-4">
          <label class="form-label">Isi Keluhan Penyewa:</label>
          <p class="complaint-desc-text">"{{ selectedComplaint.description }}"</p>
        </div>

        <div class="form-group mb-3">
          <label>Status Penanganan</label>
          <select v-model="replyStatus" class="form-control">
            <option value="pending">Perlu Respon (Pending)</option>
            <option value="in-progress">Dalam Proses (In Progress)</option>
            <option value="resolved">Selesai Ditangani (Resolved)</option>
          </select>
        </div>

        <div class="form-group mb-4">
          <label>Tanggapan / Respon Pengelola</label>
          <textarea 
            v-model="replyText" 
            rows="3" 
            class="form-control" 
            placeholder="Tuliskan tanggapan untuk penyewa..."
          ></textarea>
        </div>

        <div class="modal-footer">
          <button class="btn btn-ghost" @click="closeReplyModal">Batal</button>
          <button class="btn btn-primary" @click="saveReply">Simpan Tanggapan</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-page, .admin-layout {
  display: flex;
  min-height: 100vh;
  background: var(--off-white);
}

.admin-main {
  flex: 1;
  margin-left: 260px;
  padding: 32px;
  transition: margin var(--transition-smooth);
}

.admin-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32px;
  flex-wrap: wrap;
  gap: 16px;
}

.header-tag {
  display: inline-block;
  padding: 4px 12px;
  background: var(--tertiary);
  color: var(--primary);
  font-size: 0.75rem;
  font-weight: 700;
  border-radius: var(--radius-full);
  margin-bottom: 6px;
}

.admin-header h1 {
  font-size: 2rem;
  color: var(--dark);
  margin-bottom: 4px;
}

.admin-header p {
  color: var(--text-muted);
  font-size: 0.92rem;
}

/* 1. KPI GRID */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 32px;
}

.kpi-card {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  padding: 24px;
  display: flex;
  align-items: flex-start;
  gap: 16px;
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-smooth);
}

.kpi-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
  border-color: var(--secondary);
}

.kpi-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.6rem;
  flex-shrink: 0;
}

.icon-tenants {
  background: var(--tertiary);
  color: var(--primary);
}

.icon-rooms {
  background: #E0F2FE;
  color: #0369A1;
}

.icon-revenue {
  background: #DCFCE7;
  color: #15803D;
}

.icon-complaints {
  background: #FEE2E2;
  color: #B91C1C;
}

.kpi-info small {
  display: block;
  font-size: 0.78rem;
  color: var(--text-muted);
  margin-bottom: 4px;
}

.kpi-value {
  font-family: var(--font-heading);
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--dark);
  display: block;
  line-height: 1.2;
}

.kpi-value .unit {
  font-size: 0.85rem;
  font-weight: 400;
  color: var(--text-muted);
}

.kpi-subtext {
  display: block;
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: 6px;
}

/* 2. DASHBOARD CONTENT GRID */
.dashboard-columns, .dashboard-content-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
  margin-bottom: 24px;
}

.left-dash-column {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.dashboard-card {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  padding: 28px;
  box-shadow: var(--shadow-sm);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.unified-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.header-title-box {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-icon {
  width: 42px;
  height: 42px;
  border-radius: var(--radius-lg);
  background: var(--tertiary);
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  flex-shrink: 0;
}

.header-title-box h3 {
  font-size: 1.15rem;
  color: var(--dark);
  font-weight: 700;
  margin-bottom: 2px;
}

.header-title-box p {
  font-size: 0.82rem;
  color: var(--text-muted);
}

.header-action-btn {
  white-space: nowrap;
}

/* SUMMARY METRICS BAR */
.summary-metric-bar {
  display: flex;
  align-items: center;
  justify-content: space-around;
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: var(--radius-lg);
  padding: 16px;
  margin-bottom: 16px;
}

.metric-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.metric-label {
  font-size: 0.74rem;
  color: var(--text-muted);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.metric-val {
  font-family: var(--font-heading);
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--dark);
}

.metric-val small {
  font-size: 0.82rem;
  font-weight: 500;
}

.text-amber {
  color: #D97706;
}

.text-emerald {
  color: #059669;
}

.metric-divider {
  width: 1px;
  height: 36px;
  background: #E2E8F0;
}

/* OCCUPANCY PROGRESS BOX */
.occupancy-progress-box {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 12px 16px;
  margin-bottom: 16px;
}

.progress-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
  font-size: 0.8rem;
}

.progress-info small {
  color: var(--text-muted);
  font-weight: 600;
}

.progress-info strong {
  color: var(--primary);
}

.progress-track-bg {
  width: 100%;
  height: 8px;
  background: #F1F5F9;
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-fill-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--primary) 0%, var(--secondary) 100%);
  border-radius: var(--radius-full);
  transition: width 0.6s ease;
}

/* CHIPS ROW */
.summary-chips-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-bottom: 18px;
  margin-bottom: 20px;
  border-bottom: 1px dashed var(--border);
}

.chips-group {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.chips-group-title {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--dark);
  min-width: 60px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.chip-item {
  font-size: 0.76rem;
  padding: 3px 10px;
  background: #F1F5F9;
  border-radius: var(--radius-md);
  color: var(--text-muted);
}

.chip-item strong {
  color: var(--dark);
}

/* NOTIFICATION CONTAINER */
.notif-section-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.notif-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 1rem;
  color: var(--dark);
}

.section-title i {
  font-size: 1.2rem;
}

.notif-count-badge {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 3px 10px;
  background: #FEF3C7;
  color: #B45309;
  border-radius: var(--radius-full);
}

.clean-notif-table {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.clean-notif-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 10px 14px;
  background: var(--off-white);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  transition: all var(--transition-fast);
}

.clean-notif-row:hover {
  background: var(--white);
  border-color: var(--secondary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.row-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.room-pill-tag {
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 0.8rem;
  padding: 4px 10px;
  border-radius: var(--radius-md);
  flex-shrink: 0;
}

.room-pill-tag.reminder {
  background: #FEF3C7;
  color: #B45309;
  border: 1px solid #FDE68A;
}

.room-pill-tag.billing {
  background: #FEE2E2;
  color: #B91C1C;
  border: 1px solid #FCA5A5;
}

.tenant-meta {
  display: flex;
  align-items: center;
  gap: 6px;
}

.t-name {
  font-size: 0.88rem;
  color: var(--dark);
}

.t-bld {
  font-size: 0.78rem;
  color: var(--text-muted);
}

.row-middle {
  flex: 1;
  text-align: right;
  padding-right: 12px;
}

.due-badge {
  font-size: 0.78rem;
  color: var(--text-muted);
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.due-badge strong {
  color: var(--dark);
}

.row-right {
  flex-shrink: 0;
}

.link-detail-btn {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--primary);
  display: inline-flex;
  align-items: center;
  gap: 2px;
  transition: all var(--transition-fast);
}

.link-detail-btn:hover {
  color: var(--primary-dark);
  transform: translateX(2px);
}

/* TENANTS WIDGET */
.tenant-widget-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tenant-widget-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--off-white);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
}

.tenant-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.85rem;
  flex-shrink: 0;
}

.tenant-widget-info {
  flex: 1;
  overflow: hidden;
}

.tenant-widget-info h4 {
  font-size: 0.9rem;
  margin-bottom: 2px;
  color: var(--dark);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tenant-widget-info p {
  font-size: 0.78rem;
  color: var(--text-muted);
}

.tenant-phone {
  font-size: 0.72rem;
  color: var(--primary);
  display: flex;
  align-items: center;
  gap: 4px;
}

.tenant-status-pill {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: var(--radius-full);
}

.tenant-status-pill.aktif {
  background: #DCFCE7;
  color: #15803D;
}

.tenant-status-pill.hampir-habis {
  background: #FEF3C7;
  color: #B45309;
}

/* TABLES & PAYMENTS */
.table-responsive {
  overflow-x: auto;
}

.admin-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.88rem;
}

.admin-table th,
.admin-table td {
  padding: 12px 14px;
  text-align: left;
  border-bottom: 1px solid var(--border);
}

.admin-table th {
  background: var(--off-white);
  color: var(--text-muted);
  font-weight: 600;
  font-size: 0.78rem;
  text-transform: uppercase;
}

.chip-room {
  padding: 3px 8px;
  background: var(--tertiary);
  color: var(--primary);
  border-radius: var(--radius-md);
  font-weight: 700;
  font-size: 0.78rem;
}

.status-badge {
  padding: 3px 10px;
  border-radius: var(--radius-full);
  font-size: 0.72rem;
  font-weight: 700;
}

.status-badge.pending {
  background: #FEE2E2;
  color: #B91C1C;
}

.status-badge.in-progress {
  background: #FEF3C7;
  color: #B45309;
}

.status-badge.resolved {
  background: #DCFCE7;
  color: #15803D;
}

.btn-xs {
  padding: 4px 10px;
  font-size: 0.75rem;
}

/* PAYMENTS WIDGET */
.payments-widget-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.payment-widget-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--off-white);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
}

.pay-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  background: var(--tertiary);
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  flex-shrink: 0;
}

.pay-info {
  flex: 1;
}

.pay-info h4 {
  font-size: 0.88rem;
  margin-bottom: 2px;
  color: var(--dark);
}

.pay-info p {
  font-size: 0.78rem;
  color: var(--text-muted);
}

.pay-info small {
  font-size: 0.72rem;
  color: var(--text-muted);
}

.pay-amount {
  text-align: right;
}

.pay-amount strong {
  display: block;
  font-size: 0.9rem;
  color: var(--primary);
}

.pay-status {
  font-size: 0.7rem;
  font-weight: 700;
  color: #15803D;
}

/* MODAL STYLES */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.modal-box {
  background: var(--white);
  border-radius: var(--radius-xl);
  max-width: 520px;
  width: 100%;
  padding: 32px;
  position: relative;
  box-shadow: var(--shadow-xl);
}

.modal-close {
  position: absolute;
  top: 16px;
  right: 16px;
  border: none;
  background: var(--off-white);
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.complaint-detail-box {
  background: var(--off-white);
  padding: 14px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
}

.form-label {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--dark);
  display: block;
  margin-bottom: 4px;
}

.complaint-desc-text {
  font-size: 0.88rem;
  color: var(--text-muted);
  font-style: italic;
}

.form-control {
  width: 100%;
  padding: 10px 14px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  font-family: var(--font-body);
  font-size: 0.9rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* RESPONSIVE MEDIA QUERIES */
@media (max-width: 1200px) {
  .dashboard-columns {
    grid-template-columns: 1fr;
  }
  .kpi-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .dashboard-content-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 992px) {
  .admin-main {
    margin-left: 0;
    padding: 20px;
  }
}

.mobile-dash-complaint-cards {
  display: none;
  flex-direction: column;
  gap: 12px;
}

.mobile-dash-comp-card {
  background: var(--off-white);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dash-comp-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.dash-comp-title {
  font-size: 0.92rem;
  font-weight: 600;
  color: var(--dark);
}

.dash-comp-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 6px;
  border-top: 1px dashed var(--border);
}

.ml-2 {
  margin-left: 6px;
}

@media (max-width: 768px) {
  .summary-metric-bar {
    flex-direction: column;
    gap: 12px;
  }
  .metric-divider {
    width: 100%;
    height: 1px;
  }
  .clean-notif-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  .row-middle {
    text-align: left;
    padding-right: 0;
  }
  .admin-main {
    padding: 16px;
  }
  .admin-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 20px;
  }
  .admin-title-area h1 {
    font-size: 1.4rem;
  }
  .header-actions {
    width: 100%;
    justify-content: flex-start;
    flex-wrap: wrap;
  }
  .dashboard-card {
    padding: 18px 14px;
  }
  .modal-box {
    max-width: 92vw;
    max-height: 90vh;
    overflow-y: auto;
    padding: 24px 16px;
  }
  .modal-footer {
    flex-direction: column;
  }
  .modal-footer button {
    width: 100%;
  }
  .admin-table {
    display: none;
  }
  .mobile-dash-complaint-cards {
    display: flex;
  }
}

@media (max-width: 600px) {
  .kpi-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .admin-main { padding: 12px; }
  .admin-title-area h1 { font-size: 1.2rem; }
  .admin-title-area p { font-size: 0.78rem; }
  .kpi-card { padding: 14px 12px; border-radius: var(--radius-md); }
  .kpi-val { font-size: 1.4rem; }
  .dashboard-card { padding: 14px 12px; border-radius: var(--radius-md); }
  .modal-box { max-width: 96vw; padding: 20px 12px; border-radius: var(--radius-lg); }
}
</style>
