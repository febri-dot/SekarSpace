<script setup lang="ts">
import { ref, computed } from 'vue'
import AdminSidebar from '../../components/layout/AdminSidebar.vue'
import { RouterLink } from 'vue-router'
import { useAuth } from '../../composables/useAuth'

const { tenants, addMember } = useAuth()

const searchQuery = ref('')
const isAddModalOpen = ref(false)
const successNotice = ref('')

// Form Tambah Member Baru
const formMember = ref({
  name: '',
  username: '',
  password: '',
  email: '',
  phone: '',
  roomNumber: 'Kamar 08',
  roomType: 'Kamar Mandi Dalam (Deluxe)',
  building: 'Gedung Utama (Lantai 2)',
  monthlyRent: 950000,
  startDate: new Date().toISOString().substring(0, 10),
  endDate: '2027-08-31'
})

const filteredTenants = computed(() => {
  if (!searchQuery.value) return tenants.value
  const q = searchQuery.value.toLowerCase()
  return tenants.value.filter(t => 
    t.name.toLowerCase().includes(q) || 
    (t.roomNumber && t.roomNumber.toLowerCase().includes(q)) ||
    (t.phone && t.phone.includes(q)) ||
    t.username.toLowerCase().includes(q)
  )
})

const openAddModal = () => {
  isAddModalOpen.value = true
  successNotice.value = ''
}

const closeAddModal = () => {
  isAddModalOpen.value = false
}

const handleSaveMember = () => {
  if (!formMember.value.name || !formMember.value.username || !formMember.value.password) {
    alert('Mohon lengkapi nama, username, dan password member.')
    return
  }

  const created = addMember({
    name: formMember.value.name,
    username: formMember.value.username,
    password: formMember.value.password,
    email: formMember.value.email || `${formMember.value.username}@sekarspace.com`,
    phone: formMember.value.phone,
    roomNumber: formMember.value.roomNumber,
    roomType: formMember.value.roomType,
    building: formMember.value.building,
    monthlyRent: formMember.value.monthlyRent,
    startDate: formMember.value.startDate,
    endDate: formMember.value.endDate,
    status: 'aktif'
  })

  successNotice.value = `Member "${created.name}" (Username: ${created.username}) berhasil ditambahkan & disimpan ke users.json!`
  closeAddModal()

  // Reset form
  formMember.value = {
    name: '',
    username: '',
    password: '',
    email: '',
    phone: '',
    roomNumber: 'Kamar 08',
    roomType: 'Kamar Mandi Dalam (Deluxe)',
    building: 'Gedung Utama (Lantai 2)',
    monthlyRent: 950000,
    startDate: new Date().toISOString().substring(0, 10),
    endDate: '2027-08-31'
  }

  setTimeout(() => {
    successNotice.value = ''
  }, 5000)
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
          <h1>Kelola Data Penyewa</h1>
          <p>Daftar seluruh penghuni Kost Sekar Space & Pembuatan Akun Baru</p>
        </div>

        <div class="header-actions">
          <div class="header-search">
            <i class='bx bx-search'></i>
            <input type="text" v-model="searchQuery" placeholder="Cari nama, username, atau kamar..." />
          </div>

          <button class="btn btn-primary add-member-btn" @click="openAddModal">
            <i class='bx bx-user-plus'></i> Tambah Member Baru
          </button>
        </div>
      </header>

      <div class="page-body">
        <div v-if="successNotice" class="alert-success">
          <i class='bx bx-check-circle'></i> {{ successNotice }}
        </div>

        <div class="table-card">
          <div class="table-header-bar">
            <h2>Daftar Penghuni ({{ filteredTenants.length }})</h2>
          </div>

          <div class="table-responsive">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Nama Member</th>
                  <th>Username</th>
                  <th>Nomor Kamar</th>
                  <th>No. WhatsApp</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(t, index) in filteredTenants" :key="t.id">
                  <td>{{ index + 1 }}</td>
                  <td>
                    <strong>{{ t.name }}</strong>
                    <span class="user-email">{{ t.email }}</span>
                  </td>
                  <td>
                    <span class="username-badge">@{{ t.username }}</span>
                  </td>
                  <td>
                    <span class="room-tag"><i class='bx bx-key'></i> {{ t.roomNumber || 'Kamar -' }}</span>
                  </td>
                  <td>{{ t.phone || '-' }}</td>
                  <td>
                    <span 
                      class="status-pill" 
                      :class="t.status === 'aktif' ? 'pill-active' : 'pill-warning'"
                    >
                      {{ t.status === 'aktif' ? 'Aktif' : 'Hampir Habis' }}
                    </span>
                  </td>
                  <td>
                    <RouterLink :to="`/admin/tenants/${t.id}`" class="btn-detail">
                      <i class='bx bx-show'></i> Detail
                    </RouterLink>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>

    <!-- MODAL TAMBAH MEMBER BARU (KHUSUS ADMIN) -->
    <div v-if="isAddModalOpen" class="modal-backdrop" @click.self="closeAddModal">
      <div class="modal-box">
        <button class="modal-close" @click="closeAddModal"><i class='bx bx-x'></i></button>

        <div class="modal-header">
          <h2><i class='bx bx-user-plus'></i> Tambah Member Baru</h2>
          <p>Buat akun penyewa baru agar dapat login ke Portal Penyewa</p>
        </div>

        <form @submit.prevent="handleSaveMember" class="add-member-form">
          <div class="form-group">
            <label>Nama Lengkap Penyewa (Sesuai KTP)</label>
            <input type="text" v-model="formMember.name" placeholder="Contoh: Siti Nurhaliza" required />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Username Login</label>
              <input type="text" v-model="formMember.username" placeholder="Contoh: siti" required />
            </div>

            <div class="form-group">
              <label>Password Login</label>
              <input type="text" v-model="formMember.password" placeholder="Contoh: password123" required />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Alamat Email</label>
              <input type="email" v-model="formMember.email" placeholder="Contoh: siti@gmail.com" />
            </div>

            <div class="form-group">
              <label>Nomor WhatsApp / HP</label>
              <input type="tel" v-model="formMember.phone" placeholder="Contoh: 08123456789" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Nomor Kamar</label>
              <input type="text" v-model="formMember.roomNumber" placeholder="Contoh: Kamar 08" required />
            </div>

            <div class="form-group">
              <label>Tipe Kamar</label>
              <select v-model="formMember.roomType">
                <option value="Kamar Mandi Dalam (Deluxe)">Kamar Mandi Dalam (Deluxe)</option>
                <option value="Kamar Mandi Luar">Kamar Mandi Luar</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Gedung Hunian</label>
              <select v-model="formMember.building">
                <option value="Gedung Utama (Lantai 2)">Gedung Utama</option>
                <option value="Gedung Timur (Lantai 1)">Gedung Timur</option>
                <option value="Gedung Barat (Lantai 2)">Gedung Barat</option>
              </select>
            </div>

            <div class="form-group">
              <label>Biaya Sewa / Bulan (Rp)</label>
              <input type="number" v-model="formMember.monthlyRent" required />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Tanggal Mulai Sewa</label>
              <input type="date" v-model="formMember.startDate" required />
            </div>

            <div class="form-group">
              <label>Tanggal Akhir Sewa</label>
              <input type="date" v-model="formMember.endDate" required />
            </div>
          </div>

          <button type="submit" class="btn btn-primary submit-member-btn">
            <i class='bx bx-check-circle'></i> Simpan & Buat Akun Member
          </button>
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

.top-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.top-header h1 {
  font-size: 1.8rem;
  margin-bottom: 4px;
}

.top-header p {
  color: var(--text-muted);
  font-size: 0.9rem;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.header-search {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--white);
  border: 1px solid var(--border);
  padding: 8px 16px;
  border-radius: var(--radius-full);
  width: 260px;
}

.header-search input {
  border: none;
  outline: none;
  width: 100%;
  font-size: 0.88rem;
}

.add-member-btn {
  padding: 10px 20px;
  font-size: 0.9rem;
}

.alert-success {
  background: var(--success-bg);
  color: var(--success);
  padding: 14px 20px;
  border-radius: var(--radius-md);
  margin-bottom: 20px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.table-card {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 24px;
}

.table-header-bar {
  margin-bottom: 20px;
}

.table-header-bar h2 {
  font-size: 1.2rem;
}

.admin-table {
  width: 100%;
  border-collapse: collapse;
}

.admin-table th {
  text-align: left;
  padding: 12px 16px;
  background: var(--tertiary-light);
  color: var(--primary);
  font-size: 0.85rem;
  font-weight: 700;
}

.admin-table td {
  padding: 16px;
  border-bottom: 1px solid var(--border);
  font-size: 0.9rem;
}

.admin-table tbody tr {
  transition: all var(--transition-fast);
}

.admin-table tbody tr:hover {
  background: var(--tertiary-light);
}

.user-email {
  display: block;
  font-size: 0.78rem;
  color: var(--text-muted);
  font-weight: normal;
}

.username-badge {
  font-family: monospace;
  background: var(--off-white);
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  font-size: 0.82rem;
}

.room-tag {
  background: var(--tertiary);
  color: var(--primary);
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  font-weight: 600;
  font-size: 0.82rem;
}

.status-pill {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: var(--radius-full);
}

.pill-active { background: var(--success-bg); color: var(--success); }
.pill-warning { background: var(--warning-bg); color: var(--warning); }

.btn-detail {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
  background: var(--primary);
  color: white;
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
  font-weight: 600;
  transition: background var(--transition-fast);
}

.btn-detail:hover {
  background: var(--primary-light);
}

/* MODAL */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(6px);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  animation: fadeIn 0.25s ease-out;
}

.modal-box {
  background: var(--white);
  border-radius: var(--radius-xl);
  max-width: 600px;
  width: 100%;
  padding: 32px;
  position: relative;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--shadow-xl);
  animation: successPop 0.3s ease-out;
}

.modal-close {
  position: absolute;
  top: 20px;
  right: 20px;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-muted);
}

.modal-header h2 {
  font-size: 1.35rem;
  margin-bottom: 4px;
}

.modal-header p {
  font-size: 0.88rem;
  color: var(--text-muted);
  margin-bottom: 24px;
}

.add-member-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 0.82rem;
  font-weight: 600;
}

.form-group input, .form-group select {
  padding: 10px 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  font-size: 0.9rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.submit-member-btn {
  width: 100%;
  margin-top: 8px;
  padding: 12px;
}

@media (max-width: 992px) {
  .main-content { margin-left: 0; padding: 20px; }
  .form-row { grid-template-columns: 1fr; }
}
</style>
