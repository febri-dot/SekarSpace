<script setup lang="ts">
import { ref, computed } from 'vue'
import AdminSidebar from '../../components/layout/AdminSidebar.vue'
import { useDataStore, type RoomData } from '../../composables/useDataStore'

const { rooms, buildings, getBuildingName, addRoom, updateRoom, deleteRoom } = useDataStore()

const selectedBuildingFilter = ref<string>('all')
const isAddRoomModalOpen = ref(false)
const editingRoom = ref<RoomData | null>(null)
const noticeMessage = ref('')

// Form Tambah/Edit Kamar
const formRoom = ref({
  number: 'A15',
  buildingId: 'bld-a',
  floor: 1,
  typeId: 'km-dalam' as 'km-dalam' | 'km-luar',
  typeName: 'Kamar Mandi Dalam',
  price: 850000,
  price1Month: 850000,
  price3Months: 2000000,
  price6Months: 4000000,
  price12Months: 8000000,
  status: 'available' as 'available' | 'occupied',
  size: '3 x 4 meter'
})

const filteredRooms = computed(() => {
  if (selectedBuildingFilter.value === 'all') return rooms.value
  return rooms.value.filter(r => r.buildingId === selectedBuildingFilter.value)
})

const openAddModal = () => {
  editingRoom.value = null
  formRoom.value = {
    number: `A${rooms.value.length + 1}`,
    buildingId: 'bld-a',
    floor: 1,
    typeId: 'km-dalam',
    typeName: 'Kamar Mandi Dalam',
    price: 850000,
    price1Month: 850000,
    price3Months: 2000000,
    price6Months: 4000000,
    price12Months: 8000000,
    status: 'available',
    size: '3 x 4 meter'
  }
  isAddRoomModalOpen.value = true
}

const openEditModal = (room: RoomData) => {
  editingRoom.value = room
  const base1 = room.price1Month || room.price || 600000
  formRoom.value = {
    number: room.number,
    buildingId: room.buildingId,
    floor: room.floor,
    typeId: room.typeId,
    typeName: room.typeName,
    price: base1,
    price1Month: base1,
    price3Months: room.price3Months || (base1 * 3),
    price6Months: room.price6Months || (base1 * 6),
    price12Months: room.price12Months || (base1 * 12),
    status: room.status,
    size: room.size
  }
  isAddRoomModalOpen.value = true
}

const closeRoomModal = () => {
  isAddRoomModalOpen.value = false
  editingRoom.value = null
}

const handleSaveRoom = () => {
  if (!formRoom.value.number || !formRoom.value.price1Month) {
    alert('Mohon lengkapi nomor kamar dan tarif sewa.')
    return
  }

  const tName = formRoom.value.typeId === 'km-dalam' ? 'Kamar Mandi Dalam' : 'Kamar Mandi Luar'
  const p1 = Number(formRoom.value.price1Month)

  if (editingRoom.value) {
    updateRoom(editingRoom.value.id, {
      number: formRoom.value.number,
      buildingId: formRoom.value.buildingId,
      floor: Number(formRoom.value.floor),
      typeId: formRoom.value.typeId,
      typeName: tName,
      price: p1,
      price1Month: p1,
      price3Months: Number(formRoom.value.price3Months),
      price6Months: Number(formRoom.value.price6Months),
      price12Months: Number(formRoom.value.price12Months),
      status: formRoom.value.status,
      size: formRoom.value.size
    })
    noticeMessage.value = `Data Kamar ${formRoom.value.number} berhasil diperbarui!`
  } else {
    addRoom({
      number: formRoom.value.number,
      buildingId: formRoom.value.buildingId,
      floor: Number(formRoom.value.floor),
      typeId: formRoom.value.typeId,
      typeName: tName,
      price: p1,
      price1Month: p1,
      price3Months: Number(formRoom.value.price3Months),
      price6Months: Number(formRoom.value.price6Months),
      price12Months: Number(formRoom.value.price12Months),
      status: formRoom.value.status,
      size: formRoom.value.size,
      features: ['Kasur Springbed', 'Lemari Pakaian', 'Meja Belajar', 'WiFi 100Mbps']
    })
    noticeMessage.value = `Kamar Baru ${formRoom.value.number} berhasil ditambahkan!`
  }

  closeRoomModal()
  setTimeout(() => {
    noticeMessage.value = ''
  }, 4000)
}

const toggleStatus = (room: RoomData) => {
  const newStatus = room.status === 'available' ? 'occupied' : 'available'
  updateRoom(room.id, { status: newStatus })
  noticeMessage.value = `Status Kamar ${room.number} diubah menjadi ${newStatus === 'available' ? 'Tersedia' : 'Terisi'}`
  setTimeout(() => {
    noticeMessage.value = ''
  }, 3000)
}

const handleDeleteRoom = (room: RoomData) => {
  if (confirm(`Hapus Kamar ${room.number} dari master data?`)) {
    deleteRoom(room.id)
    noticeMessage.value = `Kamar ${room.number} telah dihapus.`
    setTimeout(() => {
      noticeMessage.value = ''
    }, 3000)
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
          <span class="header-tag">Property & Units Console</span>
          <h1>Kelola <span class="text-gradient">Data & Status Kamar</span></h1>
          <p>Atur daftar kamar, gedung hunian, tarif sewa bulanan, dan status ketersediaan.</p>
        </div>
        <button class="btn btn-primary" @click="openAddModal">
          <i class='bx bx-plus-circle'></i> Tambah Kamar Baru
        </button>
      </header>

      <!-- NOTICE ALERT -->
      <div v-if="noticeMessage" class="notice-alert">
        <i class='bx bx-check-circle'></i> {{ noticeMessage }}
      </div>

      <!-- FILTER BAR -->
      <div class="filter-bar">
        <div class="building-filter-btns">
          <button 
            class="filter-pill"
            :class="{ active: selectedBuildingFilter === 'all' }"
            @click="selectedBuildingFilter = 'all'"
          >
            Semua Gedung ({{ rooms.length }})
          </button>
          <button 
            v-for="bld in buildings"
            :key="bld.id"
            class="filter-pill"
            :class="{ active: selectedBuildingFilter === bld.id }"
            @click="selectedBuildingFilter = bld.id"
          >
            {{ bld.name }} ({{ rooms.filter(r => r.buildingId === bld.id).length }})
          </button>
        </div>
      </div>

      <!-- ROOMS GRID DISPLAY -->
      <div class="rooms-grid">
        <div 
          v-for="room in filteredRooms" 
          :key="room.id"
          class="room-card"
          :class="room.status"
        >
          <div class="room-card-header">
            <span class="room-number-tag">Kamar {{ room.number }}</span>
            <span class="status-badge" :class="room.status">
              {{ room.status === 'available' ? 'Tersedia' : 'Terisi' }}
            </span>
          </div>

          <div class="room-details">
            <p class="bld-name"><i class='bx bx-building-house'></i> {{ getBuildingName(room.buildingId) }} (Lantai {{ room.floor }})</p>
            <p class="type-name">
              <i :class="room.typeId === 'km-dalam' ? 'bx bx-bath' : 'bx bx-door-open'"></i>
              {{ room.typeName }} · {{ room.size }}
            </p>
            <div class="price-tag">{{ formatRupiah(room.price) }} <small>/ bulan</small></div>
          </div>

          <div class="room-card-footer">
            <button 
              class="btn-toggle-status" 
              :class="room.status === 'available' ? 'btn-mark-occ' : 'btn-mark-avail'"
              @click="toggleStatus(room)"
            >
              <i :class="room.status === 'available' ? 'bx bx-lock-alt' : 'bx bx-check-circle'"></i>
              {{ room.status === 'available' ? 'Set Terisi' : 'Set Tersedia' }}
            </button>
            <button class="btn-icon-action btn-edit" @click="openEditModal(room)" title="Edit Kamar">
              <i class='bx bx-edit'></i>
            </button>
            <button class="btn-icon-action btn-delete" @click="handleDeleteRoom(room)" title="Hapus Kamar">
              <i class='bx bx-trash'></i>
            </button>
          </div>
        </div>
      </div>
    </main>

    <!-- MODAL TAMBAH / EDIT KAMAR -->
    <div v-if="isAddRoomModalOpen" class="modal-backdrop" @click.self="closeRoomModal">
      <div class="modal-box">
        <button class="modal-close" @click="closeRoomModal"><i class='bx bx-x'></i></button>

        <div class="modal-header">
          <h2>
            <i class='bx bx-bed'></i> 
            {{ editingRoom ? `Edit Data Kamar ${editingRoom.number}` : 'Tambah Kamar Baru' }}
          </h2>
          <p>Lengkapi spesifikasi kamar dan harga sewa bulanan</p>
        </div>

        <form @submit.prevent="handleSaveRoom" class="room-form">
          <div class="form-row">
            <div class="form-group">
              <label>Nomor Kamar</label>
              <input type="text" v-model="formRoom.number" placeholder="Contoh: A11, A12, B11" class="form-control" required />
            </div>

            <div class="form-group">
              <label>Lantai Bangunan</label>
              <select v-model="formRoom.floor" class="form-control" required>
                <option :value="1">Lantai 1</option>
                <option :value="2">Lantai 2</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Gedung Hunian</label>
              <select v-model="formRoom.buildingId" class="form-control" required>
                <option v-for="bld in buildings" :key="bld.id" :value="bld.id">
                  {{ bld.name }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label>Tipe Kamar</label>
              <select v-model="formRoom.typeId" class="form-control" required>
                <option value="km-dalam">Kamar Mandi Dalam</option>
                <option value="km-luar">Kamar Mandi Luar</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Ukuran Ruangan</label>
              <input type="text" v-model="formRoom.size" placeholder="3 x 4 meter" class="form-control" />
            </div>
            <div class="form-group">
              <label>Status Ketersediaan</label>
              <select v-model="formRoom.status" class="form-control" required>
                <option value="available">Tersedia (Kosong)</option>
                <option value="occupied">Terisi (Penyewa Aktif)</option>
              </select>
            </div>
          </div>

          <div class="pricing-matrix-box mb-3">
            <label class="form-label font-bold text-dark mb-2">Matriks Tarif Sewa Kustom Kamar (Rp)</label>
            <div class="form-row">
              <div class="form-group">
                <label>Tarif 1 Bulan (Rp)</label>
                <input type="number" v-model="formRoom.price1Month" placeholder="600000" class="form-control" required />
              </div>
              <div class="form-group">
                <label>Tarif 3 Bulan (Rp)</label>
                <input type="number" v-model="formRoom.price3Months" placeholder="1800000" class="form-control" required />
              </div>
            </div>
            <div class="form-row mt-2">
              <div class="form-group">
                <label>Tarif 6 Bulan (Rp)</label>
                <input type="number" v-model="formRoom.price6Months" placeholder="3500000" class="form-control" required />
              </div>
              <div class="form-group">
                <label>Tarif 12 Bulan / 1 Tahun (Rp)</label>
                <input type="number" v-model="formRoom.price12Months" placeholder="7000000" class="form-control" required />
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-ghost" @click="closeRoomModal">Batal</button>
            <button type="submit" class="btn btn-primary">
              {{ editingRoom ? 'Simpan Perubahan' : 'Tambah Kamar Baru' }}
            </button>
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
  font-size: 1.8rem;
  color: var(--dark);
}

.admin-header p {
  color: var(--text-muted);
  font-size: 0.9rem;
}

.notice-alert {
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

/* FILTER PILLS */
.filter-bar {
  margin-bottom: 24px;
}

.building-filter-btns {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.filter-pill {
  padding: 8px 18px;
  border-radius: var(--radius-full);
  border: 1px solid var(--border);
  background: var(--white);
  color: var(--text-muted);
  font-weight: 600;
  font-size: 0.88rem;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.filter-pill:hover, .filter-pill.active {
  background: var(--primary);
  color: var(--white);
  border-color: var(--primary);
}

/* ROOMS GRID */
.rooms-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.room-card {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  padding: 20px;
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: all var(--transition-smooth);
}

.room-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
}

.room-card.available {
  border-top: 4px solid #16A34A;
}

.room-card.occupied {
  border-top: 4px solid #DC2626;
}

.room-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.room-number-tag {
  font-family: var(--font-heading);
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--dark);
}

.status-badge {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: var(--radius-full);
}

.status-badge.available {
  background: #DCFCE7;
  color: #15803D;
}

.status-badge.occupied {
  background: #FEE2E2;
  color: #B91C1C;
}

.room-details {
  margin-bottom: 16px;
}

.bld-name {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-bottom: 4px;
}

.type-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--dark);
  margin-bottom: 10px;
}

.price-tag {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--primary);
}

.price-tag small {
  font-size: 0.75rem;
  font-weight: 400;
  color: var(--text-muted);
}

.room-card-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-top: 14px;
  border-top: 1px solid var(--border);
}

.btn-toggle-status {
  flex: 1;
  padding: 8px;
  border-radius: var(--radius-md);
  border: none;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.btn-mark-occ {
  background: #FEF3C7;
  color: #B45309;
}

.btn-mark-avail {
  background: #DCFCE7;
  color: #15803D;
}

.btn-icon-action {
  width: 34px;
  height: 34px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  background: var(--off-white);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
}

.btn-edit:hover { background: var(--tertiary); color: var(--primary); }
.btn-delete:hover { background: #FEE2E2; color: #B91C1C; }

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
  max-width: 540px;
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

.room-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 18px;
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

.form-control {
  width: 100%;
  padding: 10px 14px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  font-size: 0.9rem;
}

.pricing-matrix-box {
  background: var(--off-white);
  padding: 14px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  margin-top: 4px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 10px;
}

@media (max-width: 1100px) {
  .rooms-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 992px) {
  .admin-main { margin-left: 0; padding: 20px; }
}

@media (max-width: 768px) {
  .admin-main { padding: 16px; }
  .admin-header { flex-direction: column; align-items: flex-start; gap: 12px; margin-bottom: 20px; }
  .admin-header h1 { font-size: 1.4rem; }
  .admin-header button { width: 100%; justify-content: center; }
  .admin-card { padding: 16px; }
  .building-filter-btns { width: 100%; overflow-x: auto; flex-wrap: nowrap; padding-bottom: 4px; }
  .filter-pill { flex-shrink: 0; }
  .form-row { grid-template-columns: 1fr; gap: 12px; }
  .modal-box { max-width: 92vw; max-height: 90vh; overflow-y: auto; padding: 24px 16px; }
  .modal-footer { flex-direction: column; }
  .modal-footer button { width: 100%; }
}

@media (max-width: 640px) {
  .rooms-grid { grid-template-columns: 1fr; }
}

@media (max-width: 480px) {
  .admin-main { padding: 12px; }
  .admin-header h1 { font-size: 1.2rem; }
  .admin-header p { font-size: 0.78rem; }
  .room-admin-card { padding: 14px 12px; border-radius: var(--radius-md); }
  .building-filter-btns { -webkit-overflow-scrolling: touch; }
  .filter-pill { font-size: 0.75rem; padding: 6px 10px; }
  .modal-box { max-width: 96vw; padding: 20px 12px; border-radius: var(--radius-lg); }
}
</style>
