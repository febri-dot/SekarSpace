<script setup lang="ts">
import { ref, computed } from 'vue'
import AdminSidebar from '../../components/layout/AdminSidebar.vue'
import { useAuth } from '../../composables/useAuth'
import { useDataStore, type RoomTransferRequest } from '../../composables/useDataStore'

const { getTenantById } = useAuth()
const {
  roomTransfers,
  rooms,
  getRoomById,
  getBuildingName,
  approveRoomTransferRequest,
  rejectRoomTransferRequest
} = useDataStore()

const statusFilter = ref<'all' | 'pending' | 'approved' | 'rejected'>('all')
const searchQuery = ref('')
const toastMessage = ref<{ type: 'success' | 'error'; text: string } | null>(null)

// Action Modals State
const isConfirmModalOpen = ref(false)
const isRejectModalOpen = ref(false)
const selectedTransfer = ref<RoomTransferRequest | null>(null)
const adminNotesInput = ref('')

const showToast = (type: 'success' | 'error', text: string) => {
  toastMessage.value = { type, text }
  setTimeout(() => {
    toastMessage.value = null
  }, 4000)
}

const stats = computed(() => {
  const total = roomTransfers.value.length
  const pending = roomTransfers.value.filter(t => t.status === 'pending').length
  const approved = roomTransfers.value.filter(t => t.status === 'approved').length
  const rejected = roomTransfers.value.filter(t => t.status === 'rejected' || t.status === 'cancelled').length
  return { total, pending, approved, rejected }
})

const filteredTransfers = computed(() => {
  return roomTransfers.value.filter(t => {
    const matchStatus = statusFilter.value === 'all' || t.status === statusFilter.value
    if (!matchStatus) return false

    if (!searchQuery.value) return true
    const q = searchQuery.value.toLowerCase()
    const tenant = getTenantById(t.memberId)
    const oldRoom = getRoomById(t.currentRoomId)
    const newRoom = getRoomById(t.targetRoomId)

    return (
      t.id.toLowerCase().includes(q) ||
      (tenant?.name && tenant.name.toLowerCase().includes(q)) ||
      (oldRoom?.number && oldRoom.number.toLowerCase().includes(q)) ||
      (newRoom?.number && newRoom.number.toLowerCase().includes(q)) ||
      (t.reason && t.reason.toLowerCase().includes(q))
    )
  })
})

const openApproveModal = (transfer: RoomTransferRequest) => {
  selectedTransfer.value = transfer
  adminNotesInput.value = ''
  isConfirmModalOpen.value = true
}

const openRejectModal = (transfer: RoomTransferRequest) => {
  selectedTransfer.value = transfer
  adminNotesInput.value = ''
  isRejectModalOpen.value = true
}

const handleApprove = () => {
  if (!selectedTransfer.value) return
  const res = approveRoomTransferRequest(selectedTransfer.value.id, adminNotesInput.value)
  if (res.success) {
    showToast('success', res.message)
    isConfirmModalOpen.value = false
  } else {
    showToast('error', res.message)
  }
}

const handleReject = () => {
  if (!selectedTransfer.value) return
  const res = rejectRoomTransferRequest(selectedTransfer.value.id, adminNotesInput.value)
  if (res.success) {
    showToast('success', res.message)
    isRejectModalOpen.value = false
  } else {
    showToast('error', res.message)
  }
}

const formatDateIndo = (dateStr?: string) => {
  if (!dateStr) return '-'
  const parts = dateStr.split('-')
  if (parts.length !== 3) return dateStr
  const [y, m, d] = parts
  const monthsIndo = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des']
  const mi = parseInt(m || '1', 10) - 1
  return `${parseInt(d || '1', 10)} ${monthsIndo[mi]} ${y}`
}
</script>

<template>
  <div class="admin-page">
    <AdminSidebar />

    <main class="admin-main">
      <!-- HEADER -->
      <header class="admin-header">
        <div>
          <span class="header-tag">Manajemen Hunian</span>
          <h1>Permohonan <span class="text-gradient">Pindah Kamar</span></h1>
          <p>Tinjau dan setujui pengajuan pindah kamar penyewa. Status kamar otomatis dialihkan saat disetujui.</p>
        </div>
      </header>

      <!-- TOAST NOTIFICATION -->
      <div v-if="toastMessage" class="toast-alert" :class="toastMessage.type">
        <i :class="toastMessage.type === 'success' ? 'bx bx-check-circle' : 'bx bx-error-circle'"></i>
        <span>{{ toastMessage.text }}</span>
      </div>

      <!-- STATS METRICS -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon icon-pending"><i class='bx bx-time-five'></i></div>
          <div class="stat-info">
            <span>Menunggu Konfirmasi</span>
            <h3>{{ stats.pending }}</h3>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon icon-approved"><i class='bx bx-check-circle'></i></div>
          <div class="stat-info">
            <span>Disetujui</span>
            <h3>{{ stats.approved }}</h3>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon icon-rejected"><i class='bx bx-x-circle'></i></div>
          <div class="stat-info">
            <span>Ditolak / Dibatalkan</span>
            <h3>{{ stats.rejected }}</h3>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon icon-total"><i class='bx bx-transfer-alt'></i></div>
          <div class="stat-info">
            <span>Total Permohonan</span>
            <h3>{{ stats.total }}</h3>
          </div>
        </div>
      </div>

      <!-- CONTROLS & FILTER -->
      <div class="controls-bar">
        <div class="filter-tabs">
          <button 
            class="tab-btn" 
            :class="{ active: statusFilter === 'all' }" 
            @click="statusFilter = 'all'"
          >
            Semua ({{ stats.total }})
          </button>
          <button 
            class="tab-btn" 
            :class="{ active: statusFilter === 'pending' }" 
            @click="statusFilter = 'pending'"
          >
            Menunggu ({{ stats.pending }})
          </button>
          <button 
            class="tab-btn" 
            :class="{ active: statusFilter === 'approved' }" 
            @click="statusFilter = 'approved'"
          >
            Disetujui ({{ stats.approved }})
          </button>
          <button 
            class="tab-btn" 
            :class="{ active: statusFilter === 'rejected' }" 
            @click="statusFilter = 'rejected'"
          >
            Ditolak ({{ stats.rejected }})
          </button>
        </div>

        <div class="search-box">
          <i class='bx bx-search'></i>
          <input 
            type="text" 
            v-model="searchQuery" 
            placeholder="Cari nama penyewa, no kamar, tiket..." 
            class="search-input"
          />
        </div>
      </div>

      <!-- TRANSFERS TABLE -->
      <div class="table-card">
        <div v-if="filteredTransfers.length === 0" class="empty-state">
          <i class='bx bx-transfer-alt empty-icon'></i>
          <h3>Tidak Ada Data Pengajuan</h3>
          <p>Belum ada pengajuan pindah kamar yang sesuai dengan filter yang dipilih.</p>
        </div>

        <div v-else class="table-responsive">
          <table class="admin-table">
            <thead>
              <tr>
                <th>No. Tiket & Tgl</th>
                <th>Penyewa</th>
                <th>Kamar Asal</th>
                <th>Kamar Tujuan</th>
                <th>Alasan Pindah</th>
                <th>Status</th>
                <th class="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="t in filteredTransfers" :key="t.id">
                <td>
                  <strong>{{ t.id }}</strong>
                  <span class="sub-text">{{ formatDateIndo(t.requestDate) }}</span>
                </td>
                <td>
                  <div class="tenant-cell">
                    <strong>{{ getTenantById(t.memberId)?.name || 'Penyewa' }}</strong>
                    <span class="sub-text">{{ getTenantById(t.memberId)?.phone || '-' }}</span>
                  </div>
                </td>
                <td>
                  <div class="room-pill origin">
                    <i class='bx bx-door-open'></i>
                    <span>Kamar {{ getRoomById(t.currentRoomId)?.number || t.currentRoomId }}</span>
                  </div>
                  <span class="sub-text">{{ getRoomById(t.currentRoomId)?.typeName }} · {{ getBuildingName(getRoomById(t.currentRoomId)?.buildingId || '') }}</span>
                </td>
                <td>
                  <div class="room-pill target">
                    <i class='bx bx-log-in-circle'></i>
                    <span>Kamar {{ getRoomById(t.targetRoomId)?.number || t.targetRoomId }}</span>
                  </div>
                  <span class="sub-text">{{ getRoomById(t.targetRoomId)?.typeName }} · {{ getBuildingName(getRoomById(t.targetRoomId)?.buildingId || '') }}</span>
                </td>
                <td>
                  <span class="reason-text">{{ t.reason || 'Tanpa keterangan khusus' }}</span>
                </td>
                <td>
                  <span v-if="t.status === 'pending'" class="status-badge badge-pending">
                    <i class='bx bx-time-five'></i> Menunggu
                  </span>
                  <span v-else-if="t.status === 'approved'" class="status-badge badge-approved">
                    <i class='bx bx-check-circle'></i> Disetujui
                  </span>
                  <span v-else-if="t.status === 'rejected'" class="status-badge badge-rejected">
                    <i class='bx bx-x-circle'></i> Ditolak
                  </span>
                  <span v-else class="status-badge badge-cancelled">
                    <i class='bx bx-block'></i> Dibatalkan
                  </span>
                </td>
                <td class="text-right">
                  <div v-if="t.status === 'pending'" class="action-buttons">
                    <button class="btn btn-sm btn-approve" @click="openApproveModal(t)" title="Setujui Pengajuan">
                      <i class='bx bx-check'></i> Setujui
                    </button>
                    <button class="btn btn-sm btn-reject" @click="openRejectModal(t)" title="Tolak Pengajuan">
                      <i class='bx bx-x'></i> Tolak
                    </button>
                  </div>
                  <span v-else class="action-done-text">
                    {{ t.actionDate ? formatDateIndo(t.actionDate) : '-' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>

    <!-- MODAL SETUJUI -->
    <div v-if="isConfirmModalOpen && selectedTransfer" class="modal-backdrop" @click.self="isConfirmModalOpen = false">
      <div class="modal-box">
        <button class="modal-close" @click="isConfirmModalOpen = false"><i class='bx bx-x'></i></button>
        <div class="modal-header">
          <div class="modal-icon icon-success-lg"><i class='bx bx-check-circle'></i></div>
          <h3>Konfirmasi Setujui Pindah Kamar</h3>
          <p>Apakah Anda yakin ingin menyetujui pengajuan pindah kamar ini?</p>
        </div>

        <div class="modal-summary">
          <div class="summary-row">
            <span>Penyewa:</span>
            <strong>{{ getTenantById(selectedTransfer.memberId)?.name }}</strong>
          </div>
          <div class="summary-row">
            <span>Kamar Asal:</span>
            <strong>Kamar {{ getRoomById(selectedTransfer.currentRoomId)?.number }} (Akan Dikosongkan)</strong>
          </div>
          <div class="summary-row">
            <span>Kamar Tujuan:</span>
            <strong class="text-success">Kamar {{ getRoomById(selectedTransfer.targetRoomId)?.number }} (Akan Ditempati)</strong>
          </div>
        </div>

        <div class="form-group mb-3">
          <label>Catatan Admin (Opsional)</label>
          <input type="text" v-model="adminNotesInput" class="form-control" placeholder="Contoh: Kunci kamar baru sudah diserahkan" />
        </div>

        <div class="modal-actions">
          <button class="btn btn-outline" @click="isConfirmModalOpen = false">Batal</button>
          <button class="btn btn-success" @click="handleApprove">
            <i class='bx bx-check'></i> Ya, Setujui & Update Sistem
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL TOLAK -->
    <div v-if="isRejectModalOpen && selectedTransfer" class="modal-backdrop" @click.self="isRejectModalOpen = false">
      <div class="modal-box">
        <button class="modal-close" @click="isRejectModalOpen = false"><i class='bx bx-x'></i></button>
        <div class="modal-header">
          <div class="modal-icon icon-danger-lg"><i class='bx bx-x-circle'></i></div>
          <h3>Tolak Pengajuan Pindah Kamar</h3>
          <p>Berikan alasan penolakan agar penyewa mengetahui informasi pembatalan.</p>
        </div>

        <div class="form-group mb-3">
          <label>Alasan Penolakan <span class="required-star">*</span></label>
          <textarea v-model="adminNotesInput" rows="3" class="form-control" placeholder="Contoh: Kamar tujuan sedang dilakukan perbaikan fasilitas..."></textarea>
        </div>

        <div class="modal-actions">
          <button class="btn btn-outline" @click="isRejectModalOpen = false">Batal</button>
          <button class="btn btn-danger" @click="handleReject">
            <i class='bx bx-x'></i> Tolak Pengajuan
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-page {
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
  margin-bottom: 24px;
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
  font-size: 1.75rem;
  color: var(--dark);
}

.toast-alert {
  padding: 12px 18px;
  border-radius: var(--radius-md);
  margin-bottom: 20px;
  font-size: 0.88rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.toast-alert.success {
  background: #DCFCE7;
  color: #16A34A;
  border: 1px solid #BBF7D0;
}

.toast-alert.error {
  background: #FEE2E2;
  color: #DC2626;
  border: 1px solid #FECACA;
}

/* STATS */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: var(--white);
  padding: 18px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: var(--shadow-sm);
}

.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
}

.icon-pending { background: #FEF3C7; color: #D97706; }
.icon-approved { background: #DCFCE7; color: #16A34A; }
.icon-rejected { background: #FEE2E2; color: #DC2626; }
.icon-total { background: var(--tertiary); color: var(--primary); }

.stat-info span {
  font-size: 0.78rem;
  color: var(--text-muted);
  display: block;
}

.stat-info h3 {
  font-size: 1.35rem;
  color: var(--dark);
  font-weight: 700;
}

/* CONTROLS */
.controls-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.filter-tabs {
  display: flex;
  background: var(--white);
  padding: 4px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  gap: 4px;
}

.tab-btn {
  background: none;
  border: none;
  padding: 6px 14px;
  border-radius: var(--radius-sm);
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-btn.active {
  background: var(--primary);
  color: white;
}

.search-box {
  position: relative;
  min-width: 260px;
}

.search-box i {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
}

.search-input {
  width: 100%;
  padding: 8px 12px 8px 36px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  font-size: 0.85rem;
  background: var(--white);
}

/* TABLE */
.table-card {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.table-responsive {
  overflow-x: auto;
}

.admin-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.admin-table th {
  background: var(--off-white);
  padding: 12px 16px;
  font-size: 0.8rem;
  color: var(--text-muted);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid var(--border);
}

.admin-table td {
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
  font-size: 0.88rem;
  vertical-align: middle;
}

.tenant-cell {
  display: flex;
  flex-direction: column;
}

.sub-text {
  display: block;
  font-size: 0.76rem;
  color: var(--text-muted);
  margin-top: 2px;
}

.room-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
  font-size: 0.82rem;
  padding: 4px 10px;
  border-radius: var(--radius-sm);
}

.room-pill.origin {
  background: #F1F5F9;
  color: #475569;
}

.room-pill.target {
  background: #EFF6FF;
  color: #1D4ED8;
  border: 1px solid #BFDBFE;
}

.reason-text {
  font-size: 0.82rem;
  color: #475569;
  max-width: 220px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 700;
}

.badge-pending { background: #FEF3C7; color: #D97706; }
.badge-approved { background: #DCFCE7; color: #16A34A; }
.badge-rejected { background: #FEE2E2; color: #DC2626; }
.badge-cancelled { background: #F1F5F9; color: #64748B; }

.action-buttons {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
}

.btn-approve {
  background: #16A34A;
  color: white;
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  font-size: 0.78rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.btn-approve:hover { background: #15803D; }

.btn-reject {
  background: white;
  color: #DC2626;
  border: 1px solid #FCA5A5;
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.btn-reject:hover { background: #FEF2F2; }

.action-done-text {
  font-size: 0.78rem;
  color: var(--text-muted);
}

.empty-state {
  text-align: center;
  padding: 48px 24px;
  color: var(--text-muted);
}

.empty-icon {
  font-size: 3rem;
  color: #CBD5E1;
  margin-bottom: 10px;
}

/* MODAL */
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
  max-width: 480px;
  width: 100%;
  padding: 28px;
  position: relative;
  box-shadow: var(--shadow-lg);
}

.modal-close {
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-muted);
}

.modal-header {
  text-align: center;
  margin-bottom: 20px;
}

.modal-icon {
  width: 52px;
  height: 52px;
  border-radius: var(--radius-full);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  margin-bottom: 10px;
}

.icon-success-lg { background: #DCFCE7; color: #16A34A; }
.icon-danger-lg { background: #FEE2E2; color: #DC2626; }

.modal-summary {
  background: var(--off-white);
  padding: 14px;
  border-radius: var(--radius-md);
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 0.85rem;
}

.summary-row {
  display: flex;
  justify-content: space-between;
}

.summary-row span { color: var(--text-muted); }
.text-success { color: #16A34A; }

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
}

.form-group label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--dark);
  display: block;
}

.form-control {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #CBD5E1;
  border-radius: var(--radius-md);
  font-family: inherit;
  font-size: 0.88rem;
  background: var(--white);
  color: var(--dark);
  outline: none;
  box-sizing: border-box;
  display: block;
  transition: all 0.2s ease;
}

.form-control:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.12);
}

textarea.form-control {
  resize: vertical;
  min-height: 75px;
  line-height: 1.45;
}

.required-star {
  color: #DC2626;
  font-weight: bold;
}

.mb-3 {
  margin-bottom: 16px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 18px;
}

.btn-success {
  background: #16A34A;
  color: white;
  border: none;
}
.btn-success:hover { background: #15803D; }

.btn-danger {
  background: #DC2626;
  color: white;
  border: none;
}
.btn-danger:hover { background: #B91C1C; }

@media (max-width: 992px) {
  .admin-main { margin-left: 0; padding: 20px; }
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 768px) {
  .admin-main { padding: 16px; }
  .stats-grid { grid-template-columns: 1fr; }
}
</style>
