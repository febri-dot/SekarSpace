<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import Navbar from '../components/layout/Navbar.vue'
import Footer from '../components/layout/Footer.vue'

import { useDataStore, type RoomData } from '../composables/useDataStore'

const { rooms, bookRoom } = useDataStore()

const route = useRoute()

// State
const currentStep = ref<number>(1)
const selectedType = ref<'km-luar' | 'km-dalam' | null>(null)
const selectedBuilding = ref<string | null>(null)
const selectedRoom = ref<RoomData | null>(null)
const isModalOpen = ref(false)

// Booking Form State
const bookingForm = ref({
  fullName: '',
  phone: '',
  startDate: '',
  duration: 1,
  notes: ''
})

const isSubmitted = ref(false)

// Buildings Data
const buildings = computed(() => [
  { id: 'utama', name: 'Gedung Utama', desc: 'Dekat musholla & area parkir utama', totalRooms: rooms.value.filter(r => r.buildingId === 'utama').length, availableCount: rooms.value.filter(r => r.buildingId === 'utama' && r.status === 'available').length },
  { id: 'timur', name: 'Gedung Timur', desc: 'Suasana lebih tenang, dekat area laundry', totalRooms: rooms.value.filter(r => r.buildingId === 'timur').length, availableCount: rooms.value.filter(r => r.buildingId === 'timur' && r.status === 'available').length },
  { id: 'barat', name: 'Gedung Barat', desc: 'Balkon luas di lantai 2, view taman', totalRooms: rooms.value.filter(r => r.buildingId === 'barat').length, availableCount: rooms.value.filter(r => r.buildingId === 'barat' && r.status === 'available').length }
])

// Computed Filtered Rooms
const filteredRooms = computed(() => {
  return rooms.value.filter(r => {
    const matchType = !selectedType.value || r.typeId === selectedType.value
    const matchBuilding = !selectedBuilding.value || r.buildingId === selectedBuilding.value
    return matchType && matchBuilding
  })
})

const selectType = (type: 'km-luar' | 'km-dalam') => {
  selectedType.value = type
  currentStep.value = 2
}

const selectBuilding = (buildingId: string) => {
  selectedBuilding.value = buildingId
  currentStep.value = 3
}

const selectRoom = (room: RoomData) => {
  if (room.status === 'occupied') return
  selectedRoom.value = room
}

const openBookingModal = (room: RoomData) => {
  selectedRoom.value = room
  isModalOpen.value = true
  isSubmitted.value = false
}

const closeModal = () => {
  isModalOpen.value = false
}

const submitBooking = () => {
  if (!bookingForm.value.fullName || !bookingForm.value.phone) {
    alert('Mohon isi nama lengkap dan nomor WhatsApp Anda.')
    return
  }
  if (selectedRoom.value) {
    bookRoom(selectedRoom.value.id)
  }
  isSubmitted.value = true
}

const formatRupiah = (val: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)
}

onMounted(() => {
  if (route.query.tipe === 'km-luar' || route.query.tipe === 'km-dalam') {
    selectedType.value = route.query.tipe
    currentStep.value = 2
  }
})
</script>

<template>
  <div class="rooms-page">
    <Navbar />

    <main class="main-body container">
      <!-- BREADCRUMB & HEADER -->
      <header class="page-header">
        <nav class="breadcrumb">
          <RouterLink to="/">Beranda</RouterLink>
          <span>/</span>
          <span class="current">Pilih Kamar</span>
        </nav>
        <h1>Cari & Pesan <span class="text-gradient">Kamar Kost</span></h1>
        <p>Pilih tipe kamar, gedung pilihan Anda, dan tentukan nomor kamar yang masih tersedia.</p>
      </header>

      <!-- STEP INDICATOR -->
      <div class="step-progress">
        <div 
          class="step-item" 
          :class="{ active: currentStep >= 1 }" 
          @click="currentStep = 1"
        >
          <div class="step-number">1</div>
          <span class="step-label">Tipe Kamar</span>
        </div>
        <div class="step-connector" :class="{ active: currentStep >= 2 }"></div>
        <div 
          class="step-item" 
          :class="{ active: currentStep >= 2 }"
          @click="selectedType ? currentStep = 2 : null"
        >
          <div class="step-number">2</div>
          <span class="step-label">Pilih Gedung</span>
        </div>
        <div class="step-connector" :class="{ active: currentStep >= 3 }"></div>
        <div 
          class="step-item" 
          :class="{ active: currentStep >= 3 }"
          @click="selectedBuilding ? currentStep = 3 : null"
        >
          <div class="step-number">3</div>
          <span class="step-label">Pilih & Pesan</span>
        </div>
      </div>

      <!-- SELECTION SUMMARY BAR -->
      <div v-if="selectedType || selectedBuilding || selectedRoom" class="selection-summary">
        <span v-if="selectedType" class="summary-chip" @click="currentStep = 1">
          <i class='bx bx-bed'></i> {{ selectedType === 'km-luar' ? 'Kamar Mandi Luar' : 'Kamar Mandi Dalam' }}
        </span>
        <span v-if="selectedBuilding" class="summary-chip" @click="currentStep = 2">
          <i class='bx bx-building-house'></i> {{ buildings.find(b => b.id === selectedBuilding)?.name }}
        </span>
        <span v-if="selectedRoom" class="summary-chip active-chip">
          <i class='bx bx-key'></i> Kamar {{ selectedRoom.number }}
        </span>
        <button class="reset-btn" @click="selectedType = null; selectedBuilding = null; selectedRoom = null; currentStep = 1">
          <i class='bx bx-refresh'></i> Reset
        </button>
      </div>

      <!-- STEP 1: PILIH TIPE KAMAR -->
      <section v-if="currentStep === 1" class="step-panel">
        <div class="step-title">
          <h2>Langkah 1: Pilih Tipe Kamar</h2>
          <p>Silakan tentukan jenis kamar sesuai kebutuhan dan privasi Anda</p>
        </div>

        <div class="type-selection-grid">
          <div 
            class="type-card" 
            :class="{ selected: selectedType === 'km-luar' }"
            @click="selectType('km-luar')"
          >
            <div class="type-card-icon"><i class='bx bx-door-open'></i></div>
            <h3>Kamar Mandi Luar</h3>
            <p class="type-desc">Kamar bersih & ekonomis dengan fasilitas kamar mandi luar terawat bersama.</p>
            <ul class="type-features">
              <li><i class='bx bx-check'></i> Ukuran 3 x 3 Meter</li>
              <li><i class='bx bx-check'></i> Kasur, Bantal & Lemari</li>
              <li><i class='bx bx-check'></i> WiFi Cepat 24 Jam</li>
            </ul>
            <div class="type-price">Mulai dari <strong>Rp 700.000</strong>/bulan</div>
            <button class="btn btn-primary type-btn">Pilih Tipe Ini</button>
          </div>

          <div 
            class="type-card card-premium" 
            :class="{ selected: selectedType === 'km-dalam' }"
            @click="selectType('km-dalam')"
          >
            <div class="type-badge-float">Populer</div>
            <div class="type-card-icon"><i class='bx bx-bath'></i></div>
            <h3>Kamar Mandi Dalam</h3>
            <p class="type-desc">Privasi lebih tinggi dengan kamar mandi di dalam kamar yang bersih dan eksklusif.</p>
            <ul class="type-features">
              <li><i class='bx bx-check'></i> Ukuran 3 x 4 Meter</li>
              <li><i class='bx bx-check'></i> Kamar Mandi Dalam</li>
              <li><i class='bx bx-check'></i> Kasur Springbed & Lemari</li>
            </ul>
            <div class="type-price">Mulai dari <strong>Rp 950.000</strong>/bulan</div>
            <button class="btn btn-primary type-btn">Pilih Tipe Ini</button>
          </div>
        </div>
      </section>

      <!-- STEP 2: PILIH GEDUNG -->
      <section v-if="currentStep === 2" class="step-panel">
        <div class="step-title">
          <h2>Langkah 2: Pilih Gedung</h2>
          <p>Pilih lokasi gedung hunian dalam kawasan Kost Sekar Wangi</p>
        </div>

        <div class="building-grid">
          <div 
            v-for="b in buildings" 
            :key="b.id" 
            class="building-card"
            :class="{ selected: selectedBuilding === b.id }"
            @click="selectBuilding(b.id)"
          >
            <div class="building-icon"><i class='bx bx-building-house'></i></div>
            <h3>{{ b.name }}</h3>
            <p>{{ b.desc }}</p>
            <div class="building-meta">
              <span class="badge-avail"><i class='bx bx-check-circle'></i> {{ b.availableCount }} Kamar Kosong</span>
              <span class="badge-total">{{ b.totalRooms }} Total Kamar</span>
            </div>
            <button class="btn btn-ghost select-bld-btn">Lihat Daftar Kamar</button>
          </div>
        </div>
      </section>

      <!-- STEP 3: DAFTAR KAMAR & BOOKING -->
      <section v-if="currentStep === 3" class="step-panel">
        <div class="step-title">
          <h2>Langkah 3: Pilih Nomor Kamar</h2>
          <p>Pilih nomor kamar yang tersedia untuk pemesanan langsung</p>
        </div>

        <div v-if="filteredRooms.length === 0" class="empty-state">
          <i class='bx bx-info-circle'></i>
          <p>Belum ada kamar yang cocok dengan filter yang Anda pilih.</p>
        </div>

        <div class="rooms-grid">
          <div 
            v-for="room in filteredRooms" 
            :key="room.id"
            class="room-card"
            :class="{ 'occupied': room.status === 'occupied', 'selected': selectedRoom?.id === room.id }"
          >
            <div class="room-card-header">
              <span class="room-number">Kamar {{ room.number }}</span>
              <span 
                class="status-pill" 
                :class="room.status === 'available' ? 'pill-available' : 'pill-occupied'"
              >
                {{ room.status === 'available' ? 'Tersedia' : 'Terisi' }}
              </span>
            </div>

            <div class="room-card-body">
              <div class="room-building-info">
                <i class='bx bx-building'></i> {{ room.buildingName }} (Lantai {{ room.floor }})
              </div>
              <div class="room-type-info">
                <i class='bx bx-bed'></i> {{ room.typeName }} · {{ room.size }}
              </div>
              <ul class="room-card-features">
                <li v-for="(feat, idx) in room.features" :key="idx">
                  <i class='bx bx-check'></i> {{ feat }}
                </li>
              </ul>
              <div class="room-card-price">
                <strong>{{ formatRupiah(room.price) }}</strong><span>/bulan</span>
              </div>
            </div>

            <div class="room-card-footer">
              <button 
                v-if="room.status === 'available'" 
                class="btn btn-primary book-btn"
                @click="openBookingModal(room)"
              >
                <i class='bx bx-calendar-check'></i> Pesan Kamar Ini
              </button>
              <button v-else class="btn btn-ghost disabled-btn" disabled>
                Kamar Terisi
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- BOOKING MODAL DIALOG -->
    <div v-if="isModalOpen" class="modal-backdrop" @click.self="closeModal">
      <div class="modal-box">
        <button class="modal-close" @click="closeModal"><i class='bx bx-x'></i></button>

        <div v-if="!isSubmitted">
          <div class="modal-header">
            <h2>Pemesanan Kamar {{ selectedRoom?.number }}</h2>
            <p>{{ selectedRoom?.buildingName }} — {{ selectedRoom?.typeName }}</p>
          </div>

          <form @submit.prevent="submitBooking" class="booking-form">
            <div class="form-group">
              <label>Nama Lengkap (Sesuai KTP)</label>
              <input type="text" v-model="bookingForm.fullName" placeholder="Masukkan nama lengkap Anda" required />
            </div>

            <div class="form-group">
              <label>Nomor WhatsApp / HP</label>
              <input type="tel" v-model="bookingForm.phone" placeholder="Contoh: 081234567890" required />
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Rencana Tanggal Masuk</label>
                <input type="date" v-model="bookingForm.startDate" required />
              </div>
              <div class="form-group">
                <label>Durasi Sewa (Bulan)</label>
                <select v-model="bookingForm.duration">
                  <option :value="1">1 Bulan</option>
                  <option :value="3">3 Bulan</option>
                  <option :value="6">6 Bulan</option>
                  <option :value="12">12 Bulan (1 Tahun)</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label>Catatan Tambahan (Opsional)</label>
              <textarea v-model="bookingForm.notes" rows="2" placeholder="Catatan atau pertanyaan untuk pengelola..."></textarea>
            </div>

            <div class="form-summary">
              <span>Total Estimasi Sewa Per Bulan:</span>
              <strong>{{ formatRupiah(selectedRoom?.price || 0) }}</strong>
            </div>

            <button type="submit" class="btn btn-primary submit-booking-btn">
              <i class='bx bx-send'></i> Kirim Permohonan Pesan
            </button>
          </form>
        </div>

        <div v-else class="modal-success">
          <div class="success-icon"><i class='bx bx-check-circle'></i></div>
          <h2>Permohonan Terkirim!</h2>
          <p>Terima kasih, <strong>{{ bookingForm.fullName }}</strong>. Permohonan pesan Kamar {{ selectedRoom?.number }} telah kami terima. Pengelola Sekar Space akan menghubungi Anda via WhatsApp di <strong>{{ bookingForm.phone }}</strong> untuk verifikasi.</p>
          <button class="btn btn-primary" @click="closeModal">Tutup Window</button>
        </div>
      </div>
    </div>

    <Footer />
  </div>
</template>

<style scoped>
.rooms-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.main-body {
  flex: 1;
  padding-top: 100px;
  padding-bottom: 80px;
}

.page-header {
  margin-bottom: 40px;
  text-align: center;
}

.breadcrumb {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 0.9rem;
  color: var(--text-muted);
  margin-bottom: 12px;
}

.breadcrumb a {
  color: var(--primary);
}

.page-header h1 {
  font-size: 2.4rem;
  margin-bottom: 10px;
}

.page-header p {
  color: var(--text-muted);
}

/* STEP PROGRESS BAR */
.step-progress {
  display: flex;
  align-items: center;
  justify-content: center;
  max-width: 650px;
  margin: 0 auto 40px;
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.step-number {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: var(--tertiary);
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  transition: all var(--transition-fast);
}

.step-item.active .step-number {
  background: var(--primary);
  color: var(--white);
}

.step-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-muted);
}

.step-item.active .step-label {
  color: var(--primary);
}

.step-connector {
  flex: 1;
  height: 3px;
  background: var(--border);
  margin: 0 16px;
  margin-bottom: 24px;
}

.step-connector.active {
  background: var(--primary);
}

/* SELECTION SUMMARY */
.selection-summary {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 32px;
  flex-wrap: wrap;
}

.summary-chip {
  background: var(--tertiary);
  color: var(--primary);
  padding: 6px 16px;
  border-radius: var(--radius-full);
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
}

.summary-chip.active-chip {
  background: var(--primary);
  color: var(--white);
}

.reset-btn {
  background: none;
  border: none;
  color: var(--danger);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
}

/* TYPE CARDS */
.type-selection-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  max-width: 900px;
  margin: 0 auto;
}

.type-card {
  background: var(--white);
  border: 2px solid var(--border);
  border-radius: var(--radius-xl);
  padding: 32px;
  position: relative;
  cursor: pointer;
  transition: all var(--transition-smooth);
}

.type-card:hover, .type-card.selected {
  border-color: var(--primary);
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.type-card-icon {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: var(--tertiary);
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.6rem;
  margin-bottom: 16px;
}

.type-card h3 {
  font-size: 1.4rem;
  margin-bottom: 8px;
}

.type-desc {
  font-size: 0.92rem;
  color: var(--text-muted);
  margin-bottom: 20px;
}

.type-features {
  margin-bottom: 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.type-features li {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
}

.type-features i {
  color: var(--success);
}

.type-price {
  font-size: 0.9rem;
  color: var(--text-muted);
  margin-bottom: 20px;
}

.type-price strong {
  font-size: 1.3rem;
  color: var(--primary);
}

.type-btn {
  width: 100%;
}

.type-badge-float {
  position: absolute;
  top: 16px;
  right: 16px;
  background: #B8860B;
  color: white;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: var(--radius-full);
}

/* BUILDING GRID */
.building-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 28px;
}

.building-card {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 28px;
  cursor: pointer;
  transition: all var(--transition-smooth);
}

.building-card:hover, .building-card.selected {
  border-color: var(--primary);
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
}

.building-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  background: var(--tertiary);
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  margin-bottom: 16px;
}

.building-card h3 {
  font-size: 1.25rem;
  margin-bottom: 6px;
}

.building-card p {
  font-size: 0.88rem;
  color: var(--text-muted);
  margin-bottom: 20px;
}

.building-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  font-size: 0.82rem;
}

.badge-avail {
  color: var(--success);
  font-weight: 600;
}

.badge-total {
  color: var(--text-muted);
}

.select-bld-btn {
  width: 100%;
}

/* ROOMS GRID */
.rooms-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.room-card {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: all var(--transition-smooth);
}

.room-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
}

.room-card-header {
  padding: 16px 20px;
  background: var(--off-white);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.room-number {
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 1.15rem;
  color: var(--primary);
}

.status-pill {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: var(--radius-full);
}

.pill-available {
  background: var(--success-bg);
  color: var(--success);
}

.pill-occupied {
  background: var(--danger-bg);
  color: var(--danger);
}

.room-card-body {
  padding: 20px;
  flex: 1;
}

.room-building-info, .room-type-info {
  font-size: 0.85rem;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}

.room-card-features {
  margin: 16px 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.room-card-features li {
  font-size: 0.82rem;
  color: var(--text);
  display: flex;
  align-items: center;
  gap: 6px;
}

.room-card-features i {
  color: var(--primary);
}

.room-card-price {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px dashed var(--border);
}

.room-card-price strong {
  font-size: 1.25rem;
  color: var(--primary);
}

.room-card-price span {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.room-card-footer {
  padding: 16px 20px;
  border-top: 1px solid var(--border);
  background: var(--off-white);
}

.book-btn {
  width: 100%;
  padding: 10px;
  font-size: 0.88rem;
}

.disabled-btn {
  width: 100%;
  opacity: 0.5;
  cursor: not-allowed;
}

/* MODAL DIALOG */
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
  max-width: 500px;
  width: 100%;
  padding: 32px;
  position: relative;
  box-shadow: var(--shadow-xl);
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
  font-size: 1.4rem;
  margin-bottom: 4px;
}

.modal-header p {
  font-size: 0.88rem;
  color: var(--text-muted);
  margin-bottom: 24px;
}

.booking-form {
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
  font-size: 0.85rem;
  font-weight: 600;
}

.form-group input, .form-group select, .form-group textarea {
  padding: 10px 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  outline: none;
}

.form-group input:focus, .form-group select:focus, .form-group textarea:focus {
  border-color: var(--primary);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--tertiary-light);
  border-radius: var(--radius-md);
  font-size: 0.88rem;
}

.form-summary strong {
  color: var(--primary);
  font-size: 1.1rem;
}

.submit-booking-btn {
  margin-top: 8px;
}

.modal-success {
  text-align: center;
  padding: 20px 0;
}

.success-icon {
  font-size: 4rem;
  color: var(--success);
  margin-bottom: 16px;
}

.modal-success h2 {
  font-size: 1.5rem;
  margin-bottom: 12px;
}

.modal-success p {
  font-size: 0.92rem;
  color: var(--text-muted);
  margin-bottom: 24px;
  line-height: 1.6;
}

@media (max-width: 900px) {
  .type-selection-grid, .building-grid, .rooms-grid {
    grid-template-columns: 1fr;
  }
}
</style>
