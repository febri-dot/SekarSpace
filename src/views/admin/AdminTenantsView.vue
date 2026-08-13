<script setup lang="ts">
import { ref, computed } from 'vue'
import AdminSidebar from '../../components/layout/AdminSidebar.vue'
import { RouterLink } from 'vue-router'
import { useAuth, type User } from '../../composables/useAuth'

const { tenants, addMember, deleteMember } = useAuth()

const searchQuery = ref('')
const isAddModalOpen = ref(false)
const successNotice = ref('')

// Form Tambah Member Baru
const formMember = ref<Omit<User, 'id' | 'role'>>({
  name: '',
  username: '',
  password: '',
  email: '',
  nik: '',
  address: '',
  phone: '',
  birthDate: '',
  parentPhone: '',
  roomNumber: 'Kamar 01',
  roomType: 'Kamar Mandi Dalam',
  building: 'Gedung Utama',
  monthlyRent: 950000,
  startDate: new Date().toISOString().substring(0, 10),
  endDate: '2027-08-31',
  status: 'aktif'
})

const filteredTenants = computed(() => {
  if (!searchQuery.value) return tenants.value
  const q = searchQuery.value.toLowerCase()
  return tenants.value.filter(t => 
    t.name.toLowerCase().includes(q) || 
    t.username.toLowerCase().includes(q) ||
    (t.nik && t.nik.includes(q)) ||
    (t.address && t.address.toLowerCase().includes(q)) ||
    (t.phone && t.phone.includes(q))
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
    ...formMember.value,
    email: formMember.value.email || `${formMember.value.username}@sekarspace.com`
  })

  successNotice.value = `Data Penyewa "${created.name}" (Username: ${created.username}) berhasil ditambahkan!`
  closeAddModal()

  // Reset Form
  formMember.value = {
    name: '',
    username: '',
    password: '',
    email: '',
    nik: '',
    address: '',
    phone: '',
    birthDate: '',
    parentPhone: '',
    roomNumber: 'Kamar 01',
    roomType: 'Kamar Mandi Dalam',
    building: 'Gedung Utama',
    monthlyRent: 950000,
    startDate: new Date().toISOString().substring(0, 10),
    endDate: '2027-08-31',
    status: 'aktif'
  }

  setTimeout(() => {
    successNotice.value = ''
  }, 5000)
}

const handleDelete = (t: User) => {
  if (confirm(`Apakah Anda yakin ingin menghapus penyewa "${t.name}" (@${t.username}) dari sistem?`)) {
    deleteMember(t.id)
    successNotice.value = `Penyewa "${t.name}" berhasil dihapus.`
    setTimeout(() => {
      successNotice.value = ''
    }, 4000)
  }
}
</script>

<template>
  <div class="admin-page">
    <AdminSidebar />

    <main class="admin-main">
      <!-- HEADER -->
      <header class="admin-header">
        <div>
          <span class="header-tag">Management Console</span>
          <h1>Manajemen <span class="text-gradient">Penyewa Kost</span></h1>
          <p>Daftar data penyewa Kost Muslimah Sekar Wangi sesuai database master.</p>
        </div>
        <button class="btn btn-primary" @click="openAddModal">
          <i class='bx bx-user-plus'></i> Tambah Penyewa Baru
        </button>
      </header>

      <!-- SUCCESS NOTICE -->
      <div v-if="successNotice" class="alert-notice">
        <i class='bx bx-check-circle'></i> {{ successNotice }}
      </div>

      <!-- MAIN TABLE CONTAINER -->
      <div class="admin-card">
        <div class="admin-card-header">
          <div class="search-box">
            <i class='bx bx-search'></i>
            <input type="text" v-model="searchQuery" placeholder="Cari berdasarkan nama, username, NIK, atau no hp..." />
          </div>
          <span class="count-badge">{{ filteredTenants.length }} Penyewa Terdata</span>
        </div>

        <div class="table-wrapper">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Password</th>
                <th>Nama Lengkap</th>
                <th>NIK</th>
                <th>Alamat</th>
                <th>No Telepon</th>
                <th>Tanggal Lahir</th>
                <th>No Telp Ortu</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="t in filteredTenants" :key="t.id">
                <td>
                  <span class="username-badge">@{{ t.username }}</span>
                </td>
                <td><code class="pass-mask">••••••••</code></td>
                <td>
                  <strong>{{ t.name }}</strong>
                </td>
                <td><span class="nik-text">{{ t.nik || '-' }}</span></td>
                <td>{{ t.address || '-' }}</td>
                <td><a :href="`tel:${t.phone}`" class="phone-link"><i class='bx bxs-phone'></i> {{ t.phone || '-' }}</a></td>
                <td>{{ t.birthDate || '-' }}</td>
                <td>{{ t.parentPhone || '-' }}</td>
                <td>
                  <div class="action-buttons">
                    <RouterLink :to="`/admin/tenants/${t.id}`" class="btn-action btn-detail" title="Detail Penyewa">
                      <i class='bx bx-show'></i> Detail
                    </RouterLink>
                    <button class="btn-action btn-delete" title="Hapus Penyewa" @click="handleDelete(t)">
                      <i class='bx bx-trash'></i> Delete
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="filteredTenants.length === 0">
                <td colspan="9" class="empty-cell">Tidak ada data penyewa yang sesuai pencarian.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>

    <!-- MODAL TAMBAH PENYEWA BARU -->
    <div v-if="isAddModalOpen" class="modal-backdrop" @click.self="closeAddModal">
      <div class="modal-box">
        <button class="modal-close" @click="closeAddModal"><i class='bx bx-x'></i></button>

        <div class="modal-header">
          <h2><i class='bx bx-user-plus'></i> Tambah Penyewa Baru</h2>
          <p>Masukkan data identitas lengkap penyewa untuk dicatat di database</p>
        </div>

        <form @submit.prevent="handleSaveMember" class="add-member-form">
          <div class="form-row">
            <div class="form-group">
              <label>Nama Lengkap Penyewa</label>
              <input type="text" v-model="formMember.name" placeholder="Contoh: Keyla Asyfa Zahra" required />
            </div>
            <div class="form-group">
              <label>NIK KTP</label>
              <input type="text" v-model="formMember.nik" placeholder="Contoh: 3401234567890001" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Username Login</label>
              <input type="text" v-model="formMember.username" placeholder="Contoh: keyla01" required />
            </div>
            <div class="form-group">
              <label>Password Login</label>
              <input type="text" v-model="formMember.password" placeholder="Contoh: user123" required />
            </div>
          </div>

          <div class="form-group">
            <label>Alamat Asal</label>
            <input type="text" v-model="formMember.address" placeholder="Contoh: Sleman, Yogyakarta" />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>No Telepon (WhatsApp)</label>
              <input type="tel" v-model="formMember.phone" placeholder="Contoh: 081234567890" />
            </div>
            <div class="form-group">
              <label>No Telepon Orang Tua</label>
              <input type="tel" v-model="formMember.parentPhone" placeholder="Contoh: 081298765432" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Tanggal Lahir</label>
              <input type="date" v-model="formMember.birthDate" />
            </div>
            <div class="form-group">
              <label>Nomor Kamar</label>
              <input type="text" v-model="formMember.roomNumber" placeholder="Contoh: Kamar 07" />
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-ghost" @click="closeAddModal">Batal</button>
            <button type="submit" class="btn btn-primary">Simpan Data Penyewa</button>
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
  margin-bottom: 28px;
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
  font-size: 1.8rem;
  color: var(--dark);
}

.admin-header p {
  color: var(--text-muted);
  font-size: 0.9rem;
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

.admin-card {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.admin-card-header {
  padding: 20px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border);
}

.search-box {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--off-white);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 8px 14px;
  width: 320px;
}

.search-box input {
  border: none;
  background: transparent;
  outline: none;
  font-size: 0.88rem;
  width: 100%;
}

.count-badge {
  font-size: 0.8rem;
  font-weight: 700;
  padding: 4px 12px;
  background: var(--tertiary);
  color: var(--primary);
  border-radius: var(--radius-full);
}

.table-wrapper {
  overflow-x: auto;
}

.admin-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.88rem;
}

.admin-table th {
  background: #DCC3AA;
  color: #541A1A;
  font-weight: 700;
  padding: 12px 14px;
  text-align: left;
  border-bottom: 2px solid var(--border);
}

.admin-table td {
  padding: 12px 14px;
  border-bottom: 1px solid var(--border);
  color: var(--dark);
}

.username-badge {
  font-family: monospace;
  font-weight: 700;
  color: var(--primary);
  background: var(--tertiary-light);
  padding: 2px 8px;
  border-radius: var(--radius-md);
}

.pass-mask {
  color: var(--text-muted);
  letter-spacing: 2px;
}

.phone-link {
  color: var(--primary);
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-action {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 4px;

  transition: opacity 0.2s ease;
}

.btn-detail {
  background: #541A1A;
  color: white;
  text-decoration: none;
}

.btn-delete {
  background: #DCC3AA;
  color: black;
}

.btn-action:hover {
  opacity: 0.9;
}

.empty-cell {
  text-align: center;
  padding: 30px;
  color: var(--text-muted);
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
  max-width: 600px;
  width: 100%;
  padding: 32px;
  position: relative;
  box-shadow: var(--shadow-xl);
}

.modal-close {
  position: absolute;
  top: 16px;
  right: 16px;
  background: var(--off-white);
  border: 1px solid var(--border);
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.add-member-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 20px;
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
  margin-bottom: 4px;
}

.form-group input {
  width: 100%;
  padding: 10px 14px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  font-size: 0.9rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 10px;
}

@media (max-width: 992px) {
  .admin-main { margin-left: 0; }
}
</style>
