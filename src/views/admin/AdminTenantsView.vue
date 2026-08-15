<script setup lang="ts">
import { ref, computed } from 'vue'
import AdminSidebar from '../../components/layout/AdminSidebar.vue'
import { RouterLink } from 'vue-router'
import { useAuth, type User } from '../../composables/useAuth'
import { useDataStore, getRoomPriceByDuration } from '../../composables/useDataStore'

const { tenants, addMember, deleteMember } = useAuth()
const { rooms, getRoomById, getBuildingName, updateRoom, addPayment } = useDataStore()

const searchQuery = ref('')
const isAddModalOpen = ref(false)
const successNotice = ref('')

// Helper untuk menghitung Tanggal Selesai Sewa secara otomatis (Berdasarkan Mulai Sewa + Durasi Bulan)
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

const todayStr = new Date().toISOString().substring(0, 10)

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
  roomId: 'A-12',
  monthlyRent: 600000,
  durationMonths: 12,
  startDate: todayStr,
  endDate: computeEndDate(todayStr, 12),
  status: 'aktif'
})

// Update tanggal selesai & estimasi harga sewa saat kamar, tanggal mulai, atau durasi berubah
const updateCalculatedFields = () => {
  const months = Number(formMember.value.durationMonths) || 1
  if (formMember.value.startDate) {
    formMember.value.endDate = computeEndDate(formMember.value.startDate, months)
  }
  const selectedRoom = getRoomById(formMember.value.roomId || '')
  if (selectedRoom) {
    const totalDurationPrice = getRoomPriceByDuration(selectedRoom, months)
    formMember.value.monthlyRent = Math.round(totalDurationPrice / months)
  }
}

const filteredTenants = computed(() => {
  if (!searchQuery.value) return tenants.value
  const q = searchQuery.value.toLowerCase()
  return tenants.value.filter(t => 
    t.name.toLowerCase().includes(q) || 
    t.username.toLowerCase().includes(q) ||
    (t.nik && t.nik.includes(q)) ||
    (t.address && t.address.toLowerCase().includes(q)) ||
    (t.phone && t.phone.includes(q)) ||
    (t.roomId && t.roomId.toLowerCase().includes(q))
  )
})

const openAddModal = () => {
  isAddModalOpen.value = true
  successNotice.value = ''
  
  const availableRoom = rooms.value.find(r => r.status === 'available')
  const defaultRoomId = availableRoom ? availableRoom.id : (rooms.value[0]?.id || 'A-12')
  const defaultDuration = 12

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
    roomId: defaultRoomId,
    monthlyRent: availableRoom ? Math.round(getRoomPriceByDuration(availableRoom, defaultDuration) / defaultDuration) : 600000,
    durationMonths: defaultDuration,
    startDate: todayStr,
    endDate: computeEndDate(todayStr, defaultDuration),
    status: 'aktif'
  }
}

const closeAddModal = () => {
  isAddModalOpen.value = false
}

const handleSaveMember = () => {
  if (!formMember.value.name || !formMember.value.username || !formMember.value.password) {
    alert('Mohon lengkapi nama, username, dan password member.')
    return
  }

  // Pastikan Tanggal Selesai terhitung
  if (!formMember.value.endDate) {
    formMember.value.endDate = computeEndDate(formMember.value.startDate || todayStr, formMember.value.durationMonths || 12)
  }

  const created = addMember({
    ...formMember.value,
    email: formMember.value.email || `${formMember.value.username}@sekarspace.com`
  })

  // Update status kamar menjadi occupied
  if (formMember.value.roomId) {
    updateRoom(formMember.value.roomId, { status: 'occupied' })
  }

  // Catat pembayaran LUNAS otomatis di awal pendaftaran akun baru
  const duration = formMember.value.durationMonths || 12
  const totalAmount = (formMember.value.monthlyRent || 0) * duration
  const startDateFormatted = formatDateIndo(formMember.value.startDate)
  const endDateFormatted = formatDateIndo(formMember.value.endDate)

  addPayment({
    memberId: created.id,
    period: `Sewa Awal ${duration} Bulan (${startDateFormatted} - ${endDateFormatted})`,
    amount: totalAmount,
    durationMonths: duration,
    method: 'Pembayaran Awal Kontrak (Lunas)',
    date: formMember.value.startDate || todayStr,
    dueDate: formMember.value.endDate,
    status: 'paid',
    notes: 'Pembayaran otomatis dikonfirmasi LUNAS pada pendaftaran akun penyewa baru.'
  })

  successNotice.value = `Data Penyewa "${created.name}" (@${created.username}) berhasil ditambahkan dan pembayaran awal tercatat LUNAS!`
  closeAddModal()

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

const formatDateIndo = (dateStr?: string) => {
  if (!dateStr) return '-'
  const parts = dateStr.split('-')
  if (parts.length !== 3) return dateStr
  const monthsIndo = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des']
  const day = parts[2]
  const monthIdx = parseInt(parts[1], 10) - 1
  const year = parts[0]
  return `${day} ${monthsIndo[monthIdx] || ''} ${year}`
}

const formatRupiah = (val?: number) => {
  if (!val) return 'Rp 0'
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)
}

const getRoomInfoText = (roomId?: string) => {
  if (!roomId) return 'Belum Pilih Kamar'
  const rm = getRoomById(roomId)
  return rm ? `Kamar ${rm.number} (${getBuildingName(rm.buildingId)})` : `Kamar ${roomId}`
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
                <th>Nama Lengkap</th>
                <th>NIK & Alamat</th>
                <th>No Telepon</th>
                <th>Kamar & Masa Sewa</th>
                <th>Biaya / Bulan</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="t in filteredTenants" :key="t.id">
                <td>
                  <span class="username-badge">@{{ t.username }}</span>
                </td>
                <td>
                  <strong>{{ t.name }}</strong>
                </td>
                <td>
                  <span class="nik-text">{{ t.nik || '-' }}</span>
                  <div class="sub-address">{{ t.address || '-' }}</div>
                </td>
                <td><a :href="`tel:${t.phone}`" class="phone-link"><i class='bx bxs-phone'></i> {{ t.phone || '-' }}</a></td>
                <td>
                  <div class="tenant-room-badge"><i class='bx bxs-home-heart'></i> {{ getRoomInfoText(t.roomId) }}</div>
                  <div class="rent-period-sub">
                    <i class='bx bx-calendar'></i> {{ formatDateIndo(t.startDate) }} — {{ formatDateIndo(t.endDate) }}
                    <span v-if="t.durationMonths" class="badge-duration-small">{{ t.durationMonths }} Bln</span>
                  </div>
                </td>
                <td>
                  <strong class="text-rent">{{ formatRupiah(t.monthlyRent || 950000) }}</strong>
                </td>
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
                <td colspan="7" class="empty-cell">Tidak ada data penyewa yang sesuai pencarian.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- MOBILE CARD VIEW FOR TENANTS -->
        <div class="mobile-tenant-cards">
          <div v-for="t in filteredTenants" :key="'mob-' + t.id" class="mobile-tenant-card">
            <div class="tenant-card-top">
              <div>
                <strong class="tenant-name">{{ t.name }}</strong>
                <span class="username-badge">@{{ t.username }}</span>
              </div>
              <div class="action-buttons">
                <RouterLink :to="`/admin/tenants/${t.id}`" class="btn-action btn-detail">
                  <i class='bx bx-show'></i> Detail
                </RouterLink>
                <button class="btn-action btn-delete" @click="handleDelete(t)">
                  <i class='bx bx-trash'></i>
                </button>
              </div>
            </div>
            <div class="tenant-card-info">
              <div class="info-row"><i class='bx bxs-home-heart'></i> <span>Kamar:</span> <strong>{{ getRoomInfoText(t.roomId) }}</strong></div>
              <div class="info-row"><i class='bx bx-calendar'></i> <span>Masa Sewa:</span> <span>{{ formatDateIndo(t.startDate) }} s.d. {{ formatDateIndo(t.endDate) }} ({{ t.durationMonths || 12 }} Bln)</span></div>
              <div class="info-row"><i class='bx bx-phone'></i> <span>No HP:</span> <strong>{{ t.phone || '-' }}</strong></div>
              <div class="info-row"><i class='bx bx-id-card'></i> <span>NIK:</span> <span>{{ t.nik || '-' }}</span></div>
            </div>
          </div>
          <div v-if="filteredTenants.length === 0" class="empty-cell">Tidak ada data penyewa yang sesuai pencarian.</div>
        </div>
      </div>
    </main>

    <!-- MODAL TAMBAH PENYEWA BARU -->
    <div v-if="isAddModalOpen" class="modal-backdrop" @click.self="closeAddModal">
      <div class="modal-box">
        <div class="modal-header">
          <div>
            <h2><i class='bx bx-user-plus'></i> Tambah Penyewa Baru</h2>
            <p>Masukkan data identitas penyewa & atur durasi serta periode sewa</p>
          </div>
          <button class="modal-close" @click="closeAddModal" title="Tutup Modal"><i class='bx bx-x'></i></button>
        </div>

        <form @submit.prevent="handleSaveMember" class="add-member-form">
          <div class="modal-body-scroll">
            
            <!-- SEKSI 1: IDENTITAS PENYEWA -->
            <div class="form-section-card">
              <div class="section-card-title">
                <i class='bx bx-id-card'></i> Identitas Penyewa
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Nama Lengkap Penyewa <span class="required-star">*</span></label>
                  <input type="text" v-model="formMember.name" placeholder="Contoh: Keyla Asyfa Zahra" required />
                </div>
                <div class="form-group">
                  <label>NIK KTP</label>
                  <input type="text" v-model="formMember.nik" placeholder="Contoh: 3401234567890001" />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Username Login <span class="required-star">*</span></label>
                  <input type="text" v-model="formMember.username" placeholder="Contoh: keyla01" required />
                </div>
                <div class="form-group">
                  <label>Password Login <span class="required-star">*</span></label>
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
                  <label>Pilih Kamar <span class="required-star">*</span></label>
                  <select v-model="formMember.roomId" class="form-control" @change="updateCalculatedFields" required>
                    <option v-for="r in rooms" :key="r.id" :value="r.id">
                      Kamar {{ r.number }} ({{ getBuildingName(r.buildingId) }} - {{ r.typeName }}) {{ r.status === 'occupied' ? '· Terisi' : '· Tersedia' }}
                    </option>
                  </select>
                </div>
              </div>
            </div>

            <!-- SEKSI 2: DURASI & MASA SEWA -->
            <div class="form-section-card">
              <div class="section-card-title">
                <i class='bx bx-calendar-check'></i> Durasi & Masa Sewa
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Kapan Mulai Sewa? <span class="required-star">*</span></label>
                  <input type="date" v-model="formMember.startDate" @change="updateCalculatedFields" required />
                </div>
                <div class="form-group">
                  <label>Berapa Bulan Mau Sewa? <span class="required-star">*</span></label>
                  <select v-model.number="formMember.durationMonths" class="form-control" @change="updateCalculatedFields" required>
                    <option :value="1">1 Bulan</option>
                    <option :value="3">3 Bulan (1 Triwulan)</option>
                    <option :value="6">6 Bulan (1 Semester)</option>
                    <option :value="12">12 Bulan (1 Tahun)</option>
                  </select>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Tanggal Selesai Sewa (Otomatis)</label>
                  <div class="readonly-input-wrapper">
                    <input type="date" v-model="formMember.endDate" readonly class="form-control readonly-input" />
                    <span class="auto-calc-tag"><i class='bx bx-bot'></i> Auto</span>
                  </div>
                </div>
                <div class="form-group">
                  <label>Harga Sewa per Bulan (Rp)</label>
                  <input type="number" v-model.number="formMember.monthlyRent" class="form-control" placeholder="Contoh: 600000" />
                </div>
              </div>
            </div>

            <!-- SEKSI 3: PRATINJAU RINGKASAN SEWA -->
            <div class="rental-preview-box" v-if="formMember.startDate && formMember.endDate">
              <div class="preview-item">
                <i class='bx bx-calendar-event icon-accent'></i>
                <div>
                  <span class="preview-label">Periode Masa Sewa</span>
                  <strong>{{ formatDateIndo(formMember.startDate) }} s.d. {{ formatDateIndo(formMember.endDate) }}</strong>
                  <span class="duration-badge">{{ formMember.durationMonths || 1 }} Bulan</span>
                </div>
              </div>
              <div class="preview-item">
                <i class='bx bx-wallet icon-accent'></i>
                <div>
                  <span class="preview-label">Estimasi Total Biaya</span>
                  <strong>{{ formatRupiah((formMember.monthlyRent || 0) * (formMember.durationMonths || 1)) }}</strong>
                  <span class="monthly-sub">({{ formatRupiah(formMember.monthlyRent) }} / bulan)</span>
                </div>
              </div>
            </div>

          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-ghost" @click="closeAddModal">Batal</button>
            <button type="submit" class="btn btn-primary"><i class='bx bx-check-circle'></i> Simpan Data Penyewa</button>
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
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn-action {
  padding: 7px 14px;
  border-radius: var(--radius-full);
  border: 1px solid transparent;
  cursor: pointer;
  font-size: 0.78rem;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  white-space: nowrap;
  line-height: 1;
}

.btn-detail {
  background: #F4EBE2;
  color: #541A1A;
  border: 1px solid #E5D5C5;
  text-decoration: none;
}

.btn-detail:hover {
  background: #541A1A;
  color: #ffffff;
  border-color: #541A1A;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(84, 26, 26, 0.25);
}

.btn-delete {
  background: #FEF2F2;
  color: #DC2626;
  border: 1px solid #FCA5A5;
}

.btn-delete:hover {
  background: #EF4444;
  color: #ffffff;
  border-color: #EF4444;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.empty-cell {
  text-align: center;
  padding: 30px;
  color: var(--text-muted);
}

/* MODAL STYLES & ACCESSIBLE SMOOTH SCROLLING */
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
  max-width: 680px;
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

.add-member-form {
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

.section-card-title i {
  font-size: 1.15rem;
  color: #541A1A;
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

.mobile-tenant-cards {
  display: none;
  flex-direction: column;
  gap: 12px;
}

.mobile-tenant-card {
  background: var(--off-white);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.tenant-card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.tenant-name {
  display: block;
  font-size: 1rem;
  color: var(--dark);
}

.tenant-card-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-top: 8px;
  border-top: 1px dashed var(--border);
  font-size: 0.85rem;
}

.sub-address {
  font-size: 0.78rem;
  color: var(--text-muted);
}

.tenant-room-badge {
  font-weight: 700;
  font-size: 0.85rem;
  color: var(--primary);
  display: flex;
  align-items: center;
  gap: 4px;
}

.rent-period-sub {
  font-size: 0.78rem;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 2px;
}

.badge-duration-small {
  background: var(--tertiary-light);
  color: var(--primary);
  font-weight: 700;
  font-size: 0.7rem;
  padding: 1px 6px;
  border-radius: var(--radius-full);
}

.text-rent {
  color: var(--primary);
  font-size: 0.92rem;
}

.form-divider-title {
  margin: 16px 0 8px;
  border-top: 1px dashed var(--border);
  padding-top: 14px;
}

.form-divider-title span {
  font-weight: 700;
  font-size: 0.88rem;
  color: var(--primary);
  display: flex;
  align-items: center;
  gap: 6px;
}

.required-star {
  color: #DC2626;
}

.readonly-input-wrapper {
  position: relative;
}

.readonly-input {
  background: var(--off-white);
  color: var(--dark);
  font-weight: 600;
  cursor: not-allowed;
}

.auto-calc-tag {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.72rem;
  font-weight: 700;
  background: #DCFCE7;
  color: #15803D;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  pointer-events: none;
  display: flex;
  align-items: center;
  gap: 3px;
}

.rental-preview-box {
  background: #FFF8F0;
  border: 1px solid #F97316;
  border-radius: var(--radius-md);
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 6px;
}

.preview-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.85rem;
}

.icon-accent {
  font-size: 1.4rem;
  color: #EA580C;
}

.preview-label {
  display: block;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.duration-badge {
  display: inline-block;
  margin-left: 8px;
  padding: 2px 8px;
  background: #FFEDD5;
  color: #C2410C;
  font-weight: 700;
  font-size: 0.75rem;
  border-radius: var(--radius-full);
}

.monthly-sub {
  font-size: 0.78rem;
  color: var(--text-muted);
  margin-left: 6px;
}

@media (max-width: 992px) {
  .admin-main { margin-left: 0; padding: 20px; }
  .table-wrapper { display: none !important; }
  .mobile-tenant-cards { display: flex; }
}

@media (max-width: 768px) {
  .admin-main { padding: 16px; }
  .admin-header { flex-direction: column; align-items: flex-start; gap: 12px; margin-bottom: 20px; }
  .admin-header h1 { font-size: 1.4rem; }
  .admin-header button { width: 100%; justify-content: center; }
  .admin-card { padding: 16px; }
  .admin-card-header { flex-direction: column; align-items: flex-start; gap: 12px; }
  .search-box { width: 100%; }
  .form-row { grid-template-columns: 1fr; gap: 12px; }
  .modal-box { max-width: 92vw; max-height: 90vh; overflow-y: auto; padding: 24px 16px; }
  .modal-footer { flex-direction: column; }
  .modal-footer button { width: 100%; }
}

@media (max-width: 480px) {
  .admin-main { padding: 12px; }
  .admin-header h1 { font-size: 1.2rem; }
  .admin-header p { font-size: 0.78rem; }
  .admin-card { padding: 12px; border-radius: var(--radius-md); }
  .modal-box { max-width: 96vw; padding: 20px 12px; border-radius: var(--radius-lg); }
}
</style>
