<script setup lang="ts">
import { ref, computed } from 'vue'
import AdminSidebar from '../../components/layout/AdminSidebar.vue'
import { RouterLink } from 'vue-router'
import { useAuth, type User } from '../../composables/useAuth'
import { useDataStore, getRoomPriceByDuration } from '../../composables/useDataStore'

const { tenants, addMember, deleteMember } = useAuth()
const { rooms, getRoomById, getBuildingName, updateRoom, addPayment, addRental, getActiveRentalByMemberId } = useDataStore()

const searchQuery = ref('')
const isAddModalOpen = ref(false)
const isSuccessModalOpen = ref(false)
const successNotice = ref('')

const createdAccountInfo = ref<{
  name: string
  username: string
  password: string
  phone: string
  roomId: string
  roomInfo: string
  startDate: string
  endDate: string
  duration: number
  totalAmount: number
  waUrl: string
  portalUrl: string
} | null>(null)

const copyToClipboard = async (text: string, label: string) => {
  try {
    await navigator.clipboard.writeText(text)
    alert(`${label} berhasil disalin ke clipboard!`)
  } catch {
    alert(`Gagal menyalin: ${text}`)
  }
}

// Helper untuk menghitung Tanggal Selesai Sewa secara otomatis (Berdasarkan Mulai Sewa + Durasi Bulan)
const computeEndDate = (startDateStr: string, months: number): string => {
  if (!startDateStr || !months) return ''
  const parts = startDateStr.split('-')
  if (parts.length !== 3) return ''
  const [yearStr, monthStr, dayStr] = parts
  if (!yearStr || !monthStr || !dayStr) return ''
  const year = parseInt(yearStr, 10)
  const month = parseInt(monthStr, 10)
  const day = parseInt(dayStr, 10)
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

// Add-on State untuk Tambah Penyewa Baru
const addonExtraPerson = ref<boolean>(false)
const addonCarParking = ref<boolean>(false)

// List hanya kamar yang statusnya 'available' (Tersedia)
const availableRooms = computed(() => {
  return rooms.value.filter(r => r.status === 'available')
})

// Input Sanitizers (Hanya angka & batas digit)
const onNikInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  formMember.value.nik = target.value.replace(/\D/g, '').slice(0, 16)
}

const onPhoneInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  formMember.value.phone = target.value.replace(/\D/g, '').slice(0, 13)
}

const onParentPhoneInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  formMember.value.parentPhone = target.value.replace(/\D/g, '').slice(0, 13)
}

// Form Tambah Member Baru (Identitas + Paket Sewa Pertama)
const formMember = ref({
  name: '',
  username: '',
  password: '',
  email: '',
  nik: '',
  address: '',
  phone: '',
  birthDate: '',
  parentPhone: '',
  roomId: '',
  durationMonths: 12,
  startDate: todayStr,
  endDate: computeEndDate(todayStr, 12)
})

// Perhitungan Harga Sewa Total dari JSON sesuai durasi + Add-on
const baseRoomPrice = computed(() => {
  const selectedRoom = getRoomById(formMember.value.roomId || '')
  const duration = Number(formMember.value.durationMonths) || 1
  return selectedRoom ? getRoomPriceByDuration(selectedRoom, duration) : 0
})

const totalAddonPrice = computed(() => {
  const duration = Number(formMember.value.durationMonths) || 1
  let sum = 0
  if (addonExtraPerson.value) sum += 250000 * duration
  if (addonCarParking.value) sum += 50000 * duration
  return sum
})

const totalBiaya = computed(() => {
  return baseRoomPrice.value + totalAddonPrice.value
})

// Update tanggal selesai saat tanggal mulai atau durasi berubah
const updateCalculatedFields = () => {
  const months = Number(formMember.value.durationMonths) || 1
  if (formMember.value.startDate) {
    formMember.value.endDate = computeEndDate(formMember.value.startDate, months)
  }
}

const filteredTenants = computed(() => {
  if (!searchQuery.value) return tenants.value
  const q = searchQuery.value.toLowerCase()
  return tenants.value.filter(t => {
    const rent = getActiveRentalByMemberId(t.id)
    const rm = rent ? getRoomById(rent.roomId) : null
    const roomTxt = rm ? `kamar ${rm.number} ${getBuildingName(rm.buildingId)}` : ''
    return t.name.toLowerCase().includes(q) || 
      t.username.toLowerCase().includes(q) ||
      (t.nik && t.nik.includes(q)) ||
      (t.address && t.address.toLowerCase().includes(q)) ||
      (t.phone && t.phone.includes(q)) ||
      roomTxt.toLowerCase().includes(q)
  })
})

const openAddModal = () => {
  isAddModalOpen.value = true
  successNotice.value = ''
  addonExtraPerson.value = false
  addonCarParking.value = false
  
  const defaultRoom = availableRooms.value[0]
  const defaultRoomId = defaultRoom ? defaultRoom.id : ''
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
    durationMonths: defaultDuration,
    startDate: todayStr,
    endDate: computeEndDate(todayStr, defaultDuration)
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

  if (formMember.value.nik && formMember.value.nik.length !== 16) {
    alert('Nomor NIK KTP harus tepat 16 digit angka.')
    return
  }

  if (!formMember.value.roomId) {
    alert('Mohon pilih kamar yang tersedia terlebih dahulu.')
    return
  }

  // Pastikan Tanggal Selesai terhitung
  if (!formMember.value.endDate) {
    formMember.value.endDate = computeEndDate(formMember.value.startDate || todayStr, formMember.value.durationMonths || 12)
  }

  const duration = Number(formMember.value.durationMonths) || 12
  const totalAmount = totalBiaya.value

  const created = addMember({
    name: formMember.value.name,
    username: formMember.value.username,
    password: formMember.value.password,
    email: formMember.value.email || `${formMember.value.username}@sekarspace.com`,
    nik: formMember.value.nik,
    address: formMember.value.address,
    phone: formMember.value.phone,
    birthDate: formMember.value.birthDate,
    parentPhone: formMember.value.parentPhone
  })

  // Update status kamar menjadi occupied
  if (formMember.value.roomId) {
    updateRoom(formMember.value.roomId, { status: 'occupied' })
  }

  // Catat pembayaran LUNAS otomatis di awal pendaftaran akun baru
  const startDateFormatted = formatDateIndo(formMember.value.startDate)
  const endDateFormatted = formatDateIndo(formMember.value.endDate)

  const addonsList = []
  if (addonExtraPerson.value) addonsList.push(`Tambahan 1 Orang (${formatRupiah(250000 * duration)})`)
  if (addonCarParking.value) addonsList.push(`Parkir Mobil (${formatRupiah(50000 * duration)})`)
  const addonsNote = addonsList.length > 0 ? ` [Layanan Tambahan: ${addonsList.join(', ')}]` : ''

  addPayment({
    memberId: created.id,
    period: `Sewa Awal ${duration} Bulan (${startDateFormatted} - ${endDateFormatted})`,
    amount: totalAmount,
    durationMonths: duration,
    method: 'Pembayaran Awal Kontrak (Lunas)',
    date: formMember.value.startDate || todayStr,
    dueDate: formMember.value.endDate,
    status: 'paid',
    notes: `Pembayaran LUNAS pada pendaftaran akun penyewa baru.${addonsNote}`
  })

  // Catat History Penyewaan ke rentals.json
  addRental({
    memberId: created.id,
    roomId: formMember.value.roomId,
    startDate: formMember.value.startDate || todayStr,
    endDate: formMember.value.endDate,
    durationMonths: duration,
    basePrice: baseRoomPrice.value,
    addonPrice: totalAddonPrice.value,
    totalAmount: totalAmount,
    addons: addonsList,
    status: 'active'
  })

  // Siapkan URL & Pesan Otomatis WhatsApp
  const roomInfoStr = getTenantRoomInfo(created.id)
  const waUrl = buildWelcomeWaUrl({
    name: created.name,
    phone: created.phone,
    username: created.username,
    password: formMember.value.password,
    roomInfo: roomInfoStr,
    startDate: formMember.value.startDate || todayStr,
    endDate: formMember.value.endDate,
    duration: duration,
    totalAmount: totalAmount
  })

  createdAccountInfo.value = {
    name: created.name,
    username: created.username,
    password: formMember.value.password,
    phone: created.phone || '',
    roomId: formMember.value.roomId,
    roomInfo: roomInfoStr,
    startDate: formMember.value.startDate || todayStr,
    endDate: formMember.value.endDate,
    duration: duration,
    totalAmount: totalAmount,
    waUrl: waUrl,
    portalUrl: `${window.location.origin}/login`
  }

  successNotice.value = `Akun Penyewa "${created.name}" (@${created.username}) berhasil dibuat & pembayaran sebesar ${formatRupiah(totalAmount)} tercatat LUNAS!`
  closeAddModal()
  isSuccessModalOpen.value = true

  // Otomatis buka chat WhatsApp dengan pesan template lengkap
  if (waUrl) {
    window.open(waUrl, '_blank')
  }

  setTimeout(() => {
    successNotice.value = ''
  }, 6000)
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
  const [yearStr, monthStr, dayStr] = parts
  if (!yearStr || !monthStr || !dayStr) return dateStr
  const monthsIndo = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des']
  const day = parseInt(dayStr, 10)
  const monthIdx = parseInt(monthStr, 10) - 1
  return `${day} ${monthsIndo[monthIdx] || ''} ${yearStr}`
}

const formatRupiah = (val?: number) => {
  if (!val) return 'Rp 0'
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)
}

const getTenantActiveRental = (memberId: string) => {
  return getActiveRentalByMemberId(memberId)
}

const getTenantRoomInfo = (memberId: string) => {
  const r = getTenantActiveRental(memberId)
  if (!r) return 'Belum Pilih Kamar'
  const rm = getRoomById(r.roomId)
  return rm ? `Kamar ${rm.number} (${getBuildingName(rm.buildingId)})` : `Kamar ${r.roomId}`
}

const getTenantRentPeriod = (memberId: string) => {
  const r = getTenantActiveRental(memberId)
  if (!r) return '-'
  return `${formatDateIndo(r.startDate)} — ${formatDateIndo(r.endDate)}`
}

const getTenantDuration = (memberId: string) => {
  const r = getTenantActiveRental(memberId)
  return r ? r.durationMonths : 0
}

const getTenantMonthlyRent = (memberId: string) => {
  const r = getTenantActiveRental(memberId)
  const rm = r ? getRoomById(r.roomId) : null
  return rm ? getRoomPriceByDuration(rm, 1) : 700000
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

const buildWelcomeWaUrl = (data: {
  name: string
  phone?: string
  username: string
  password?: string
  roomInfo: string
  startDate: string
  endDate: string
  duration: number
  totalAmount: number
}) => {
  const phone = formatWaPhone(data.phone)
  const portalUrl = `${window.location.origin}/login`
  const text = `Halo Kak ${data.name}, Selamat Datang di Kost Muslimah Sekar Space! 🎉✨

Pembayaran sewa kamar kost Anda sebesar ${formatRupiah(data.totalAmount)} telah *TERVERIFIKASI LUNAS* di sistem kami.

🏠 *Informasi Kamar & Sewa:*
• Kamar: ${data.roomInfo}
• Periode Sewa: ${formatDateIndo(data.startDate)} s.d. ${formatDateIndo(data.endDate)} (${data.duration} Bulan)

🔐 *Akses Akun Portal Penyewa:*
• Link Portal: ${portalUrl}
• Username: *${data.username}*
• Password: *${data.password || '-'}*

Akun Anda sudah aktif dan sudah bisa langsung diakses untuk melihat detail kamar, riwayat pembayaran lunas, serta layanan bantuan / pengaduan. Terima kasih telah bergabung dengan Sekar Space! 🙏🌸`

  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
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
                  <div class="tenant-room-badge"><i class='bx bxs-home-heart'></i> {{ getTenantRoomInfo(t.id) }}</div>
                  <div class="rent-period-sub">
                    <i class='bx bx-calendar'></i> {{ getTenantRentPeriod(t.id) }}
                    <span v-if="getTenantDuration(t.id)" class="badge-duration-small">{{ getTenantDuration(t.id) }} Bln</span>
                  </div>
                </td>
                <td>
                  <strong class="text-rent">{{ formatRupiah(getTenantMonthlyRent(t.id)) }}</strong>
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
              <div class="info-row"><i class='bx bxs-home-heart'></i> <span>Kamar:</span> <strong>{{ getTenantRoomInfo(t.id) }}</strong></div>
              <div class="info-row"><i class='bx bx-calendar'></i> <span>Masa Sewa:</span> <span>{{ getTenantRentPeriod(t.id) }} ({{ getTenantDuration(t.id) }} Bln)</span></div>
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
                  <label>NIK KTP <sub>(16 digit)</sub></label>
                  <input 
                    type="text" 
                    :value="formMember.nik" 
                    @input="onNikInput" 
                    maxlength="16" 
                    inputmode="numeric" 
                    placeholder="Contoh: 3401234567890001" 
                    :class="{ 'input-warning': formMember.nik && formMember.nik.length < 16 }"
                  />
                  <small v-if="formMember.nik && formMember.nik.length < 16" class="nik-warning-msg">
                    <i class='bx bx-error-circle'></i> NIK harus tepat 16 digit (saat ini: {{ formMember.nik.length }}/16 digit)
                  </small>
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
                  <label>No Telepon / WhatsApp <sub>(maks. 13 digit)</sub></label>
                  <input 
                    type="tel" 
                    :value="formMember.phone" 
                    @input="onPhoneInput" 
                    maxlength="13" 
                    inputmode="numeric" 
                    placeholder="Contoh: 081234567890" 
                  />
                </div>
                <div class="form-group">
                  <label>No Telepon Orang Tua <sub>(maks. 13 digit)</sub></label>
                  <input 
                    type="tel" 
                    :value="formMember.parentPhone" 
                    @input="onParentPhoneInput" 
                    maxlength="13" 
                    inputmode="numeric" 
                    placeholder="Contoh: 081298765432" 
                  />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Tanggal Lahir</label>
                  <input type="date" v-model="formMember.birthDate" />
                </div>
                <div class="form-group">
                  <label>Pilih Kamar Tersedia <span class="required-star">*</span></label>
                  <select v-model="formMember.roomId" class="form-control" @change="updateCalculatedFields" required>
                    <option value="" disabled>-- Pilih Kamar Tersedia --</option>
                    <option v-for="r in availableRooms" :key="r.id" :value="r.id">
                      Kamar {{ r.number }} ({{ getBuildingName(r.buildingId) }} - {{ r.typeName }})
                    </option>
                  </select>
                  <small v-if="availableRooms.length === 0" style="color: #DC2626; font-size: 0.76rem; display: block; margin-top: 4px;">
                    * Tidak ada kamar berstatus tersedia saat ini.
                  </small>
                </div>
              </div>
            </div>

            <!-- SEKSI 2: DURASI & LAYANAN SEWA -->
            <div class="form-section-card">
              <div class="section-card-title">
                <i class='bx bx-calendar-check'></i> Durasi & Paket Sewa
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Kapan Mulai Sewa? <span class="required-star">*</span></label>
                  <input type="date" v-model="formMember.startDate" @change="updateCalculatedFields" required />
                </div>
                <div class="form-group">
                  <label>Paket Durasi Sewa <span class="required-star">*</span></label>
                  <select v-model.number="formMember.durationMonths" class="form-control" @change="updateCalculatedFields" required>
                    <option :value="1">1 Bulan</option>
                    <option :value="3">3 Bulan</option>
                    <option :value="6">6 Bulan</option>
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
                  <label>Harga Paket Kamar</label>
                  <input type="text" :value="formatRupiah(baseRoomPrice)" readonly class="form-control readonly-input" />
                </div>
              </div>

              <!-- PILIHAN LAYANAN TAMBAHAN (ADD-ON) -->
              <div class="form-group" style="margin-top: 4px;">
                <label>Layanan Tambahan (Add-on)</label>
                <div class="addon-selection-grid">
                  <label class="addon-checkbox-card" :class="{ checked: addonExtraPerson }">
                    <input type="checkbox" v-model="addonExtraPerson" @change="updateCalculatedFields" />
                    <div class="addon-card-text">
                      <strong><i class='bx bx-user-plus'></i> Tambahan 1 Orang</strong>
                      <span>+Rp 250.000 / bulan (Total: +{{ formatRupiah(250000 * (formMember.durationMonths || 1)) }})</span>
                    </div>
                  </label>
                  <label class="addon-checkbox-card" :class="{ checked: addonCarParking }">
                    <input type="checkbox" v-model="addonCarParking" @change="updateCalculatedFields" />
                    <div class="addon-card-text">
                      <strong><i class='bx bx-car'></i> Parkir Mobil Pribadi</strong>
                      <span>+Rp 50.000 / bulan (Total: +{{ formatRupiah(50000 * (formMember.durationMonths || 1)) }})</span>
                    </div>
                  </label>
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
                <div style="flex: 1;">
                  <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
                    <div>
                      <span class="preview-label">Total Biaya</span>
                      <strong class="total-biaya-amount">{{ formatRupiah(totalBiaya) }}</strong>
                      <span class="monthly-sub">(Sewa: {{ formatRupiah(baseRoomPrice) }} <template v-if="totalAddonPrice > 0"> + Add-on: {{ formatRupiah(totalAddonPrice) }}</template>)</span>
                    </div>
                    <span class="badge-status-lunas">
                      <i class='bx bx-check-circle'></i> Status: LUNAS
                    </span>
                  </div>
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

    <!-- MODAL SUKSES & INFO AKUN PENYEWA (NOTIFIKASI WHATSAPP) -->
    <div v-if="isSuccessModalOpen && createdAccountInfo" class="modal-backdrop" @click.self="isSuccessModalOpen = false">
      <div class="modal-box success-account-modal">
        <div class="success-modal-header">
          <div class="success-icon-badge">
            <i class='bx bx-check-double'></i>
          </div>
          <h2>Pendaftaran & Akun Berhasil Dibuat!</h2>
          <p>Pembayaran sewa telah <strong>TERVERIFIKASI LUNAS</strong> dan akun portal sudah aktif.</p>
        </div>

        <div class="success-modal-body">
          <div class="account-summary-card">
            <div class="acc-summary-row">
              <span>Nama Penyewa:</span>
              <strong>{{ createdAccountInfo.name }}</strong>
            </div>
            <div class="acc-summary-row">
              <span>Penempatan Kamar:</span>
              <strong>{{ createdAccountInfo.roomInfo }}</strong>
            </div>
            <div class="acc-summary-row">
              <span>Masa Sewa (Durasi):</span>
              <strong>{{ formatDateIndo(createdAccountInfo.startDate) }} — {{ formatDateIndo(createdAccountInfo.endDate) }} ({{ createdAccountInfo.duration }} Bln)</strong>
            </div>
            <div class="acc-summary-row">
              <span>Status Pembayaran:</span>
              <span class="badge-status-lunas"><i class='bx bx-check-circle'></i> LUNAS ({{ formatRupiah(createdAccountInfo.totalAmount) }})</span>
            </div>
          </div>

          <!-- CREDENTIALS COPY BOX -->
          <div class="credentials-box">
            <div class="credentials-box-title">
              <i class='bx bx-key'></i> Informasi Akun Login Portal Penyewa
            </div>

            <div class="credential-item">
              <span class="cred-label">Link Portal:</span>
              <div class="cred-input-wrap">
                <input type="text" :value="createdAccountInfo.portalUrl" readonly class="cred-input" />
                <button type="button" class="btn-copy-sm" @click="copyToClipboard(createdAccountInfo.portalUrl, 'Link Portal')" title="Salin Link">
                  <i class='bx bx-copy'></i>
                </button>
              </div>
            </div>

            <div class="credential-item">
              <span class="cred-label">Username:</span>
              <div class="cred-input-wrap">
                <input type="text" :value="createdAccountInfo.username" readonly class="cred-input" />
                <button type="button" class="btn-copy-sm" @click="copyToClipboard(createdAccountInfo.username, 'Username')" title="Salin Username">
                  <i class='bx bx-copy'></i>
                </button>
              </div>
            </div>

            <div class="credential-item">
              <span class="cred-label">Password:</span>
              <div class="cred-input-wrap">
                <input type="text" :value="createdAccountInfo.password" readonly class="cred-input" />
                <button type="button" class="btn-copy-sm" @click="copyToClipboard(createdAccountInfo.password, 'Password')" title="Salin Password">
                  <i class='bx bx-copy'></i>
                </button>
              </div>
            </div>
          </div>

          <div class="wa-notice-box">
            <i class='bx bxl-whatsapp wa-icon-big'></i>
            <div>
              <strong>Pesan WhatsApp Otomatis</strong>
              <p>Pesan verifikasi pembayaran dan informasi login di atas telah disiapkan. Klik tombol di bawah jika tab WhatsApp belum terbuka.</p>
            </div>
          </div>
        </div>

        <div class="modal-footer success-modal-footer">
          <button type="button" class="btn btn-ghost" @click="isSuccessModalOpen = false">Tutup</button>
          <a :href="createdAccountInfo.waUrl" target="_blank" rel="noopener" class="btn btn-whatsapp-send">
            <i class='bx bxl-whatsapp'></i> Kirim Pesan / Buka WhatsApp
          </a>
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

.form-group label sub {
  font-size: 0.72rem;
  color: var(--text-muted);
  font-weight: normal;
  vertical-align: baseline;
  margin-left: 3px;
}

.form-group input.input-warning {
  border-color: #F97316;
  background: #FFFBF7;
}

.nik-warning-msg {
  color: #EA580C;
  font-size: 0.74rem;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
  font-weight: 500;
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

.total-biaya-amount {
  font-size: 1.25rem;
  color: #541A1A;
  font-family: var(--font-heading);
}

.badge-status-lunas {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: #DCFCE7;
  color: #15803D;
  border: 1px solid #86EFAC;
  padding: 4px 12px;
  border-radius: var(--radius-full);
  font-weight: 700;
  font-size: 0.8rem;
  box-shadow: 0 1px 3px rgba(22, 101, 52, 0.1);
}

.addon-selection-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.addon-checkbox-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  background: var(--white);
  border: 1.5px solid var(--border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
}

.addon-checkbox-card:hover {
  border-color: var(--secondary);
  background: #FAF7F2;
}

.addon-checkbox-card.checked {
  border-color: #541A1A;
  background: #F8EFEA;
}

.addon-checkbox-card input {
  width: 18px;
  height: 18px;
  accent-color: #541A1A;
  cursor: pointer;
  flex-shrink: 0;
}

.addon-card-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.addon-card-text strong {
  font-size: 0.84rem;
  color: var(--dark);
  display: flex;
  align-items: center;
  gap: 6px;
}

.addon-card-text strong i {
  color: #541A1A;
  font-size: 1rem;
}

.addon-card-text span {
  font-size: 0.74rem;
  color: var(--text-muted);
}

/* SUCCESS ACCOUNT MODAL STYLES */
.success-account-modal {
  max-width: 580px;
}

.success-modal-header {
  text-align: center;
  margin-bottom: 20px;
}

.success-icon-badge {
  width: 56px;
  height: 56px;
  background: #DCFCE7;
  color: #16A34A;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  margin: 0 auto 12px;
  box-shadow: 0 4px 12px rgba(22, 163, 74, 0.2);
}

.success-modal-header h2 {
  font-size: 1.3rem;
  color: var(--dark);
  margin-bottom: 4px;
}

.success-modal-header p {
  font-size: 0.86rem;
  color: var(--text-muted);
}

.success-modal-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.account-summary-card {
  background: #FAFAFA;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 0.85rem;
}

.acc-summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.acc-summary-row span {
  color: var(--text-muted);
}

.credentials-box {
  background: #FFFDF9;
  border: 1.5px dashed var(--secondary);
  border-radius: var(--radius-md);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.credentials-box-title {
  font-size: 0.88rem;
  font-weight: 700;
  color: #541A1A;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 2px;
}

.credential-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.cred-label {
  font-size: 0.76rem;
  font-weight: 600;
  color: var(--text-muted);
}

.cred-input-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
}

.cred-input {
  flex: 1;
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: var(--white);
  font-size: 0.85rem;
  font-family: monospace;
  color: var(--dark);
  font-weight: 600;
}

.btn-copy-sm {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid var(--border);
  background: var(--white);
  border-radius: var(--radius-sm);
  color: var(--dark);
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-copy-sm:hover {
  background: #541A1A;
  color: var(--white);
  border-color: #541A1A;
}

.wa-notice-box {
  background: #F0FDF4;
  border: 1px solid #BBF7D0;
  border-radius: var(--radius-md);
  padding: 12px 14px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.wa-icon-big {
  font-size: 1.8rem;
  color: #16A34A;
  flex-shrink: 0;
  margin-top: 2px;
}

.wa-notice-box strong {
  font-size: 0.84rem;
  color: #166534;
  display: block;
}

.wa-notice-box p {
  font-size: 0.78rem;
  color: #15803D;
  margin-top: 2px;
  line-height: 1.4;
}

.success-modal-footer {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn-whatsapp-send {
  background: #25D366;
  color: #FFFFFF !important;
  font-weight: 700;
  border: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  border-radius: var(--radius-md);
  text-decoration: none;
  transition: background 0.2s ease;
}

.btn-whatsapp-send:hover {
  background: #1EBE5D;
}

@media (max-width: 992px) {
  .addon-selection-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }
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
