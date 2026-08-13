<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'
import AdminSidebar from '../../components/layout/AdminSidebar.vue'
import { useDataStore, type RoomData, type ComplaintData } from '../../composables/useDataStore'
import defaultUsers from '../../data/users.json'

const { rooms, complaints, payments, bookRoom, updateComplaintResponse } = useDataStore()

// State
const memberTenants = ref(defaultUsers.filter(u => u.role === 'member'))

// KPI Calculations
const totalTenantsCount = computed(() => memberTenants.value.length)
const totalRoomsCount = computed(() => rooms.value.length)
const occupiedRoomsCount = computed(() => rooms.value.filter(r => r.status === 'occupied').length)
const availableRoomsCount = computed(() => rooms.value.filter(r => r.status === 'available').length)
const occupancyRate = computed(() => Math.round((occupiedRoomsCount.value / totalRoomsCount.value) * 100))

const totalMonthlyRevenue = computed(() => {
  return memberTenants.value.reduce((acc, tenant) => acc + (tenant.monthlyRent || 700000), 0)
})

const pendingComplaintsCount = computed(() => {
  return complaints.value.filter(c => c.status === 'pending' || c.status === 'in-progress').length
})

// Toggle Room Occupancy Status Quick Action
const toggleRoomStatus = (room: RoomData) => {
  if (room.status === 'available') {
    room.status = 'occupied'
  } else {
    room.status = 'available'
  }
}

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
  <div class="admin-layout">
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

      <!-- 2. QUICK ACTIONS & ROOM OCCUPANCY VISUAL GRID -->
      <div class="dashboard-content-grid">
        <!-- Room Occupancy Layout Grid -->
        <div class="dashboard-card room-status-panel">
          <div class="card-header">
            <div>
              <h3><i class='bx bxs-grid-alt'></i> Status Hunian Kamar Kost</h3>
              <p>Klik tombol status pada kamar untuk mengubah status ketersediaan (*Tersedia* / *Terisi*).</p>
            </div>
            <span class="badge-count">{{ rooms.length }} Kamar Total</span>
          </div>

          <div class="admin-room-grid">
            <div 
              v-for="room in rooms" 
              :key="room.id"
              class="admin-room-node"
              :class="room.status"
            >
              <div class="node-top">
                <span class="room-num">No. {{ room.number }}</span>
                <span class="bld-tag">{{ room.buildingName }}</span>
              </div>
              <div class="node-type-info">
                <i :class="room.typeId === 'km-dalam' ? 'bx bx-bath' : 'bx bx-door-open'"></i>
                <span>{{ room.typeName }} (Lantai {{ room.floor }})</span>
              </div>
              <div class="node-price">{{ formatRupiah(room.price) }}/bln</div>
              
              <div class="node-actions">
                <button 
                  class="status-toggle-btn"
                  :class="room.status === 'available' ? 'btn-status-avail' : 'btn-status-occ'"
                  @click="toggleRoomStatus(room)"
                >
                  <i :class="room.status === 'available' ? 'bx bx-check-circle' : 'bx bx-lock-alt'"></i>
                  <span>{{ room.status === 'available' ? 'Tersedia (Klik Ubah)' : 'Terisi (Klik Ubah)' }}</span>
                </button>
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
                <p>{{ tenant.roomNumber }} · {{ tenant.building }}</p>
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
                  <td><strong>{{ comp.tenantName }}</strong></td>
                  <td><span class="chip-room">{{ comp.roomNumber }}</span></td>
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
                  <strong>{{ comp.tenantName }}</strong>
                  <span class="chip-room ml-2">{{ comp.roomNumber }}</span>
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
                <h4>{{ pay.tenantName }}</h4>
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
          <h2>Tanggapi Keluhan — {{ selectedComplaint.roomNumber }}</h2>
          <p>Penyewa: <strong>{{ selectedComplaint.tenantName }}</strong> · {{ selectedComplaint.title }}</p>
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
.admin-layout {
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
.dashboard-content-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
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

.card-header h3 {
  font-size: 1.2rem;
  color: var(--dark);
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-header h3 i {
  color: var(--primary);
}

.card-header p {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.badge-count {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 4px 12px;
  background: var(--tertiary);
  color: var(--primary);
  border-radius: var(--radius-full);
}

.view-all-link {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--primary);
}

/* ADMIN ROOM GRID */
.admin-room-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.admin-room-node {
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 16px;
  background: var(--off-white);
  transition: all var(--transition-base);
}

.admin-room-node.available {
  border-color: #BBF7D0;
  background: #F0FDF4;
}

.admin-room-node.occupied {
  border-color: #FECACA;
  background: #FEF2F2;
}

.node-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.room-num {
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 1.05rem;
  color: var(--dark);
}

.bld-tag {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: var(--radius-md);
  background: rgba(0,0,0,0.06);
}

.node-type-info {
  font-size: 0.8rem;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 6px;
}

.node-price {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--primary);
  margin-bottom: 12px;
}

.status-toggle-btn {
  width: 100%;
  padding: 6px;
  border-radius: var(--radius-md);
  border: none;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  transition: all var(--transition-fast);
}

.btn-status-avail {
  background: #DCFCE7;
  color: #15803D;
}

.btn-status-avail:hover {
  background: #16A34A;
  color: white;
}

.btn-status-occ {
  background: #FEE2E2;
  color: #B91C1C;
}

.btn-status-occ:hover {
  background: #DC2626;
  color: white;
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
  border-radius: var(--radius-md);
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
  border-radius: var(--radius-md);
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
}

.pay-info {
  flex: 1;
}

.pay-info h4 {
  font-size: 0.88rem;
  margin-bottom: 2px;
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
}

@media (max-width: 600px) {
  .kpi-grid {
    grid-template-columns: 1fr;
  }
  .admin-room-grid {
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
