<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'
import AdminSidebar from '../../components/layout/AdminSidebar.vue'
import { useDataStore, type RoomData, type RoomTypeData } from '../../composables/useDataStore'
import { useAuth } from '../../composables/useAuth'

const { 
  rooms, 
  roomTypes, 
  buildings, 
  getBuildingName, 
  addRoom, 
  updateRoom, 
  deleteRoom, 
  updateRoomType, 
  getActiveRentalByRoomId 
} = useDataStore()

const { getTenantById } = useAuth()

const activeTab = ref<'rooms' | 'types'>('rooms')
const selectedBuildingFilter = ref<string>('all')
const isAddRoomModalOpen = ref(false)
const isEditTypeModalOpen = ref(false)
const editingRoom = ref<RoomData | null>(null)
const editingType = ref<RoomTypeData | null>(null)
const noticeMessage = ref('')

// Form Tambah/Edit Kamar Fisik (Harga & Fasilitas otomatis dari Tipe Kamar)
const formRoom = ref({
  number: 'A15',
  buildingId: 'bld-a',
  floor: 1,
  typeId: 'km-dalam' as 'km-dalam' | 'km-luar'
})

// Form Edit Master Tipe Kamar
const formType = ref({
  typeId: 'km-dalam' as 'km-dalam' | 'km-luar',
  typeName: 'Kamar Mandi Dalam',
  badge: 'Populer & Favorit',
  size: '3 × 4 Meter',
  desc: '',
  price1Month: 850000,
  price3Months: 2000000,
  price6Months: 4000000,
  price12Months: 8000000
})

const filteredRooms = computed(() => {
  if (selectedBuildingFilter.value === 'all') return rooms.value
  return rooms.value.filter(r => r.buildingId === selectedBuildingFilter.value)
})

// Helper untuk mengecek relasi penyewa kamar
const getRoomTenant = (roomId: string) => {
  const rent = getActiveRentalByRoomId(roomId)
  if (!rent) return null
  const tenant = getTenantById(rent.memberId)
  return tenant || null
}

const isRoomOccupied = (room: RoomData) => {
  const rent = getActiveRentalByRoomId(room.id)
  return !!rent || room.status === 'occupied'
}

const getRoomPriceForType = (typeId: string, duration: number = 1) => {
  const t = roomTypes.value.find(item => item.typeId === typeId)
  if (!t) return typeId === 'km-dalam' ? 850000 : 600000
  if (duration === 1) return t.price1Month || t.price || 600000
  if (duration === 3) return t.price3Months || ((t.price1Month || t.price || 600000) * 3)
  if (duration === 6) return t.price6Months || ((t.price1Month || t.price || 600000) * 6)
  if (duration === 12) return t.price12Months || ((t.price1Month || t.price || 600000) * 12)
  return (t.price1Month || t.price || 600000) * duration
}

// Modal Kamar Fisik
const openAddModal = () => {
  editingRoom.value = null
  formRoom.value = {
    number: `A${rooms.value.length + 1}`,
    buildingId: 'bld-a',
    floor: 1,
    typeId: 'km-dalam'
  }
  isAddRoomModalOpen.value = true
}

const openEditModal = (room: RoomData) => {
  editingRoom.value = room
  formRoom.value = {
    number: room.number,
    buildingId: room.buildingId,
    floor: room.floor,
    typeId: room.typeId
  }
  isAddRoomModalOpen.value = true
}

const closeRoomModal = () => {
  isAddRoomModalOpen.value = false
  editingRoom.value = null
}

const handleSaveRoom = () => {
  if (!formRoom.value.number) {
    alert('Mohon isi nomor kamar.')
    return
  }

  const selectedType = roomTypes.value.find(t => t.typeId === formRoom.value.typeId)
  const tName = selectedType?.typeName || (formRoom.value.typeId === 'km-dalam' ? 'Kamar Mandi Dalam' : 'Kamar Mandi Luar')
  const p1 = selectedType?.price1Month || selectedType?.price || (formRoom.value.typeId === 'km-dalam' ? 850000 : 600000)
  const p3 = selectedType?.price3Months || (p1 * 3)
  const p6 = selectedType?.price6Months || (p1 * 6)
  const p12 = selectedType?.price12Months || (p1 * 12)
  const roomSize = selectedType?.size || (formRoom.value.typeId === 'km-dalam' ? '3 × 4 Meter' : '3 × 3 Meter')

  if (editingRoom.value) {
    updateRoom(editingRoom.value.id, {
      number: formRoom.value.number,
      buildingId: formRoom.value.buildingId,
      floor: Number(formRoom.value.floor),
      typeId: formRoom.value.typeId,
      typeName: tName,
      price: p1,
      price1Month: p1,
      price3Months: p3,
      price6Months: p6,
      price12Months: p12,
      size: roomSize
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
      price3Months: p3,
      price6Months: p6,
      price12Months: p12,
      status: 'available',
      size: roomSize,
      features: selectedType?.features || ['Kasur Springbed', 'Lemari Pakaian', 'Meja Belajar', 'WiFi 100Mbps']
    })
    noticeMessage.value = `Kamar Baru ${formRoom.value.number} berhasil ditambahkan!`
  }

  closeRoomModal()
  setTimeout(() => {
    noticeMessage.value = ''
  }, 4000)
}

const handleDeleteRoom = (room: RoomData) => {
  if (isRoomOccupied(room)) {
    alert(`Kamar ${room.number} sedang terisi oleh penyewa aktif dan tidak dapat dihapus. Silakan alihkan penyewa terlebih dahulu.`)
    return
  }

  if (confirm(`Hapus Kamar ${room.number} dari master data?`)) {
    deleteRoom(room.id)
    noticeMessage.value = `Kamar ${room.number} telah dihapus.`
    setTimeout(() => {
      noticeMessage.value = ''
    }, 3000)
  }
}

// Modal Edit Master Tipe Kamar
const openEditTypeModal = (type: RoomTypeData) => {
  editingType.value = type
  formType.value = {
    typeId: type.typeId as any,
    typeName: type.typeName,
    badge: type.badge || '',
    size: type.size || (type.typeId === 'km-dalam' ? '3 × 4 Meter' : '3 × 3 Meter'),
    desc: type.desc || '',
    price1Month: type.price1Month || type.price || 600000,
    price3Months: type.price3Months || 1800000,
    price6Months: type.price6Months || 3500000,
    price12Months: type.price12Months || 7000000
  }
  isEditTypeModalOpen.value = true
}

const closeEditTypeModal = () => {
  isEditTypeModalOpen.value = false
  editingType.value = null
}

const handleSaveType = () => {
  if (!editingType.value) return

  if (!formType.value.price1Month) {
    alert('Mohon isi tarif 1 bulan.')
    return
  }

  updateRoomType(editingType.value.typeId, {
    typeName: formType.value.typeName,
    badge: formType.value.badge,
    size: formType.value.size,
    desc: formType.value.desc,
    price: Number(formType.value.price1Month),
    price1Month: Number(formType.value.price1Month),
    price3Months: Number(formType.value.price3Months),
    price6Months: Number(formType.value.price6Months),
    price12Months: Number(formType.value.price12Months)
  })

  noticeMessage.value = `Tarif & Spesifikasi Tipe "${formType.value.typeName}" berhasil diperbarui! Seluruh kamar bertipe ini otomatis disinkronkan.`
  closeEditTypeModal()

  setTimeout(() => {
    noticeMessage.value = ''
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

    <main class="admin-main">
      <header class="admin-header">
        <div>
          <span class="header-tag">Property & Unit Master</span>
          <h1>Kelola <span class="text-gradient">Data & Tipe Kamar</span></h1>
          <p>Atur daftar fisik kamar kost, tarif sewa paket durasi, dan spesifikasi tipe kamar.</p>
        </div>
        <div class="header-actions">
          <button v-if="activeTab === 'rooms'" class="btn btn-primary" @click="openAddModal">
            <i class='bx bx-plus-circle'></i> Tambah Kamar Baru
          </button>
        </div>
      </header>

      <!-- NOTICE ALERT -->
      <div v-if="noticeMessage" class="notice-alert">
        <i class='bx bx-check-circle'></i> {{ noticeMessage }}
      </div>

      <!-- NAVIGATION TABS -->
      <div class="rooms-nav-tabs">
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'rooms' }"
          @click="activeTab = 'rooms'"
        >
          <i class='bx bx-bed'></i>
          Daftar Kamar Kost ({{ rooms.length }})
        </button>
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'types' }"
          @click="activeTab = 'types'"
        >
          <i class='bx bx-customize'></i>
          Kelola Tipe & Tarif Sewa ({{ roomTypes.length }})
        </button>
      </div>

      <!-- ================= TAB 1: DAFTAR KAMAR FISIK ================= -->
      <section v-if="activeTab === 'rooms'" class="tab-content-section">
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
            :class="isRoomOccupied(room) ? 'occupied' : 'available'"
          >
            <div class="room-card-header">
              <span class="room-number-tag">Kamar {{ room.number }}</span>
              <span class="status-badge" :class="isRoomOccupied(room) ? 'occupied' : 'available'">
                <i :class="isRoomOccupied(room) ? 'bx bx-user-check' : 'bx bx-check-circle'"></i>
                {{ isRoomOccupied(room) ? 'Terisi' : 'Tersedia' }}
              </span>
            </div>

            <div class="room-details">
              <p class="bld-name">
                <i class='bx bx-building-house'></i> {{ getBuildingName(room.buildingId) }} · Lantai {{ room.floor }}
              </p>
              <p class="type-name">
                <i :class="room.typeId === 'km-dalam' ? 'bx bx-bath' : 'bx bx-door-open'"></i>
                {{ room.typeName }}
              </p>

              <!-- INFO PENYEWA RELASIONAL -->
              <div v-if="isRoomOccupied(room) && getRoomTenant(room.id)" class="room-tenant-info">
                <i class='bx bx-user'></i>
                <span>Penyewa: <strong>{{ getRoomTenant(room.id)?.name }}</strong></span>
              </div>
              <div v-else-if="!isRoomOccupied(room)" class="room-available-info">
                <i class='bx bx-check-shield'></i>
                <span>Siap untuk disewakan</span>
              </div>

              <div class="price-tag-wrap">
                <span class="price-label">Tarif Bulanan:</span>
                <span class="price-value">{{ formatRupiah(getRoomPriceForType(room.typeId, 1)) }} <small>/bln</small></span>
              </div>
            </div>

            <div class="room-card-footer">
              <button class="btn-action-outline btn-edit" @click="openEditModal(room)">
                <i class='bx bx-edit'></i> Edit Kamar
              </button>
              <button 
                class="btn-action-outline btn-delete" 
                :disabled="isRoomOccupied(room)"
                :title="isRoomOccupied(room) ? 'Kamar terisi tidak bisa dihapus' : 'Hapus Kamar'"
                @click="handleDeleteRoom(room)"
              >
                <i class='bx bx-trash'></i>
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- ================= TAB 2: KELOLA TIPE & TARIF SEWA ================= -->
      <section v-if="activeTab === 'types'" class="tab-content-section">
        <div class="types-intro-banner">
          <div class="intro-icon">
            <i class='bx bx-calculator'></i>
          </div>
          <div>
            <h3>Pusat Pengaturan Tarif & Fasilitas Tipe Kamar</h3>
            <p>Perubahan tarif sewa di halaman ini akan secara otomatis memperbarui harga seluruh kamar terkait, landing page, dan sistem kalkulasi tagihan.</p>
          </div>
        </div>

        <div class="room-types-grid">
          <div v-for="type in roomTypes" :key="type.typeId" class="room-type-card">
            <div class="type-card-header">
              <div>
                <span class="type-tag-badge">{{ type.typeId === 'km-dalam' ? 'Premium Unit' : 'Standard Unit' }}</span>
                <h2 class="type-title">{{ type.typeName }}</h2>
                <p class="type-subtitle">{{ type.badge || 'Kamar Nyaman & Bersih' }}</p>
              </div>
              <div class="type-icon-box">
                <i :class="type.typeId === 'km-dalam' ? 'bx bx-bath' : 'bx bx-door-open'"></i>
              </div>
            </div>

            <div class="type-card-body">
              <div class="type-spec-row">
                <span class="spec-label"><i class='bx bx-expand'></i> Ukuran Kamar:</span>
                <strong>{{ type.size || (type.typeId === 'km-dalam' ? '3 × 4 Meter' : '3 × 3 Meter') }}</strong>
              </div>
              <div class="type-spec-row">
                <span class="spec-label"><i class='bx bx-buildings'></i> Total Kamar:</span>
                <strong>{{ rooms.filter(r => r.typeId === type.typeId).length }} Kamar</strong>
              </div>

              <!-- PRICING MATRIX DISPLAY -->
              <div class="pricing-matrix-card">
                <div class="matrix-header">
                  <i class='bx bx-money'></i> Matriks Tarif Paket Sewa
                </div>
                <div class="matrix-grid">
                  <div class="matrix-item">
                    <span class="m-duration">1 Bulan (Dasar)</span>
                    <strong class="m-price">{{ formatRupiah(type.price1Month || type.price || 600000) }}</strong>
                  </div>
                  <div class="matrix-item">
                    <span class="m-duration">3 Bulan (Triwulan)</span>
                    <strong class="m-price">{{ formatRupiah(type.price3Months || 1800000) }}</strong>
                  </div>
                  <div class="matrix-item">
                    <span class="m-duration">6 Bulan (Semester)</span>
                    <strong class="m-price">{{ formatRupiah(type.price6Months || 3500000) }}</strong>
                  </div>
                  <div class="matrix-item">
                    <span class="m-duration">12 Bulan (1 Tahun)</span>
                    <strong class="m-price">{{ formatRupiah(type.price12Months || 7000000) }}</strong>
                  </div>
                </div>
              </div>

              <!-- FACILITIES LIST -->
              <div class="type-facilities-box">
                <span class="fac-title">Fasilitas Termasuk:</span>
                <ul class="fac-list">
                  <li v-for="(fac, idx) in type.features" :key="idx">
                    <i class='bx bx-check-circle'></i> {{ fac }}
                  </li>
                </ul>
              </div>
            </div>

            <div class="type-card-footer">
              <button class="btn btn-primary btn-block" @click="openEditTypeModal(type)">
                <i class='bx bx-edit-alt'></i> Edit Tarif & Spesifikasi Tipe
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- MODAL TAMBAH / EDIT KAMAR FISIK -->
    <div v-if="isAddRoomModalOpen" class="modal-backdrop" @click.self="closeRoomModal">
      <div class="modal-box">
        <button class="modal-close" @click="closeRoomModal"><i class='bx bx-x'></i></button>

        <div class="modal-header">
          <h2>
            <i class='bx bx-bed'></i> 
            {{ editingRoom ? `Edit Data Kamar ${editingRoom.number}` : 'Tambah Kamar Baru' }}
          </h2>
          <p>Tentukan nomor kamar, gedung penempatan, dan tipe kamar</p>
        </div>

        <form @submit.prevent="handleSaveRoom" class="room-form">
          <div class="form-row">
            <div class="form-group">
              <label>Nomor Kamar <span class="required-star">*</span></label>
              <input type="text" v-model="formRoom.number" placeholder="Contoh: A11, A12, B11" class="form-control" required />
            </div>

            <div class="form-group">
              <label>Lantai Bangunan <span class="required-star">*</span></label>
              <select v-model.number="formRoom.floor" class="form-control" required>
                <option :value="1">Lantai 1</option>
                <option :value="2">Lantai 2</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Gedung Hunian <span class="required-star">*</span></label>
              <select v-model="formRoom.buildingId" class="form-control" required>
                <option v-for="bld in buildings" :key="bld.id" :value="bld.id">
                  {{ bld.name }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label>Tipe Kamar <span class="required-star">*</span></label>
              <select v-model="formRoom.typeId" class="form-control" required>
                <option v-for="t in roomTypes" :key="t.typeId" :value="t.typeId">
                  {{ t.typeName }}
                </option>
              </select>
            </div>
          </div>

          <!-- INFO PREVIEW TARIF TIPE KAMAR -->
          <div class="type-rate-preview-card">
            <div class="rate-preview-title">
              <i class='bx bx-info-circle'></i> Tarif Sewa Mengikuti Master Tipe Kamar
            </div>
            <div class="rate-preview-rows">
              <div>
                <span>Tarif 1 Bulan:</span>
                <strong>{{ formatRupiah(getRoomPriceForType(formRoom.typeId, 1)) }}</strong>
              </div>
              <div>
                <span>Tarif 3 Bulan:</span>
                <strong>{{ formatRupiah(getRoomPriceForType(formRoom.typeId, 3)) }}</strong>
              </div>
              <div>
                <span>Tarif 6 Bulan:</span>
                <strong>{{ formatRupiah(getRoomPriceForType(formRoom.typeId, 6)) }}</strong>
              </div>
              <div>
                <span>Tarif 1 Tahun:</span>
                <strong>{{ formatRupiah(getRoomPriceForType(formRoom.typeId, 12)) }}</strong>
              </div>
            </div>
            <small class="rate-preview-note">*Untuk mengubah harga sewa, silakan ubah pada tab "Kelola Tipe & Tarif Sewa".</small>
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

    <!-- MODAL EDIT MASTER TIPE KAMAR -->
    <div v-if="isEditTypeModalOpen && editingType" class="modal-backdrop" @click.self="closeEditTypeModal">
      <div class="modal-box edit-type-modal">
        <button class="modal-close" @click="closeEditTypeModal"><i class='bx bx-x'></i></button>

        <div class="modal-header">
          <h2>
            <i class='bx bx-edit'></i> 
            Edit Tipe & Tarif: {{ editingType.typeName }}
          </h2>
          <p>Ubah tarif sewa paket durasi dan spesifikasi tipe kamar</p>
        </div>

        <form @submit.prevent="handleSaveType" class="room-form">
          <div class="form-row">
            <div class="form-group">
              <label>Nama Tipe Kamar</label>
              <input type="text" v-model="formType.typeName" class="form-control" required />
            </div>
            <div class="form-group">
              <label>Ukuran Ruangan</label>
              <input type="text" v-model="formType.size" placeholder="Contoh: 3 × 4 Meter" class="form-control" required />
            </div>
          </div>

          <div class="form-group">
            <label>Tagline / Badge Tipe</label>
            <input type="text" v-model="formType.badge" placeholder="Contoh: Populer & Favorit" class="form-control" />
          </div>

          <!-- INPUT MATRIKS HARGA -->
          <div class="pricing-matrix-box">
            <div class="matrix-box-header">
              <i class='bx bx-coin-stack'></i> Atur Tarif Paket Sewa (Rp)
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Tarif 1 Bulan (Harga Dasar)</label>
                <input type="number" v-model.number="formType.price1Month" class="form-control" required />
              </div>
              <div class="form-group">
                <label>Tarif Paket 3 Bulan</label>
                <input type="number" v-model.number="formType.price3Months" class="form-control" required />
              </div>
            </div>
            <div class="form-row mt-2">
              <div class="form-group">
                <label>Tarif Paket 6 Bulan</label>
                <input type="number" v-model.number="formType.price6Months" class="form-control" required />
              </div>
              <div class="form-group">
                <label>Tarif Paket 12 Bulan (1 Tahun)</label>
                <input type="number" v-model.number="formType.price12Months" class="form-control" required />
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-ghost" @click="closeEditTypeModal">Batal</button>
            <button type="submit" class="btn btn-primary">
              <i class='bx bx-check-circle'></i> Simpan Perubahan Tarif Tipe
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
  margin-bottom: 24px;
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

/* TABS */
.rooms-nav-tabs {
  display: flex;
  gap: 8px;
  border-bottom: 2px solid var(--border);
  margin-bottom: 24px;
}

.tab-btn {
  padding: 12px 20px;
  background: transparent;
  border: none;
  border-bottom: 3px solid transparent;
  font-weight: 700;
  font-size: 0.95rem;
  color: var(--text-muted);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
  margin-bottom: -2px;
}

.tab-btn:hover {
  color: var(--primary);
}

.tab-btn.active {
  color: #541A1A;
  border-bottom-color: #541A1A;
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
  font-size: 0.74rem;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: var(--radius-full);
  display: inline-flex;
  align-items: center;
  gap: 4px;
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
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.bld-name {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.type-name {
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--dark);
  display: flex;
  align-items: center;
  gap: 4px;
}

.room-tenant-info {
  background: #FEF2F2;
  border: 1px solid #FECACA;
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  font-size: 0.78rem;
  color: #991B1B;
  display: flex;
  align-items: center;
  gap: 6px;
}

.room-available-info {
  background: #F0FDF4;
  border: 1px solid #BBF7D0;
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  font-size: 0.78rem;
  color: #166534;
  display: flex;
  align-items: center;
  gap: 6px;
}

.price-tag-wrap {
  margin-top: 6px;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  border-top: 1px dashed var(--border);
  padding-top: 8px;
}

.price-label {
  font-size: 0.78rem;
  color: var(--text-muted);
}

.price-value {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--primary);
}

.price-value small {
  font-size: 0.72rem;
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

.btn-action-outline {
  padding: 8px 12px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  background: var(--white);
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  transition: all 0.2s ease;
}

.btn-action-outline.btn-edit {
  flex: 1;
  color: var(--primary);
}

.btn-action-outline.btn-edit:hover {
  background: var(--primary);
  color: var(--white);
  border-color: var(--primary);
}

.btn-action-outline.btn-delete {
  color: #DC2626;
  width: 36px;
}

.btn-action-outline.btn-delete:hover:not(:disabled) {
  background: #DC2626;
  color: var(--white);
  border-color: #DC2626;
}

.btn-action-outline.btn-delete:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* ================= TAB 2: TYPES STYLES ================= */
.types-intro-banner {
  background: #FFF8F0;
  border: 1px solid #F97316;
  border-radius: var(--radius-lg);
  padding: 16px 20px;
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 24px;
}

.intro-icon {
  width: 44px;
  height: 44px;
  background: #F97316;
  color: var(--white);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
}

.types-intro-banner h3 {
  font-size: 1rem;
  color: #9A3412;
  margin-bottom: 4px;
}

.types-intro-banner p {
  font-size: 0.84rem;
  color: #C2410C;
  line-height: 1.4;
}

.room-types-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

.room-type-card {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  padding: 24px;
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.type-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 18px;
}

.type-tag-badge {
  font-size: 0.72rem;
  font-weight: 700;
  background: var(--tertiary);
  color: var(--primary);
  padding: 2px 8px;
  border-radius: var(--radius-full);
  display: inline-block;
  margin-bottom: 4px;
}

.type-title {
  font-size: 1.3rem;
  color: var(--dark);
  margin-bottom: 2px;
}

.type-subtitle {
  font-size: 0.82rem;
  color: var(--text-muted);
}

.type-icon-box {
  width: 48px;
  height: 48px;
  background: var(--off-white);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.6rem;
  color: var(--primary);
}

.type-card-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 20px;
}

.type-spec-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  border-bottom: 1px dashed var(--border);
  padding-bottom: 8px;
}

.spec-label {
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 4px;
}

.pricing-matrix-card {
  background: #FAFAFA;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 12px 14px;
}

.matrix-header {
  font-size: 0.82rem;
  font-weight: 700;
  color: #541A1A;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.matrix-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.matrix-item {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
}

.m-duration {
  font-size: 0.72rem;
  color: var(--text-muted);
}

.m-price {
  font-size: 0.95rem;
  color: var(--primary);
  font-weight: 700;
}

.type-facilities-box {
  font-size: 0.82rem;
}

.fac-title {
  font-weight: 700;
  color: var(--dark);
  margin-bottom: 6px;
  display: block;
}

.fac-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.fac-list li {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-muted);
}

.fac-list li i {
  color: #16A34A;
}

.btn-block {
  width: 100%;
  justify-content: center;
}

/* PREVIEW BOX IN MODAL */
.type-rate-preview-card {
  background: #FFFDF9;
  border: 1.5px dashed var(--secondary);
  border-radius: var(--radius-md);
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rate-preview-title {
  font-size: 0.82rem;
  font-weight: 700;
  color: #541A1A;
  display: flex;
  align-items: center;
  gap: 4px;
}

.rate-preview-rows {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  font-size: 0.78rem;
}

.rate-preview-rows div {
  display: flex;
  justify-content: space-between;
  padding: 4px 6px;
  background: var(--white);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
}

.rate-preview-note {
  font-size: 0.72rem;
  color: var(--text-muted);
  font-style: italic;
}

.required-star {
  color: #DC2626;
}

/* MODALS */
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

.edit-type-modal {
  max-width: 600px;
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

.matrix-box-header {
  font-size: 0.85rem;
  font-weight: 700;
  color: #541A1A;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 10px;
}

@media (max-width: 1100px) {
  .rooms-grid { grid-template-columns: repeat(2, 1fr); }
  .room-types-grid { grid-template-columns: 1fr; }
}

@media (max-width: 992px) {
  .admin-main { margin-left: 0; padding: 20px; }
}

@media (max-width: 768px) {
  .admin-main { padding: 16px; }
  .admin-header { flex-direction: column; align-items: flex-start; gap: 12px; margin-bottom: 20px; }
  .admin-header h1 { font-size: 1.4rem; }
  .admin-header button { width: 100%; justify-content: center; }
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
  .modal-box { max-width: 96vw; padding: 20px 12px; border-radius: var(--radius-lg); }
}
</style>
