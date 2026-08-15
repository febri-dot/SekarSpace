<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import AdminSidebar from '../../components/layout/AdminSidebar.vue'
import { useAuth } from '../../composables/useAuth'
import { useDataStore } from '../../composables/useDataStore'

const route = useRoute()
const { getTenantById, updateMember } = useAuth()
const { rooms, getRoomById, getBuildingName, updateRoom } = useDataStore()

const tenantId = String(route.params.id)

const tenant = computed(() => {
  return getTenantById(tenantId) || {
    id: tenantId,
    name: 'Keyla Asyfa Zahra',
    username: 'keyla01',
    nik: '3401234567890001',
    address: 'Sleman, Yogyakarta',
    phone: '081234567890',
    birthDate: '2004-05-12',
    parentPhone: '081298765432',
    roomId: 'A-13',
    monthlyRent: 950000,
    durationMonths: 12,
    startDate: '2025-09-01',
    endDate: '2026-09-01',
    status: 'aktif'
  }
})

const room = computed(() => {
  const rId = tenant.value?.roomId || 'A-13'
  return getRoomById(rId)
})

const roomNumber = computed(() => room.value ? `Kamar ${room.value.number}` : 'Kamar A13')
const roomType = computed(() => room.value?.typeName || 'Kamar Mandi Dalam')
const buildingName = computed(() => room.value ? getBuildingName(room.value.buildingId) : 'Gedung A')

// Days remaining calculation
const daysRemaining = computed(() => {
  if (!tenant.value?.endDate) return 0
  const end = new Date(tenant.value.endDate).getTime()
  const now = new Date().getTime()
  const diff = end - now
  return diff > 0 ? Math.ceil(diff / (1000 * 60 * 60 * 24)) : 0
})

// Date format helper
const formatDateIndo = (dateStr?: string) => {
  if (!dateStr) return '-'
  const parts = dateStr.split('-')
  if (parts.length !== 3) return dateStr
  const monthsIndo = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
  const day = parseInt(parts[2], 10)
  const monthIdx = parseInt(parts[1], 10) - 1
  const year = parts[0]
  return `${day} ${monthsIndo[monthIdx] || ''} ${year}`
}

const formatRupiah = (val?: number) => {
  if (!val) return 'Rp 0'
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)
}

const getInitials = (name: string) => {
  if (!name) return 'PN'
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

// Helper computeEndDate
const computeEndDate = (startDateStr: string, months: number): string => {
  if (!startDateStr || !months) return ''
  const parts = startDateStr.split('-')
  if (parts.length !== 3) return ''
  const year = parseInt(parts[0], 10)
  const month = parseInt(parts[1], 10)
  const day = parseInt(parts[2], 10)
  if (isNaN(year) || isNaN(month) || isNaN(day)) return ''

  const targetDate = new Date(year, month - 1 + Number(months), day)
  const expectedMonth = (month - 1 + Number(months)) % 12
  const normalizedExpectedMonth = expectedMonth < 0 ? expectedMonth + 12 : expectedMonth
  if (targetDate.getMonth() !== normalizedExpectedMonth) {
    targetDate.setDate(0)
  }

  const yyyy = targetDate.getFullYear()
  const mm = String(targetDate.getMonth() + 1).padStart(2, '0')
  const dd = String(targetDate.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

// Edit Modal State
const isEditModalOpen = ref(false)
const noticeMessage = ref('')

const editForm = ref({
  roomId: 'A-13',
  monthlyRent: 950000,
  durationMonths: 12,
  startDate: '2025-09-01',
  endDate: '2026-09-01',
  status: 'aktif' as 'aktif' | 'hampir-habis' | 'non-aktif'
})

const onEditFormChange = () => {
  if (editForm.value.startDate && editForm.value.durationMonths) {
    editForm.value.endDate = computeEndDate(editForm.value.startDate, editForm.value.durationMonths)
  }
}

const openEditModal = () => {
  const dMonths = tenant.value.durationMonths || 12
  const sDate = tenant.value.startDate || '2025-09-01'
  const eDate = tenant.value.endDate || computeEndDate(sDate, dMonths)

  editForm.value = {
    roomId: tenant.value.roomId || 'A-13',
    monthlyRent: tenant.value.monthlyRent || 950000,
    durationMonths: dMonths,
    startDate: sDate,
    endDate: eDate,
    status: (tenant.value.status || 'aktif') as 'aktif' | 'hampir-habis' | 'non-aktif'
  }
  isEditModalOpen.value = true
}

const closeEditModal = () => {
  isEditModalOpen.value = false
}

const handleSaveTenantRoom = () => {
  const oldRoomId = tenant.value.roomId
  const newRoomId = editForm.value.roomId

  if (oldRoomId && oldRoomId !== newRoomId) {
    updateRoom(oldRoomId, { status: 'available' })
    updateRoom(newRoomId, { status: 'occupied' })
  }

  updateMember(tenant.value.id, {
    roomId: editForm.value.roomId,
    monthlyRent: Number(editForm.value.monthlyRent),
    durationMonths: Number(editForm.value.durationMonths),
    startDate: editForm.value.startDate,
    endDate: editForm.value.endDate,
    status: editForm.value.status
  })

  noticeMessage.value = 'Data kamar & sewa penyewa berhasil diperbarui!'
  closeEditModal()
  setTimeout(() => {
    noticeMessage.value = ''
  }, 4000)
}

const formatWaPhone = (phone?: string) => {
  if (!phone) return '62895378020456'
  let clean = phone.replace(/[^0-9]/g, '')
  if (!clean) return '62895378020456'
  if (clean.startsWith('0')) {
    clean = '62' + clean.slice(1)
  } else if (!clean.startsWith('62')) {
    clean = '62' + clean
  }
  return clean
}

// Generate WhatsApp Bill Link
const waBillUrl = computed(() => {
  const phone = formatWaPhone(tenant.value.phone)
  const formattedRent = formatRupiah(tenant.value.monthlyRent || 950000)
  
  const text = `Halo Kak ${tenant.value.name}, 👋

Berikut adalah rincian informasi sewa Kost Sekar Space Anda:
📌 Kamar: ${roomNumber.value} (${buildingName.value})
📌 Nominal Sewa: ${formattedRent} / bulan
📌 Periode Jatuh Tempo: s.d. ${formatDateIndo(tenant.value.endDate)}

Mohon lakukan pembayaran melalui rekening resmi Sekar Space:
• BCA: 1234 5678 90 (a.n. Sekar Space Kost)
• Mandiri: 9876 5432 10 (a.n. Sekar Space Kost)

Setelah transfer, mohon kirimkan konfirmasi atau upload bukti pembayaran di Portal Penyewa. Terima kasih! 🙏`

  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
})
</script>

<template>
  <div class="admin-page">
    <AdminSidebar />

    <main class="main-content">
      <!-- HEADER -->
      <header class="top-header">
        <div>
          <RouterLink to="/admin/tenants" class="back-link">
            <i class='bx bx-left-arrow-alt'></i> Kembali ke Daftar Penyewa
          </RouterLink>
          <h1>Detail Profil Penyewa</h1>
        </div>
        <div class="header-actions">
          <button class="btn btn-outline-primary" @click="openEditModal">
            <i class='bx bx-edit'></i> Edit Kamar & Sewa
          </button>
          <a :href="waBillUrl" target="_blank" rel="noopener" class="btn btn-whatsapp-bill">
            <i class='bx bxl-whatsapp'></i> Kirim Pesan / Tagihan WA
          </a>
        </div>
      </header>

      <div class="page-body">
        <div v-if="noticeMessage" class="alert-notice">
          <i class='bx bx-check-circle'></i> {{ noticeMessage }}
        </div>

        <!-- HERO PROFILE CARD BANNER -->
        <div class="profile-hero-card">
          <div class="hero-main-info">
            <div class="avatar-circle">{{ getInitials(tenant.name) }}</div>
            <div class="user-titles">
              <div class="user-tag-row">
                <span class="username-tag">@{{ tenant.username }}</span>
                <span class="status-pill" :class="tenant.status === 'aktif' ? 'pill-active' : 'pill-warning'">
                  <i class='bx bx-check-circle'></i> Status: {{ tenant.status === 'aktif' ? 'Aktif Terisi' : 'Hampir Habis' }}
                </span>
              </div>
              <h2>{{ tenant.name }}</h2>
              <p class="user-sub"><i class='bx bx-id-card'></i> NIK: {{ tenant.nik || '-' }} · <i class='bx bx-map-pin'></i> {{ tenant.address || '-' }}</p>
            </div>
          </div>

          <!-- HIGHLIGHT METRICS BAR -->
          <div class="hero-metrics-bar">
            <div class="metric-item">
              <i class='bx bxs-home-heart metric-icon'></i>
              <div>
                <span class="metric-label">Penempatan Kamar</span>
                <strong>{{ roomNumber }}</strong>
                <span class="metric-sub">{{ buildingName }} · {{ roomType }}</span>
              </div>
            </div>

            <div class="metric-item">
              <i class='bx bx-calendar-check metric-icon'></i>
              <div>
                <span class="metric-label">Durasi Kontrak</span>
                <strong>{{ tenant.durationMonths || 12 }} Bulan</strong>
                <span class="metric-sub">{{ daysRemaining }} Hari Tersisa</span>
              </div>
            </div>

            <div class="metric-item">
              <i class='bx bx-wallet metric-icon'></i>
              <div>
                <span class="metric-label">Harga Sewa Bulanan</span>
                <strong>{{ formatRupiah(tenant.monthlyRent || 950000) }}</strong>
                <span class="metric-sub">Lunas di Awal</span>
              </div>
            </div>
          </div>
        </div>

        <!-- TWO COLUMN DETAILS GRID -->
        <div class="details-grid">
          
          <!-- LEFT COLUMN: IDENTITAS & KONTAK -->
          <div class="card-detail-section">
            <div class="card-section-header">
              <i class='bx bx-user'></i>
              <h3>Identitas & Kontak Pribadi</h3>
            </div>

            <div class="info-grid">
              <div class="info-cell">
                <span class="cell-label"><i class='bx bx-user-circle'></i> Nama Lengkap</span>
                <strong class="cell-value">{{ tenant.name }}</strong>
              </div>

              <div class="info-cell">
                <span class="cell-label"><i class='bx bx-at'></i> Username Login</span>
                <strong class="cell-value">@{{ tenant.username }}</strong>
              </div>

              <div class="info-cell">
                <span class="cell-label"><i class='bx bx-id-card'></i> NIK KTP</span>
                <span class="cell-value">{{ tenant.nik || '-' }}</span>
              </div>

              <div class="info-cell">
                <span class="cell-label"><i class='bx bx-cake'></i> Tanggal Lahir</span>
                <span class="cell-value">{{ formatDateIndo(tenant.birthDate) }}</span>
              </div>

              <div class="info-cell cell-full">
                <span class="cell-label"><i class='bx bx-map'></i> Alamat Asal</span>
                <span class="cell-value">{{ tenant.address || '-' }}</span>
              </div>

              <div class="info-cell">
                <span class="cell-label"><i class='bx bxs-phone'></i> No WhatsApp Penyewa</span>
                <a :href="`https://wa.me/${formatWaPhone(tenant.phone)}`" target="_blank" class="wa-link-btn">
                  <i class='bx bxl-whatsapp'></i> {{ tenant.phone || '-' }}
                </a>
              </div>

              <div class="info-cell">
                <span class="cell-label"><i class='bx bx-phone-call'></i> Telepon Orang Tua / Wali</span>
                <span class="cell-value">{{ tenant.parentPhone || '-' }}</span>
              </div>
            </div>
          </div>

          <!-- RIGHT COLUMN: INFORMASI KAMAR & KONTRAK SEWA -->
          <div class="card-detail-section">
            <div class="card-section-header">
              <i class='bx bxs-key'></i>
              <h3>Detail Kamar & Kontrak Sewa</h3>
            </div>

            <div class="info-grid">
              <div class="info-cell">
                <span class="cell-label"><i class='bx bxs-door-open'></i> Nomor Kamar</span>
                <strong class="cell-value text-primary">{{ roomNumber }}</strong>
              </div>

              <div class="info-cell">
                <span class="cell-label"><i class='bx bx-building-house'></i> Gedung & Tipe</span>
                <span class="cell-value">{{ buildingName }} ({{ roomType }})</span>
              </div>

              <div class="info-cell">
                <span class="cell-label"><i class='bx bx-calendar-event'></i> Tanggal Mulai Sewa</span>
                <span class="cell-value">{{ formatDateIndo(tenant.startDate) }}</span>
              </div>

              <div class="info-cell">
                <span class="cell-label"><i class='bx bx-calendar-check'></i> Tanggal Selesai Sewa</span>
                <span class="cell-value text-accent">{{ formatDateIndo(tenant.endDate) }}</span>
              </div>

              <div class="info-cell cell-full">
                <span class="cell-label"><i class='bx bx-time'></i> Sisa Masa Kontrak</span>
                <div class="progress-remaining-box">
                  <div class="remaining-bar-wrapper">
                    <div class="remaining-bar-fill" :style="{ width: Math.min(100, Math.max(5, (daysRemaining / 365) * 100)) + '%' }"></div>
                  </div>
                  <span class="remaining-text">Sisa {{ daysRemaining }} Hari</span>
                </div>
              </div>
            </div>

            <!-- PAYMENT STATUS HIGHLIGHT CARD -->
            <div class="payment-summary-box">
              <div class="pay-summary-left">
                <i class='bx bx-check-shield pay-shield-icon'></i>
                <div>
                  <span class="pay-box-label">Status Tagihan & Pembayaran</span>
                  <strong class="pay-box-status"><i class='bx bx-check-circle'></i> LUNAS TERVERIFIKASI</strong>
                </div>
              </div>
              <div class="pay-summary-right">
                <span class="pay-box-amount">{{ formatRupiah((tenant.monthlyRent || 0) * (tenant.durationMonths || 12)) }}</span>
                <span class="pay-box-sub">Total {{ tenant.durationMonths || 12 }} Bulan Kontrak</span>
              </div>
            </div>

          </div>

        </div>
      </div>
    </main>

    <!-- MODAL EDIT KAMAR & SEWA PENYEWA -->
    <div v-if="isEditModalOpen" class="modal-backdrop" @click.self="closeEditModal">
      <div class="modal-box">
        <div class="modal-header">
          <div>
            <h2><i class='bx bx-edit-alt'></i> Edit Kamar & Status Sewa</h2>
            <p>Ubah penempatan kamar dan periode sewa untuk <strong>{{ tenant.name }}</strong></p>
          </div>
          <button class="modal-close" @click="closeEditModal" title="Tutup Modal"><i class='bx bx-x'></i></button>
        </div>

        <form @submit.prevent="handleSaveTenantRoom" class="edit-tenant-form">
          <div class="modal-body-scroll">
            <div class="form-section-card">
              <div class="section-card-title">
                <i class='bx bxs-home-heart'></i> Penempatan Kamar
              </div>
              <div class="form-group">
                <label>Pilih Kamar Terbuka</label>
                <select v-model="editForm.roomId" class="form-control" required>
                  <option v-for="r in rooms" :key="r.id" :value="r.id">
                    Kamar {{ r.number }} ({{ getBuildingName(r.buildingId) }} - {{ r.typeName }}) {{ r.status === 'occupied' && r.id !== tenant.roomId ? '· Terisi' : '· Tersedia' }}
                  </option>
                </select>
              </div>
            </div>

            <div class="form-section-card">
              <div class="section-card-title">
                <i class='bx bx-calendar-check'></i> Periode & Durasi Sewa
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Mulai Sewa</label>
                  <input type="date" v-model="editForm.startDate" @change="onEditFormChange" class="form-control" required />
                </div>
                <div class="form-group">
                  <label>Durasi Sewa (Bulan)</label>
                  <select v-model.number="editForm.durationMonths" @change="onEditFormChange" class="form-control" required>
                    <option :value="1">1 Bulan</option>
                    <option :value="3">3 Bulan</option>
                    <option :value="6">6 Bulan</option>
                    <option :value="12">12 Bulan (1 Tahun)</option>
                  </select>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Selesai Sewa (Otomatis)</label>
                  <input type="date" v-model="editForm.endDate" class="form-control" required />
                </div>
                <div class="form-group">
                  <label>Harga Sewa Bulanan (Rp)</label>
                  <input type="number" v-model="editForm.monthlyRent" class="form-control" required />
                </div>
              </div>

              <div class="form-group">
                <label>Status Masa Sewa</label>
                <select v-model="editForm.status" class="form-control">
                  <option value="aktif">Aktif</option>
                  <option value="hampir-habis">Hampir Habis (H-30 Hari)</option>
                  <option value="non-aktif">Non-Aktif / Selesai</option>
                </select>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-ghost" @click="closeEditModal">Batal</button>
            <button type="submit" class="btn btn-primary"><i class='bx bx-check-circle'></i> Simpan Perubahan</button>
          </div>
        </form>
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

.main-content {
  flex: 1;
  margin-left: 260px;
  padding: 32px;
  min-width: 0;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.88rem;
  color: var(--primary);
  font-weight: 600;
  margin-bottom: 8px;
  text-decoration: none;
}

.back-link:hover {
  text-decoration: underline;
}

.top-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.top-header h1 {
  font-size: 1.8rem;
  color: var(--dark);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.btn-whatsapp-bill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #25D366;
  color: #fff;
  font-weight: 700;
  padding: 10px 18px;
  border-radius: var(--radius-full);
  text-decoration: none;
  font-size: 0.88rem;
  box-shadow: 0 4px 12px rgba(37, 211, 102, 0.3);
  transition: all 0.2s ease;
}

.btn-whatsapp-bill:hover {
  background: #1EBE5D;
  transform: translateY(-2px);
  color: #fff;
}

.alert-notice {
  background: #DCFCE7;
  color: #15803D;
  padding: 12px 20px;
  border-radius: var(--radius-md);
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

/* HERO PROFILE CARD */
.profile-hero-card {
  background: linear-gradient(135deg, #541A1A 0%, #3B1212 100%);
  color: #fff;
  border-radius: var(--radius-xl);
  padding: 28px 32px;
  margin-bottom: 28px;
  box-shadow: 0 10px 25px -5px rgba(84, 26, 26, 0.25);
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.hero-main-info {
  display: flex;
  align-items: center;
  gap: 20px;
}

.avatar-circle {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(8px);
  border: 2px solid rgba(255, 255, 255, 0.3);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 1.6rem;
  flex-shrink: 0;
}

.user-titles h2 {
  font-size: 1.65rem;
  color: #fff;
  margin: 4px 0;
}

.user-tag-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.username-tag {
  font-family: monospace;
  background: rgba(255, 255, 255, 0.18);
  padding: 2px 10px;
  border-radius: var(--radius-md);
  font-size: 0.85rem;
  font-weight: 700;
}

.status-pill {
  font-size: 0.78rem;
  font-weight: 700;
  padding: 3px 12px;
  border-radius: var(--radius-full);
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.pill-active { background: rgba(34, 197, 94, 0.25); color: #86EFAC; border: 1px solid rgba(34, 197, 94, 0.4); }
.pill-warning { background: rgba(245, 158, 11, 0.25); color: #FDE68A; border: 1px solid rgba(245, 158, 11, 0.4); }

.user-sub {
  font-size: 0.88rem;
  color: rgba(255, 255, 255, 0.78);
  display: flex;
  align-items: center;
  gap: 8px;
}

.hero-metrics-bar {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
  border-radius: var(--radius-lg);
  padding: 16px 24px;
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.metric-item {
  display: flex;
  align-items: center;
  gap: 14px;
}

.metric-icon {
  font-size: 1.8rem;
  color: #DCC3AA;
}

.metric-label {
  display: block;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.7);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.metric-item strong {
  font-size: 1.1rem;
  color: #fff;
  display: block;
}

.metric-sub {
  font-size: 0.78rem;
  color: #F7EBE1;
}

/* DETAILS GRID */
.details-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.card-detail-section {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  padding: 28px;
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.card-section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 12px;
  border-bottom: 2px solid #F3EAE1;
}

.card-section-header i {
  font-size: 1.4rem;
  color: #541A1A;
}

.card-section-header h3 {
  font-size: 1.15rem;
  color: #541A1A;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.info-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.cell-full {
  grid-column: span 2;
}

.cell-label {
  font-size: 0.78rem;
  color: var(--text-muted);
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}

.cell-label i {
  color: #541A1A;
}

.cell-value {
  font-size: 0.95rem;
  color: var(--dark);
  font-weight: 500;
}

.text-primary {
  color: #541A1A;
  font-size: 1.1rem;
}

.text-accent {
  color: #C2410C;
  font-weight: 700;
}

.wa-link-btn {
  color: #25D366;
  font-weight: 700;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.95rem;
}

.wa-link-btn:hover {
  text-decoration: underline;
}

/* PROGRESS BAR FOR LEASE REMAINING */
.progress-remaining-box {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 4px;
}

.remaining-bar-wrapper {
  flex: 1;
  height: 10px;
  background: #F1F5F9;
  border-radius: var(--radius-full);
  overflow: hidden;
  border: 1px solid var(--border);
}

.remaining-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #10B981, #059669);
  border-radius: var(--radius-full);
  transition: width 0.4s ease;
}

.remaining-text {
  font-size: 0.85rem;
  font-weight: 700;
  color: #059669;
}

/* PAYMENT SUMMARY BOX */
.payment-summary-box {
  background: #ECFDF5;
  border: 1.5px solid #A7F3D0;
  border-radius: var(--radius-lg);
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 10px;
}

.pay-summary-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.pay-shield-icon {
  font-size: 2rem;
  color: #059669;
}

.pay-box-label {
  display: block;
  font-size: 0.75rem;
  color: #047857;
}

.pay-box-status {
  font-size: 0.92rem;
  color: #065F46;
  display: flex;
  align-items: center;
  gap: 4px;
}

.pay-summary-right {
  text-align: right;
}

.pay-box-amount {
  display: block;
  font-size: 1.15rem;
  font-weight: 800;
  color: #065F46;
}

.pay-box-sub {
  font-size: 0.75rem;
  color: #047857;
}

/* MODAL STYLES & SCROLLING */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.65);
  backdrop-filter: blur(6px);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  overflow-y: auto;
}

.modal-box {
  background: var(--white);
  border-radius: var(--radius-xl);
  max-width: 650px;
  width: 100%;
  max-height: 88vh;
  display: flex;
  flex-direction: column;
  position: relative;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  border: 1px solid var(--border);
  overflow: hidden;
  animation: modalFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes modalFadeIn {
  from { opacity: 0; transform: scale(0.96) translateY(10px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.modal-header {
  padding: 18px 24px;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #FAF7F2;
}

.modal-header h2 {
  font-size: 1.25rem;
  color: #541A1A;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 2px;
}

.modal-header p {
  font-size: 0.82rem;
  color: var(--text-muted);
}

.modal-close {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: 50%;
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--dark);
  font-size: 1.25rem;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.modal-close:hover {
  background: #FEE2E2;
  color: #DC2626;
  border-color: #FCA5A5;
  transform: rotate(90deg);
}

.edit-tenant-form {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}

.modal-body-scroll {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 18px;
  max-height: calc(88vh - 130px);
}

.modal-body-scroll::-webkit-scrollbar {
  width: 6px;
}
.modal-body-scroll::-webkit-scrollbar-track {
  background: #F1F1F1;
  border-radius: 4px;
}
.modal-body-scroll::-webkit-scrollbar-thumb {
  background: #DCC3AA;
  border-radius: 4px;
}
.modal-body-scroll::-webkit-scrollbar-thumb:hover {
  background: #541A1A;
}

.form-section-card {
  background: #FAFAFA;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.section-card-title {
  font-size: 0.9rem;
  font-weight: 700;
  color: #541A1A;
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.form-group label {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--dark);
  display: block;
  margin-bottom: 5px;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 10px 14px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  font-size: 0.88rem;
  background: var(--white);
  color: var(--dark);
  transition: all 0.2s ease;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #541A1A;
  box-shadow: 0 0 0 3px rgba(84, 26, 26, 0.12);
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid var(--border);
  background: #FAF7F2;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
}

@media (max-width: 992px) {
  .main-content { margin-left: 0; padding: 20px; }
  .details-grid { grid-template-columns: 1fr; }
  .hero-metrics-bar { grid-template-columns: 1fr; }
  .top-header { flex-direction: column; align-items: flex-start; gap: 14px; }
}

@media (max-width: 768px) {
  .main-content { padding: 16px; }
  .profile-hero-card { padding: 20px 16px; }
  .hero-main-info { flex-direction: column; align-items: flex-start; gap: 12px; }
  .user-titles h2 { font-size: 1.35rem; }
  .info-grid { grid-template-columns: 1fr; }
  .cell-full { grid-column: span 1; }
  .header-actions { width: 100%; flex-direction: column; }
  .header-actions button, .header-actions a { width: 100%; justify-content: center; }
}

@media (max-width: 480px) {
  .main-content { padding: 12px; }
  .top-header h1 { font-size: 1.3rem; }
  .card-detail-section { padding: 16px; }
}
</style>
