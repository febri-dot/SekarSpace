<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import AdminSidebar from '../../components/layout/AdminSidebar.vue'
import { useAuth } from '../../composables/useAuth'
import { useDataStore } from '../../composables/useDataStore'

const route = useRoute()
const { getTenantById, updateMember } = useAuth()
const { rooms, getRoomById, getBuildingName, updateRoom, cmsSettings } = useDataStore()

const tenantId = String(route.params.id)

const tenant = computed(() => {
  return getTenantById(tenantId) || {
    id: tenantId,
    name: 'Keyla Asyfa Zahra',
    username: 'keyla01',
    nik: '3401234567890001',
    address: 'Sleman, Yogyakarta',
    phone: '081234567890',
    birthDate: '12 Mei 2004',
    parentPhone: '081298765432',
    roomId: 'A-13',
    monthlyRent: 950000,
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

// Edit Modal State
const isEditModalOpen = ref(false)
const noticeMessage = ref('')

const editForm = ref({
  roomId: 'A-13',
  monthlyRent: 950000,
  startDate: '2025-09-01',
  endDate: '2026-09-01',
  status: 'aktif' as 'aktif' | 'hampir-habis' | 'non-aktif'
})

const openEditModal = () => {
  editForm.value = {
    roomId: tenant.value.roomId || 'A-13',
    monthlyRent: tenant.value.monthlyRent || 950000,
    startDate: tenant.value.startDate || '2025-09-01',
    endDate: tenant.value.endDate || '2026-09-01',
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

  // Update room occupancy status if room changed
  if (oldRoomId && oldRoomId !== newRoomId) {
    updateRoom(oldRoomId, { status: 'available' })
    updateRoom(newRoomId, { status: 'occupied' })
  }

  // Update tenant record
  updateMember(tenant.value.id, {
    roomId: editForm.value.roomId,
    monthlyRent: Number(editForm.value.monthlyRent),
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

// Generate WhatsApp Bill Link
const waBillUrl = computed(() => {
  const phone = (tenant.value.phone || '').replace(/[^0-9]/g, '')
  const formattedRent = formatRupiah(tenant.value.monthlyRent || 950000)
  
  const text = `Halo Kak ${tenant.value.name}, 👋

Berikut adalah rincian tagihan sewa Kost Sekar Space Anda:
📌 Kamar: ${roomNumber.value} (${buildingName.value})
📌 Nominal Sewa: ${formattedRent} / bulan
📌 Periode Jatuh Tempo: s.d. ${tenant.value.endDate || '01 Sep 2026'}

Mohon lakukan pembayaran melalui rekening resmi Sekar Space:
• BCA: 1234 5678 90 (a.n. Sekar Space Kost)
• Mandiri: 9876 5432 10 (a.n. Sekar Space Kost)

Setelah transfer, mohon kirimkan konfirmasi atau upload bukti pembayaran di Portal Penyewa. Terima kasih! 🙏`

  return `https://wa.me/${phone || '6281234567890'}?text=${encodeURIComponent(text)}`
})

const getInitials = (name: string) => {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

const formatRupiah = (val?: number) => {
  if (!val) return 'Rp 0'
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)
}
</script>

<template>
  <div class="admin-page">
    <AdminSidebar />

    <main class="main-content">
      <header class="top-header">
        <div>
          <RouterLink to="/admin/tenants" class="back-link">
            <i class='bx bx-left-arrow-alt'></i> Kembali ke Daftar Penyewa
          </RouterLink>
          <h1>Detail Penyewa</h1>
        </div>
      </header>

      <div class="page-body">
        <div v-if="noticeMessage" class="alert-notice">
          <i class='bx bx-check-circle'></i> {{ noticeMessage }}
        </div>

        <div class="detail-card">
          <div class="profile-banner">
            <div class="avatar-circle">{{ getInitials(tenant.name) }}</div>
            <div>
              <h2>{{ tenant.name }}</h2>
              <span class="status-badge"><i class='bx bx-check-circle'></i> Status: {{ tenant.status === 'aktif' ? 'Aktif (Terisi)' : 'Hampir Habis' }}</span>
            </div>
            <div class="banner-actions">
              <a :href="waBillUrl" target="_blank" rel="noopener" class="btn btn-whatsapp-bill">
                <i class='bx bxl-whatsapp'></i> Kirim Tagihan via WA
              </a>
            </div>
          </div>

          <!-- Section 1: Informasi Penyewa -->
          <div class="section-box">
            <h2>Informasi Penyewa</h2>
            <div class="info-list">
              <p class="info"><span class="label">Username:</span> {{ tenant.username }}</p>
              <p class="info"><span class="label">Nama Lengkap:</span> {{ tenant.name }}</p>
              <p class="info"><span class="label">NIK:</span> {{ tenant.nik || '3401234567890001' }}</p>
              <p class="info"><span class="label">Alamat:</span> {{ tenant.address || 'Sleman, Yogyakarta' }}</p>
              <p class="info">
                <span class="label">No Telepon:</span> 
                <a :href="`https://wa.me/${(tenant.phone || '081234567890').replace(/[^0-9]/g, '')}`" target="_blank" class="wa-link">
                  <i class='bx bxl-whatsapp'></i> {{ tenant.phone || '081234567890' }}
                </a>
              </p>
              <p class="info"><span class="label">Tanggal Lahir:</span> {{ tenant.birthDate || '12 Mei 2004' }}</p>
              <p class="info"><span class="label">No Telepon Orang Tua:</span> {{ tenant.parentPhone || '081298765432' }}</p>
            </div>
          </div>

          <!-- Section 2: Informasi Kamar -->
          <div class="section-box">
            <div class="section-header-row">
              <h2>Informasi Kamar & Gedung</h2>
              <button class="btn btn-outline-primary btn-sm" @click="openEditModal">
                <i class='bx bx-edit'></i> Edit Data Kamar & Sewa
              </button>
            </div>
            <div class="info-list">
              <p class="info"><span class="label">Nomor Kamar:</span> {{ roomNumber }}</p>
              <p class="info"><span class="label">Tipe Kamar:</span> {{ roomType }}</p>
              <p class="info"><span class="label">Gedung:</span> {{ buildingName }}</p>
              <p class="info"><span class="label">Status Sewa:</span> {{ tenant.status === 'aktif' ? 'Aktif' : 'Hampir Habis' }}</p>
            </div>
          </div>

          <!-- Section 3: Informasi Sewa -->
          <div class="section-box">
            <h2>Informasi Sewa</h2>
            <div class="info-list">
              <p class="info"><span class="label">Mulai Sewa:</span> {{ tenant.startDate || '01 September 2025' }}</p>
              <p class="info"><span class="label">Selesai Sewa:</span> {{ tenant.endDate || '01 September 2026' }}</p>
            </div>
          </div>

          <!-- Section 4: Informasi Pembayaran -->
          <div class="section-box">
            <h2>Informasi Pembayaran</h2>
            <div class="info-list">
              <p class="info"><span class="label">Status Pembayaran:</span> <strong class="text-success">Lunas</strong></p>
              <p class="info"><span class="label">Total Pembayaran:</span> {{ formatRupiah(tenant.monthlyRent || 950000) }} / bulan</p>
              <p class="info"><span class="label">Tenggat Pembayaran:</span> {{ tenant.endDate || '01 September 2026' }}</p>
            </div>
          </div>

          <div class="action-footer">
            <RouterLink to="/admin/tenants" class="btn btn-primary">Kembali ke Daftar Penyewa</RouterLink>
          </div>
        </div>
      </div>
    </main>

    <!-- MODAL EDIT KAMAR & SEWA PENYEWA -->
    <div v-if="isEditModalOpen" class="modal-backdrop" @click.self="closeEditModal">
      <div class="modal-box">
        <button class="modal-close" @click="closeEditModal"><i class='bx bx-x'></i></button>

        <div class="modal-header">
          <h2><i class='bx bx-edit-alt'></i> Edit Kamar & Status Sewa</h2>
          <p>Ubah penempatan kamar dan periode sewa untuk penyewa <strong>{{ tenant.name }}</strong></p>
        </div>

        <form @submit.prevent="handleSaveTenantRoom" class="edit-tenant-form">
          <div class="form-group mb-3">
            <label>Pilih Kamar Terbuka</label>
            <select v-model="editForm.roomId" class="form-control" required>
              <option v-for="r in rooms" :key="r.id" :value="r.id">
                Kamar {{ r.number }} ({{ getBuildingName(r.buildingId) }} - {{ r.typeName }}) {{ r.status === 'occupied' && r.id !== tenant.roomId ? '· Terisi' : '· Tersedia' }}
              </option>
            </select>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Mulai Sewa</label>
              <input type="date" v-model="editForm.startDate" class="form-control" required />
            </div>
            <div class="form-group">
              <label>Selesai Sewa</label>
              <input type="date" v-model="editForm.endDate" class="form-control" required />
            </div>
          </div>

          <div class="form-row mt-3">
            <div class="form-group">
              <label>Harga Sewa Bulanan (Rp)</label>
              <input type="number" v-model="editForm.monthlyRent" class="form-control" required />
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

          <div class="modal-footer mt-4">
            <button type="button" class="btn btn-ghost" @click="closeEditModal">Batal</button>
            <button type="submit" class="btn btn-primary">Simpan Perubahan</button>
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
}

.top-header h1 {
  font-size: 1.8rem;
  color: var(--dark);
}

.detail-card {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  padding: 32px;
  max-width: 850px;
  box-shadow: var(--shadow-sm);
}

.profile-banner {
  display: flex;
  align-items: center;
  gap: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 24px;
}

.banner-actions {
  margin-left: auto;
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
  font-size: 0.9rem;
  box-shadow: 0 4px 12px rgba(37, 211, 102, 0.3);
  transition: all 0.2s ease;
}

.btn-whatsapp-bill:hover {
  background: #1EBE5D;
  transform: translateY(-2px);
  color: #fff;
}

.section-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
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

.avatar-circle {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #541A1A;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.3rem;
}

.profile-banner h2 {
  font-size: 1.5rem;
  margin-bottom: 4px;
  color: #541A1A;
}

.status-badge {
  font-size: 0.82rem;
  font-weight: 700;
  color: #16A34A;
}

.section-box {
  margin-bottom: 24px;
}

.section-box h2 {
  color: #541A1A;
  font-size: 1.15rem;
  border-bottom: 2px solid #DCC3AA;
  padding-bottom: 6px;
  margin-bottom: 12px;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info {
  font-size: 0.95rem;
  color: var(--dark);
}

.label {
  font-weight: bold;
  color: #541A1A;
  display: inline-block;
  min-width: 170px;
}

.wa-link {
  color: #25D366;
  font-weight: 600;
}

.text-success {
  color: #16A34A;
}

.action-footer {
  margin-top: 28px;
  padding-top: 20px;
  border-top: 1px solid var(--border);
}

@media (max-width: 992px) {
  .main-content { margin-left: 0; padding: 20px; }
  .label { min-width: auto; display: block; margin-bottom: 2px; }
}

@media (max-width: 768px) {
  .main-content { padding: 16px; }
  .detail-card { padding: 18px 14px; }
  .profile-banner { flex-direction: column; align-items: flex-start; gap: 12px; }
  .profile-banner h2 { font-size: 1.3rem; }
  .top-bar { margin-bottom: 16px; }
}

@media (max-width: 480px) {
  .main-content { padding: 12px; }
  .detail-card { padding: 14px 12px; border-radius: var(--radius-md); }
  .profile-banner h2 { font-size: 1.15rem; }
  .info-item { font-size: 0.85rem; }
}
</style>
