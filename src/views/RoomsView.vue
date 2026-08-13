<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import Navbar from '../components/layout/Navbar.vue'
import Footer from '../components/layout/Footer.vue'
import { useDataStore, type RoomData } from '../composables/useDataStore'

const { rooms, bookRoom } = useDataStore()
const route = useRoute()

// Step Management
const currentStep = ref<number>(1)
const selectedType = ref<'km-luar' | 'km-dalam'>('km-luar')
const selectedBuildingId = ref<string>('utama')
const selectedRoomId = ref<string | null>(null)
const activeFloor = ref<'floor1' | 'floor2'>('floor1')

// Gallery State for Step 3
const activeImageIndex = ref<number>(0)
const galleryImages = [
  { url: '/assets/images/room-single.png', title: 'Kamar Standard' },
  { url: '/assets/images/room-deluxe.png', title: 'Kamar Mandi Dalam' },
  { url: '/assets/images/room-double.png', title: 'Kamar Double / Shared' },
  { url: '/assets/images/gallery-kitchen.png', title: 'Dapur Bersama' },
  { url: '/assets/images/gallery-livingroom.png', title: 'Ruang Tamu & Santai' }
]

// Calculator & Estimator State for Step 3
const calcDuration = ref<number>(1) // Months: 1 - 12
const calcAddonParking = ref<boolean>(false)
const calcAddonLaundry = ref<boolean>(false)

// Booking Modal State
const isModalOpen = ref(false)
const bookingForm = ref({
  fullName: '',
  phone: '',
  startDate: '',
  notes: ''
})
const isSubmitted = ref(false)

// Building Data Definition
const buildingList = [
  {
    id: 'utama',
    name: 'Gedung Utama (Depan)',
    desc: 'Dekat dengan pagar utama, area parkir utama, dan musholla.',
    badge: 'Favorit',
    facilities: ['Parkir Motor Luar', 'CCTV 24 Jam', 'Dapur Bersama Lt.1', 'Ruang Tamu Utama']
  },
  {
    id: 'timur',
    name: 'Gedung Timur (Tengah)',
    desc: 'Suasana lebih tenang, dekat area santai & musholla.',
    badge: 'Tenang',
    facilities: ['Musholla Bersama', 'Dapur Bersama Lt.1', 'WiFi Dedicated', 'Dispenser Air']
  },
  {
    id: 'barat',
    name: 'Gedung Barat (Belakang)',
    desc: 'Balkon luas di lantai 2, pemandangan asri dekat area laundry.',
    badge: 'View Asri',
    facilities: ['Mesin Cuci Bersama', 'Area Jemur Atas', 'Parkir Motor Dalam', 'Balkon Santai']
  }
]

// Selected Building Object
const currentBuilding = computed(() => {
  return buildingList.find(b => b.id === selectedBuildingId.value) || buildingList[0]!
})

// Rooms filtered by Building & Type
const roomsInSelectedBuilding = computed(() => {
  return rooms.value.filter(r => r.buildingId === selectedBuildingId.value)
})

const availableRoomsInBuilding = computed(() => {
  return roomsInSelectedBuilding.value.filter(r => r.status === 'available')
})

// Selected Active Room Object for Step 3
const selectedRoom = computed<RoomData | null>(() => {
  if (selectedRoomId.value) {
    const found = rooms.value.find(r => r.id === selectedRoomId.value)
    if (found) return found
  }
  // Fallback to first available room in building or first room
  return availableRoomsInBuilding.value[0] || roomsInSelectedBuilding.value[0] || rooms.value[0] || null
})

// Floor Plan Nodes for Selected Building
const buildingFloorPlanNodes = computed(() => {
  const floorNum = activeFloor.value === 'floor1' ? 1 : 2
  const roomNodes = roomsInSelectedBuilding.value
    .filter(r => r.floor === floorNum)
    .map(r => ({
      id: r.id,
      number: r.number,
      title: `Kamar ${r.number}`,
      type: r.typeName,
      typeId: r.typeId,
      status: r.status === 'available' ? 'Tersedia' : 'Terisi',
      icon: r.typeId === 'km-dalam' ? 'bx bx-bath' : 'bx bx-door-open',
      isRoom: true,
      roomData: r
    }))

  // Add communal nodes depending on floor
  if (floorNum === 1) {
    return [
      ...roomNodes,
      { id: 'f1-dapur', number: 'F-01', title: 'Dapur Bersama', type: 'Fasilitas Umum', typeId: 'fasilitas', status: 'Fasilitas Umum', icon: 'bx bx-fridge', isRoom: false },
      { id: 'f1-tamu', number: 'F-02', title: 'Ruang Tamu', type: 'Fasilitas Umum', typeId: 'fasilitas', status: 'Fasilitas Umum', icon: 'bx bxs-group', isRoom: false }
    ]
  } else {
    return [
      ...roomNodes,
      { id: 'f2-balkon', number: 'F-03', title: 'Balkon Santai', type: 'Fasilitas Umum', typeId: 'fasilitas', status: 'Fasilitas Umum', icon: 'bx bxs-sun', isRoom: false },
      { id: 'f2-jemuran', number: 'F-04', title: 'Area Jemuran', type: 'Fasilitas Umum', typeId: 'fasilitas', status: 'Fasilitas Umum', icon: 'bx bx-closet', isRoom: false }
    ]
  }
})

// Calculator Calculations
const basePricePerMonth = computed(() => {
  if (!selectedRoom.value) return 700000
  let price = selectedRoom.value.price
  if (calcDuration.value >= 12) {
    price = price * 0.9 // 10% discount for 1 year
  } else if (calcDuration.value >= 3) {
    price = price * 0.95 // 5% discount for 3 months
  }
  return price
})

const totalAddonsPerMonth = computed(() => {
  let addons = 0
  if (calcAddonParking.value) addons += 50000
  if (calcAddonLaundry.value) addons += 75000
  return addons
})

const totalPerMonthWithAddons = computed(() => {
  return basePricePerMonth.value + totalAddonsPerMonth.value
})

const grandTotalEstimator = computed(() => {
  return totalPerMonthWithAddons.value * calcDuration.value
})

const calcWaMessage = computed(() => {
  if (!selectedRoom.value) return ''
  const roomNum = selectedRoom.value.number
  const bldName = currentBuilding.value.name
  const roomType = selectedRoom.value.typeName
  const addons = []
  if (calcAddonParking.value) addons.push('Parkir Motor Dedicated (+Rp 50rb/bln)')
  if (calcAddonLaundry.value) addons.push('Jasa Laundry Berlangganan (+Rp 75rb/bln)')
  const addonStr = addons.length > 0 ? addons.join(', ') : 'Tanpa Layanan Tambahan'

  const text = `Halo Admin Sekar Space, saya berminat memesan Kamar ${roomNum} (${bldName} - ${roomType}) dengan rincian:
- Durasi Sewa: ${calcDuration.value} Bulan
- Layanan Tambahan: ${addonStr}
- Estimasi Total Sewa: Rp ${grandTotalEstimator.value.toLocaleString('id-ID')}

Apakah kamar ini masih siap dihuni? Terima kasih.`

  return encodeURIComponent(text)
})

// Actions
const selectType = (type: 'km-luar' | 'km-dalam') => {
  selectedType.value = type
  currentStep.value = 2
}

const selectBuilding = (bId: string) => {
  selectedBuildingId.value = bId
  // Pick first available room in this building if available
  const match = rooms.value.find(r => r.buildingId === bId && r.status === 'available')
  if (match) {
    selectedRoomId.value = match.id
  }
  currentStep.value = 2
}

const selectRoomFromFloorPlan = (roomNode: any) => {
  if (!roomNode.isRoom) return
  if (roomNode.roomData.status === 'occupied') return
  selectedRoomId.value = roomNode.roomData.id
  currentStep.value = 3
}

const selectRoomDirect = (room: RoomData) => {
  if (room.status === 'occupied') return
  selectedRoomId.value = room.id
}

const goToStep = (step: number) => {
  currentStep.value = step
  window.scrollTo({ top: 180, behavior: 'smooth' })
}

const formatRupiah = (val: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)
}

const openBookingModal = () => {
  isModalOpen.value = true
  isSubmitted.value = false
}

const closeModal = () => {
  isModalOpen.value = false
}

const submitBookingForm = () => {
  if (!bookingForm.value.fullName || !bookingForm.value.phone) {
    alert('Mohon isi nama lengkap dan nomor WhatsApp Anda.')
    return
  }
  if (selectedRoom.value) {
    bookRoom(selectedRoom.value.id)
  }
  isSubmitted.value = true
}

const applyRouteQuery = () => {
  const queryTipe = route.query.tipe as string
  if (queryTipe === 'km-luar' || queryTipe === 'km-dalam') {
    selectedType.value = queryTipe as 'km-luar' | 'km-dalam'
    currentStep.value = 2
  }
}

onMounted(() => {
  applyRouteQuery()
  // Auto select default room ID
  if (availableRoomsInBuilding.value.length > 0) {
    selectedRoomId.value = availableRoomsInBuilding.value[0]!.id
  }
})

watch(() => route.query.tipe, () => {
  applyRouteQuery()
})
</script>

<template>
  <div class="rooms-page">
    <Navbar />

    <main class="main-body container">
      <!-- BREADCRUMB & PAGE HEADER -->
      <header class="page-header">
        <nav class="breadcrumb" aria-label="Breadcrumb">
          <RouterLink to="/">Beranda</RouterLink>
          <span>/</span>
          <span class="current">Pilih Kamar</span>
        </nav>
        <h1>Cari & Pesan <span class="text-gradient">Kamar Kost</span></h1>
        <p>Pilih tipe kamar, gedung hunian, lihat denah tata letak, dan tentukan nomor kamar yang masih tersedia.</p>
      </header>

      <!-- STEP PROGRESS INDICATOR -->
      <div class="step-progress" aria-label="Kemajuan Pemilihan">
        <div 
          class="step-item" 
          :class="{ active: currentStep >= 1 }" 
          @click="goToStep(1)"
        >
          <div class="step-number">1</div>
          <span class="step-label">Tipe Kamar</span>
        </div>
        <div class="step-connector" :class="{ active: currentStep >= 2 }"></div>
        <div 
          class="step-item" 
          :class="{ active: currentStep >= 2 }"
          @click="goToStep(2)"
        >
          <div class="step-number">2</div>
          <span class="step-label">Pilih Gedung & Denah</span>
        </div>
        <div class="step-connector" :class="{ active: currentStep >= 3 }"></div>
        <div 
          class="step-item" 
          :class="{ active: currentStep >= 3 }"
          @click="goToStep(3)"
        >
          <div class="step-number">3</div>
          <span class="step-label">Detail & Pesan</span>
        </div>
      </div>

      <!-- SELECTION SUMMARY BAR -->
      <div class="selection-summary">
        <span class="summary-chip" @click="goToStep(1)">
          <i class='bx bx-bed'></i> Tipe: {{ selectedType === 'km-dalam' ? 'Kamar Mandi Dalam' : 'Kamar Mandi Luar' }}
        </span>
        <span class="summary-separator">›</span>
        <span class="summary-chip" @click="goToStep(2)">
          <i class='bx bx-building-house'></i> {{ currentBuilding.name }}
        </span>
        <span v-if="selectedRoom" class="summary-separator">›</span>
        <span v-if="selectedRoom" class="summary-chip active-chip" @click="goToStep(3)">
          <i class='bx bx-key'></i> Kamar {{ selectedRoom.number }} ({{ selectedRoom.status === 'available' ? 'Tersedia' : 'Terisi' }})
        </span>
      </div>

      <!-- ==================== STEP 1: PILIH TIPE KAMAR ==================== -->
      <section v-if="currentStep === 1" class="step-panel">
        <div class="step-title">
          <h2>Langkah 1: Pilih Tipe Kamar</h2>
          <p>Silakan tentukan jenis kamar sesuai dengan kebutuhan privasi dan kenyamanan Anda</p>
        </div>

        <div class="type-selection-grid">
          <!-- Kamar Mandi Luar -->
          <div 
            class="type-card" 
            :class="{ selected: selectedType === 'km-luar' }"
            @click="selectType('km-luar')"
          >
            <div class="type-card-icon">
              <i class='bx bx-door-open'></i>
            </div>
            <h3>Kamar Mandi Luar</h3>
            <p class="type-desc">Kamar bersih & ekonomis dengan fasilitas kamar mandi luar terawat bersama.</p>
            <ul class="type-features">
              <li><i class='bx bx-check-circle'></i> Ukuran 3 x 3 Meter</li>
              <li><i class='bx bx-check-circle'></i> Kasur, Bantal & Lemari Pakaian</li>
              <li><i class='bx bx-check-circle'></i> Meja & Cermin Belajar</li>
              <li><i class='bx bx-check-circle'></i> WiFi Cepat 24 Jam</li>
              <li><i class='bx bx-check-circle'></i> Access Dapur & Kulkas Bersama</li>
            </ul>
            <div class="type-price">
              <span class="price-label">Mulai dari</span>
              <strong class="price-amount">Rp 700.000 <span>/ bulan</span></strong>
            </div>
            <button class="btn btn-primary type-btn">Pilih Tipe Kamar Ini</button>
          </div>

          <!-- Kamar Mandi Dalam -->
          <div 
            class="type-card card-premium" 
            :class="{ selected: selectedType === 'km-dalam' }"
            @click="selectType('km-dalam')"
          >
            <div class="type-badge-float">
              <i class='bx bxs-star'></i> Populer & Favorit
            </div>
            <div class="type-card-icon">
              <i class='bx bx-bath'></i>
            </div>
            <h3>Kamar Mandi Dalam</h3>
            <p class="type-desc">Kamar lebih luas dengan kamar mandi pribadi di dalam kamar untuk kenyamanan & privasi ekstra.</p>
            <ul class="type-features">
              <li><i class='bx bx-check-circle'></i> Ukuran 3 x 4 Meter</li>
              <li><i class='bx bx-check-circle'></i> Kamar Mandi Dalam (Shower & Closet)</li>
              <li><i class='bx bx-check-circle'></i> Kasur Springbed & Lemari 2 Pintu</li>
              <li><i class='bx bx-check-circle'></i> Meja, Cermin & Token Listrik</li>
              <li><i class='bx bx-check-circle'></i> WiFi Cepat 24 Jam</li>
            </ul>
            <div class="type-price">
              <span class="price-label">Mulai dari</span>
              <strong class="price-amount">Rp 950.000 <span>/ bulan</span></strong>
            </div>
            <button class="btn btn-primary type-btn">Pilih Tipe Kamar Ini</button>
          </div>
        </div>
      </section>

      <!-- ==================== STEP 2: PILIH GEDUNG & DENAH BANGUNAN ==================== -->
      <section v-if="currentStep === 2" class="step-panel">
        <div class="step-title">
          <h2>Langkah 2: Pilih Gedung & Lihat Denah Layout</h2>
          <p>Pilih gedung hunian Anda untuk melihat tata letak ruangan (Lantai 1 & 2) dan kamar yang masih siap dihuni</p>
        </div>

        <!-- Building Selector Cards -->
        <div class="building-grid">
          <div 
            v-for="bld in buildingList" 
            :key="bld.id"
            class="building-card"
            :class="{ selected: selectedBuildingId === bld.id }"
            @click="selectBuilding(bld.id)"
          >
            <div class="building-card-header">
              <div class="building-icon"><i class='bx bx-building-house'></i></div>
              <span class="building-badge">{{ bld.badge }}</span>
            </div>
            <h3>{{ bld.name }}</h3>
            <p class="building-desc">{{ bld.desc }}</p>
            <ul class="building-fac-list">
              <li v-for="(fac, fidx) in bld.facilities" :key="fidx">
                <i class='bx bx-check'></i> {{ fac }}
              </li>
            </ul>
            <div class="building-footer">
              <span class="badge-avail">
                <i class='bx bx-check-circle'></i> {{ rooms.filter(r => r.buildingId === bld.id && r.status === 'available').length }} Kamar Tersedia
              </span>
              <button class="btn btn-ghost btn-sm">Lihat Denah Gedung</button>
            </div>
          </div>
        </div>

        <!-- INTERACTIVE FLOOR PLAN DENAH BANGUNAN FOR SELECTED BUILDING -->
        <div class="floor-plan-container">
          <div class="floor-plan-header">
            <div>
              <h3><i class='bx bx-map-alt'></i> Denah Layout — {{ currentBuilding.name }}</h3>
              <p>Klik salah satu nomor kamar pada denah di bawah untuk langsung menuju detail dan pemesanan.</p>
            </div>
            <div class="floor-switcher">
              <button 
                class="floor-btn" 
                :class="{ active: activeFloor === 'floor1' }"
                @click="activeFloor = 'floor1'"
              >
                <i class='bx bx-layer'></i> Lantai 1
              </button>
              <button 
                class="floor-btn" 
                :class="{ active: activeFloor === 'floor2' }"
                @click="activeFloor = 'floor2'"
              >
                <i class='bx bx-layer'></i> Lantai 2
              </button>
            </div>
          </div>

          <!-- Floor Plan Legend -->
          <div class="floor-plan-legend">
            <div class="legend-item">
              <span class="legend-pill type-km-dalam"><i class='bx bx-bath'></i> KM Dalam</span>
            </div>
            <div class="legend-item">
              <span class="legend-pill type-km-luar"><i class='bx bx-door-open'></i> KM Luar</span>
            </div>
            <div class="legend-item">
              <span class="legend-pill type-fasilitas"><i class='bx bx-building'></i> Fasilitas Umum</span>
            </div>
            <div class="legend-item">
              <span class="legend-dot status-avail"></span> <span>Tersedia</span>
            </div>
            <div class="legend-item">
              <span class="legend-dot status-occ"></span> <span>Terisi</span>
            </div>
          </div>

          <div class="floor-layout-box">
            <div class="floor-node-grid">
              <div 
                v-for="node in buildingFloorPlanNodes" 
                :key="node.id"
                class="floor-node-card"
                :class="[
                  node.status.toLowerCase().replace(/\s+/g, '-'),
                  node.typeId,
                  { 'is-clickable': node.isRoom && node.status === 'Tersedia' },
                  { 'is-selected': selectedRoomId === node.id }
                ]"
                @click="selectRoomFromFloorPlan(node)"
              >
                <!-- Room Type Badge Tag -->
                <span class="node-room-type-tag" :class="node.typeId">
                  <i :class="node.typeId === 'km-dalam' ? 'bx bx-bath' : node.typeId === 'km-luar' ? 'bx bx-door-open' : 'bx bx-building'"></i>
                  {{ node.typeId === 'km-dalam' ? 'KM Dalam' : node.typeId === 'km-luar' ? 'KM Luar' : 'Fasilitas' }}
                </span>

                <div class="node-icon"><i :class="node.icon"></i></div>
                <div class="node-num">{{ node.title }}</div>
                <div class="node-type">{{ node.type }}</div>
                <span class="node-badge">{{ node.status }}</span>
                <span v-if="node.isRoom && node.status === 'Tersedia'" class="node-click-hint">Pilih Kamar Ini</span>
              </div>
            </div>
          </div>

          <div class="floor-plan-cta">
            <button class="btn btn-primary" @click="goToStep(3)">
              Lanjutkan ke Detail & Pesan Kamar <i class='bx bx-right-arrow-alt'></i>
            </button>
          </div>
        </div>
      </section>

      <!-- ==================== STEP 3: DETAIL KAMAR, ESTIMASI BIAYA & BOOKING ==================== -->
      <section v-if="currentStep === 3 && selectedRoom" class="step-panel">
        <div class="room-detail-layout">
          <!-- Left Column: Photo Gallery -->
          <div class="room-gallery">
            <div class="gallery-main">
              <span class="gallery-badge">{{ selectedRoom.typeName }}</span>
              <img :src="galleryImages[activeImageIndex]?.url || galleryImages[0]!.url" :alt="selectedRoom.typeName" class="main-img" />
              <div class="gallery-zoom-overlay">
                <i class='bx bx-zoom-in'></i>
                <span>{{ galleryImages[activeImageIndex]?.title }}</span>
              </div>
            </div>
            <div class="gallery-thumbs">
              <button 
                v-for="(img, index) in galleryImages" 
                :key="index"
                class="thumb-btn"
                :class="{ active: activeImageIndex === index }"
                @click="activeImageIndex = index"
              >
                <img :src="img.url" :alt="img.title" />
              </button>
            </div>
          </div>

          <!-- Right Column: Room & Building Specifications -->
          <div class="room-specs">
            <div class="room-specs-header">
              <span class="type-badge">{{ selectedRoom.typeName }}</span>
              <h2>{{ currentBuilding.name }} — Kamar {{ selectedRoom.number }}</h2>
              <div class="building-name">
                <i class='bx bxs-map-pin'></i> Kost Muslimah Sekar Wangi, Trini, Mlati, Sleman
              </div>
            </div>

            <div class="room-price-display">
              <span class="price-label">Harga Sewa Standar per Bulan</span>
              <div class="price-main">{{ formatRupiah(selectedRoom.price) }} <span>/ bulan</span></div>
            </div>

            <!-- Specifications Grid -->
            <div class="spec-grid">
              <div class="spec-item">
                <div class="spec-icon"><i class='bx bx-ruler'></i></div>
                <div class="spec-text">
                  <small>Ukuran Room</small>
                  <strong>{{ selectedRoom.size }}</strong>
                </div>
              </div>
              <div class="spec-item">
                <div class="spec-icon"><i class='bx bx-bath'></i></div>
                <div class="spec-text">
                  <small>Kamar Mandi</small>
                  <strong>{{ selectedRoom.typeId === 'km-dalam' ? 'Mandi Dalam (Shower & Closet)' : 'Kamar Mandi Luar Bersama' }}</strong>
                </div>
              </div>
              <div class="spec-item">
                <div class="spec-icon"><i class='bx bx-wifi'></i></div>
                <div class="spec-text">
                  <small>Fasilitas Utama</small>
                  <strong>Free High-Speed WiFi 24h</strong>
                </div>
              </div>
              <div class="spec-item">
                <div class="spec-icon"><i class='bx bx-zap'></i></div>
                <div class="spec-text">
                  <small>Listrik</small>
                  <strong>Token (Meteran Mandiri)</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Room Number Selector Grid -->
        <div class="room-number-section">
          <h3><i class='bx bx-key'></i> Pilih Nomor Kamar Kosong di {{ currentBuilding.name }}</h3>
          <p>Klik salah satu nomor kamar di bawah ini yang siap dihuni:</p>
          <div class="room-number-grid">
            <button 
              v-for="rm in roomsInSelectedBuilding" 
              :key="rm.id"
              class="room-number-pill"
              :class="[
                rm.status === 'available' ? 'pill-available' : 'pill-occupied',
                { selected: selectedRoomId === rm.id }
              ]"
              :disabled="rm.status === 'occupied'"
              @click="selectRoomDirect(rm)"
            >
              <i class='bx' :class="rm.status === 'available' ? 'bx-key' : 'bx-lock-alt'"></i>
              <span>Kamar {{ rm.number }}</span>
              <small>{{ rm.status === 'available' ? 'Tersedia' : 'Terisi' }}</small>
            </button>
          </div>
        </div>

        <!-- INTERACTIVE PRICE & ADDON ESTIMATOR WIDGET -->
        <div class="estimator-container">
          <div class="estimator-header">
            <span class="estimator-tag"><i class='bx bx-calculator'></i> Simulasi Sewa & Add-on</span>
            <h3>Hitung Estimasi Biaya Sewa Kamar {{ selectedRoom.number }}</h3>
            <p>Atur durasi sewa dan opsi tambahan untuk menghitung perkiraan total biaya secara otomatis.</p>
          </div>

          <div class="estimator-body">
            <div class="estimator-controls">
              <!-- Duration Range Slider -->
              <div class="estimator-group">
                <label class="estimator-label">
                  <i class='bx bx-calendar'></i> Durasi Sewa: <strong>{{ calcDuration }} Bulan</strong>
                </label>
                <input 
                  type="range" 
                  min="1" 
                  max="12" 
                  v-model.number="calcDuration" 
                  class="estimator-range"
                />
                <div class="range-marks">
                  <span>1 Bln</span>
                  <span>3 Bln (Diskon 5%)</span>
                  <span>6 Bln</span>
                  <span>12 Bln (Diskon 10%)</span>
                </div>
              </div>

              <!-- Add-ons Checkboxes -->
              <div class="estimator-group">
                <label class="estimator-label"><i class='bx bx-plus-circle'></i> Layanan Tambahan (Opsional)</label>
                <div class="checkbox-group">
                  <label class="checkbox-card" :class="{ checked: calcAddonParking }">
                    <input type="checkbox" v-model="calcAddonParking" />
                    <div class="checkbox-text">
                      <strong>Parkir Motor Dedicated</strong>
                      <span>+ Rp 50.000 / bulan</span>
                    </div>
                  </label>
                  <label class="checkbox-card" :class="{ checked: calcAddonLaundry }">
                    <input type="checkbox" v-model="calcAddonLaundry" />
                    <div class="checkbox-text">
                      <strong>Jasa Laundry Berlangganan</strong>
                      <span>+ Rp 75.000 / bulan</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <!-- Estimator Price Summary -->
            <div class="estimator-summary-panel">
              <div class="summary-badge"><i class='bx bx-receipt'></i> Rincian Biaya</div>
              <div class="summary-row">
                <span>Harga Kamar per Bulan:</span>
                <strong>{{ formatRupiah(basePricePerMonth) }}</strong>
              </div>
              <div v-if="calcAddonParking" class="summary-row">
                <span>Parkir Motor Dedicated:</span>
                <strong>+ {{ formatRupiah(50000) }}</strong>
              </div>
              <div v-if="calcAddonLaundry" class="summary-row">
                <span>Jasa Laundry Berlangganan:</span>
                <strong>+ {{ formatRupiah(75000) }}</strong>
              </div>
              <div class="summary-divider"></div>
              <div class="summary-row summary-total">
                <span>Total per Bulan:</span>
                <strong class="text-primary">{{ formatRupiah(totalPerMonthWithAddons) }}</strong>
              </div>
              <div class="summary-row summary-grand">
                <span>Estimasi Total ({{ calcDuration }} Bulan):</span>
                <strong class="grand-price">{{ formatRupiah(grandTotalEstimator) }}</strong>
              </div>

              <!-- Booking CTA Buttons -->
              <div class="booking-cta-group">
                <a 
                  :href="`https://wa.me/62895378020456?text=${calcWaMessage}`" 
                  target="_blank" 
                  rel="noopener"
                  class="btn btn-primary btn-wa"
                >
                  <i class='bx bxl-whatsapp'></i> Pesan via WhatsApp
                </a>
                <button class="btn btn-secondary btn-form" @click="openBookingModal">
                  <i class='bx bx-edit-alt'></i> Form Booking Online
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="step-nav-footer">
          <button class="btn btn-ghost" @click="goToStep(2)">
            <i class='bx bx-left-arrow-alt'></i> Kembali ke Pilih Gedung
          </button>
        </div>
      </section>
    </main>

    <!-- ONLINE BOOKING FORM MODAL -->
    <div v-if="isModalOpen" class="modal-backdrop" @click.self="closeModal">
      <div class="modal-box">
        <button class="modal-close" @click="closeModal"><i class='bx bx-x'></i></button>

        <div v-if="!isSubmitted">
          <div class="modal-header">
            <h2>Formulir Booking Kamar {{ selectedRoom?.number }}</h2>
            <p>{{ currentBuilding.name }} — {{ selectedRoom?.typeName }}</p>
          </div>

          <form @submit.prevent="submitBookingForm" class="booking-form">
            <div class="form-group">
              <label>Nama Lengkap (Sesuai KTP)</label>
              <input type="text" v-model="bookingForm.fullName" placeholder="Masukkan nama lengkap Anda" required />
            </div>

            <div class="form-group">
              <label>Nomor WhatsApp / HP</label>
              <input type="tel" v-model="bookingForm.phone" placeholder="Contoh: 081234567890" required />
            </div>

            <div class="form-group">
              <label>Rencana Tanggal Masuk</label>
              <input type="date" v-model="bookingForm.startDate" required />
            </div>

            <div class="form-group">
              <label>Catatan / Pertanyaan Tambahan</label>
              <textarea v-model="bookingForm.notes" rows="2" placeholder="Catatan atau pertanyaan untuk pengelola..."></textarea>
            </div>

            <div class="form-summary">
              <span>Estimasi Total ({{ calcDuration }} Bulan):</span>
              <strong>{{ formatRupiah(grandTotalEstimator) }}</strong>
            </div>

            <button type="submit" class="btn btn-primary submit-booking-btn">
              <i class='bx bx-send'></i> Kirim Permohonan Pesan
            </button>
          </form>
        </div>

        <div v-else class="modal-success">
          <div class="success-icon"><i class='bx bx-check-circle'></i></div>
          <h2>Permohonan Terkirim!</h2>
          <p>Terima kasih, <strong>{{ bookingForm.fullName }}</strong>. Permohonan booking Kamar {{ selectedRoom?.number }} telah kami terima. Pengelola Sekar Space akan menghubungi Anda via WhatsApp di <strong>{{ bookingForm.phone }}</strong> untuk konfirmasi.</p>
          <button class="btn btn-primary" @click="closeModal">Tutup</button>
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
  background: var(--off-white);
}

.main-body {
  flex: 1;
  padding-top: 100px;
  padding-bottom: 80px;
}

.page-header {
  margin-bottom: 32px;
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
  font-size: 2.2rem;
  margin-bottom: 8px;
}

.page-header p {
  color: var(--text-muted);
  font-size: 0.95rem;
}

/* STEP PROGRESS INDICATOR */
.step-progress {
  display: flex;
  align-items: center;
  justify-content: center;
  max-width: 700px;
  margin: 0 auto 36px;
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: all var(--transition-base);
}

.step-number {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--white);
  border: 2px solid var(--border);
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1rem;
  transition: all var(--transition-base);
}

.step-item.active .step-number {
  background: var(--primary);
  border-color: var(--primary);
  color: var(--white);
  box-shadow: 0 4px 14px rgba(84, 26, 26, 0.25);
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
  margin: 0 16px 24px;
}

.step-connector.active {
  background: var(--primary);
}

/* SELECTION SUMMARY BAR */
.selection-summary {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 32px;
  flex-wrap: wrap;
}

.summary-chip {
  background: var(--white);
  border: 1px solid var(--border);
  color: var(--primary);
  padding: 6px 16px;
  border-radius: var(--radius-full);
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-fast);
}

.summary-chip:hover {
  border-color: var(--secondary);
  transform: translateY(-2px);
}

.summary-chip.active-chip {
  background: var(--primary);
  color: var(--white);
  border-color: var(--primary);
}

.summary-separator {
  color: var(--text-muted);
  font-size: 1.2rem;
  font-weight: 700;
}

/* STEP TITLE & SPACING */
.step-panel {
  animation: fadeIn 0.4s cubic-bezier(0.25, 1, 0.5, 1);
}

.step-title {
  text-align: center;
  max-width: 760px;
  margin: 0 auto 40px;
  padding: 0 16px;
}

.step-title h2 {
  font-size: clamp(1.5rem, 3.2vw, 1.95rem);
  color: var(--dark);
  margin-bottom: 12px;
  font-weight: 700;
  line-height: 1.3;
}

.step-title p {
  font-size: 1rem;
  color: var(--text-muted);
  line-height: 1.6;
}

/* STEP 1: TYPE SELECTION GRID */
.type-selection-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  max-width: 920px;
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
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
}

.type-card:hover, .type-card.selected {
  border-color: var(--primary);
  transform: translateY(-6px);
  box-shadow: var(--shadow-lg);
}

.card-premium {
  border-color: var(--secondary);
  background: linear-gradient(180deg, var(--white) 0%, var(--tertiary-light) 100%);
}

.type-badge-float {
  position: absolute;
  top: 20px;
  right: 20px;
  background: linear-gradient(135deg, #E8A838, #D4912A);
  color: white;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: var(--radius-full);
  box-shadow: 0 4px 12px rgba(212, 145, 42, 0.3);
}

.type-card-icon {
  width: 52px;
  height: 52px;
  border-radius: var(--radius-md);
  background: var(--tertiary);
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.6rem;
  margin-bottom: 16px;
}

.type-card h3 {
  font-size: 1.35rem;
  margin-bottom: 8px;
  color: var(--dark);
}

.type-desc {
  font-size: 0.9rem;
  color: var(--text-muted);
  margin-bottom: 20px;
  line-height: 1.5;
}

.type-features {
  margin-bottom: 24px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
}

.type-features li {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.88rem;
  color: var(--dark);
}

.type-features i {
  color: #16A34A;
  font-size: 1.1rem;
}

.type-price {
  margin-top: auto;
  margin-bottom: 20px;
}

.price-label {
  display: block;
  font-size: 0.78rem;
  color: var(--text-muted);
}

.price-amount {
  font-family: var(--font-heading);
  font-size: 1.4rem;
  color: var(--primary);
  font-weight: 700;
}

.price-amount span {
  font-size: 0.85rem;
  font-weight: 400;
  color: var(--text-muted);
}

.type-btn {
  width: 100%;
}

/* STEP 2: BUILDING GRID & FLOOR PLAN */
.building-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-bottom: 52px;
}

.building-card {
  background: var(--white);
  border: 2px solid var(--border);
  border-radius: var(--radius-xl);
  padding: 24px;
  cursor: pointer;
  transition: all var(--transition-smooth);
  display: flex;
  flex-direction: column;
}

.building-card:hover, .building-card.selected {
  border-color: var(--primary);
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
}

.building-card.selected {
  background: var(--tertiary-light);
}

.building-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.building-icon {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  background: var(--tertiary);
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.building-badge {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 3px 10px;
  background: var(--primary);
  color: var(--white);
  border-radius: var(--radius-full);
}

.building-card h3 {
  font-size: 1.15rem;
  margin-bottom: 6px;
  color: var(--dark);
}

.building-desc {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-bottom: 14px;
  line-height: 1.4;
}

.building-fac-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 20px;
  flex: 1;
}

.building-fac-list li {
  font-size: 0.8rem;
  color: var(--dark);
  display: flex;
  align-items: center;
  gap: 6px;
}

.building-fac-list i {
  color: var(--primary);
}

.building-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 12px;
  border-top: 1px solid var(--border);
}

.badge-avail {
  font-size: 0.8rem;
  color: #16A34A;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
}

/* FLOOR PLAN CONTAINER */
.floor-plan-container {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  padding: 32px;
  box-shadow: var(--shadow-md);
}

.floor-plan-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.floor-plan-header h3 {
  font-size: 1.3rem;
  color: var(--dark);
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.floor-plan-header h3 i {
  color: var(--primary);
}

.floor-plan-header p {
  font-size: 0.88rem;
  color: var(--text-muted);
}

.floor-switcher {
  display: flex;
  gap: 8px;
  background: var(--off-white);
  padding: 4px;
  border-radius: var(--radius-full);
  border: 1px solid var(--border);
}

.floor-btn {
  padding: 8px 18px;
  border-radius: var(--radius-full);
  border: none;
  background: transparent;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all var(--transition-base);
}

.floor-btn.active {
  background: var(--primary);
  color: var(--white);
}

/* FLOOR PLAN LEGEND */
.floor-plan-legend {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: var(--off-white);
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  font-size: 0.8rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-muted);
}

.legend-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border-radius: var(--radius-full);
  font-weight: 700;
  font-size: 0.72rem;
}

.legend-pill.type-km-dalam,
.node-room-type-tag.km-dalam {
  background: #FEF3C7;
  color: #B45309;
  border: 1px solid #FCD34D;
}

.legend-pill.type-km-luar,
.node-room-type-tag.km-luar {
  background: #E0F2FE;
  color: #0369A1;
  border: 1px solid #BAE6FD;
}

.legend-pill.type-fasilitas,
.node-room-type-tag.fasilitas {
  background: #F3F4F6;
  color: #4B5563;
  border: 1px solid #E5E7EB;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.legend-dot.status-avail {
  background: #15803D;
}

.legend-dot.status-occ {
  background: #B91C1C;
}

.node-room-type-tag {
  position: absolute;
  top: 10px;
  right: 10px;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 0.68rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: var(--radius-full);
}

.floor-layout-box {
  background: var(--off-white);
  border: 2px dashed var(--border);
  border-radius: var(--radius-lg);
  padding: 24px;
  margin-bottom: 24px;
}

.floor-node-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.floor-node-card {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 20px 16px 16px;
  text-align: center;
  position: relative;
  transition: all var(--transition-base);
}

.floor-node-card.is-clickable {
  cursor: pointer;
}

.floor-node-card.is-clickable:hover {
  border-color: var(--primary);
  transform: scale(1.03);
  box-shadow: var(--shadow-md);
}

.floor-node-card.is-selected {
  border-color: var(--primary);
  background: var(--tertiary-light);
}

.node-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--tertiary);
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  margin: 0 auto 8px;
}

.node-num {
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 1.05rem;
  color: var(--dark);
}

.node-type {
  font-size: 0.78rem;
  color: var(--text-muted);
  margin-bottom: 8px;
}

.node-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-size: 0.7rem;
  font-weight: 700;
}

.floor-node-card.tersedia .node-badge {
  background: #DCFCE7;
  color: #15803D;
}

.floor-node-card.terisi .node-badge {
  background: #FEE2E2;
  color: #B91C1C;
}

.floor-node-card.fasilitas-umum .node-badge {
  background: #E0F2FE;
  color: #0369A1;
}

.node-click-hint {
  display: block;
  font-size: 0.7rem;
  color: var(--primary);
  font-weight: 600;
  margin-top: 6px;
}

.floor-plan-cta {
  display: flex;
  justify-content: flex-end;
}

/* STEP 3: ROOM DETAIL & SPECS */
.room-detail-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 36px;
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  padding: 36px;
  margin-bottom: 32px;
  box-shadow: var(--shadow-sm);
}

.room-gallery {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.gallery-main {
  position: relative;
  height: 320px;
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--dark);
}

.main-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}

.gallery-main:hover .main-img {
  transform: scale(1.04);
}

.gallery-badge {
  position: absolute;
  top: 16px;
  left: 16px;
  padding: 4px 12px;
  background: rgba(84, 26, 26, 0.85);
  color: var(--white);
  font-size: 0.78rem;
  font-weight: 700;
  border-radius: var(--radius-full);
  backdrop-filter: blur(4px);
}

.gallery-zoom-overlay {
  position: absolute;
  bottom: 0;
  inset-x: 0;
  padding: 16px;
  background: linear-gradient(to top, rgba(0,0,0,0.7), transparent);
  color: var(--white);
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
}

.gallery-thumbs {
  display: flex;
  gap: 10px;
}

.thumb-btn {
  flex: 1;
  height: 64px;
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 2px solid transparent;
  cursor: pointer;
  opacity: 0.7;
  transition: all var(--transition-base);
  padding: 0;
  background: none;
}

.thumb-btn.active {
  border-color: var(--primary);
  opacity: 1;
  transform: scale(1.05);
}

.thumb-btn img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.room-specs {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.type-badge {
  display: inline-block;
  padding: 4px 12px;
  background: var(--tertiary);
  color: var(--primary);
  font-size: 0.75rem;
  font-weight: 700;
  border-radius: var(--radius-full);
  margin-bottom: 10px;
  align-self: flex-start;
}

.room-specs-header h2 {
  font-size: 1.5rem;
  color: var(--dark);
  margin-bottom: 6px;
}

.building-name {
  font-size: 0.88rem;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 20px;
}

.building-name i {
  color: var(--primary);
}

.room-price-display {
  background: var(--off-white);
  padding: 16px 20px;
  border-radius: var(--radius-lg);
  border-left: 4px solid var(--primary);
  margin-bottom: 24px;
}

.price-main {
  font-family: var(--font-heading);
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--primary);
}

.price-main span {
  font-size: 0.85rem;
  color: var(--text-muted);
  font-weight: 400;
}

.spec-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.spec-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--off-white);
  border-radius: var(--radius-md);
}

.spec-icon {
  width: 38px;
  height: 38px;
  border-radius: var(--radius-md);
  background: var(--white);
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  box-shadow: var(--shadow-sm);
}

.spec-text small {
  display: block;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.spec-text strong {
  font-size: 0.88rem;
  color: var(--dark);
}

/* ROOM NUMBER PICKER SECTION */
.room-number-section {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  padding: 28px;
  margin-bottom: 32px;
  box-shadow: var(--shadow-sm);
}

.room-number-section h3 {
  font-size: 1.2rem;
  color: var(--dark);
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.room-number-section h3 i {
  color: var(--primary);
}

.room-number-section p {
  font-size: 0.88rem;
  color: var(--text-muted);
  margin-bottom: 20px;
}

.room-number-grid {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
}

.room-number-pill {
  padding: 12px 20px;
  border-radius: var(--radius-lg);
  border: 2px solid var(--border);
  background: var(--white);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  transition: all var(--transition-base);
  min-width: 120px;
}

.room-number-pill.pill-available {
  border-color: #BBF7D0;
}

.room-number-pill.pill-available:hover,
.room-number-pill.selected {
  border-color: var(--primary);
  background: var(--tertiary-light);
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
}

.room-number-pill.pill-occupied {
  opacity: 0.5;
  cursor: not-allowed;
  background: #FEE2E2;
}

.room-number-pill i {
  font-size: 1.3rem;
  color: var(--primary);
}

.room-number-pill span {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--dark);
}

.room-number-pill small {
  font-size: 0.72rem;
  color: var(--text-muted);
}

/* ESTIMATOR WIDGET ON STEP 3 */
.estimator-container {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  padding: 36px;
  margin-bottom: 32px;
  box-shadow: var(--shadow-md);
}

.estimator-header {
  margin-bottom: 28px;
}

.estimator-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  background: var(--tertiary);
  color: var(--primary);
  font-size: 0.78rem;
  font-weight: 700;
  border-radius: var(--radius-full);
  margin-bottom: 8px;
}

.estimator-header h3 {
  font-size: 1.4rem;
  color: var(--dark);
  margin-bottom: 4px;
}

.estimator-header p {
  font-size: 0.9rem;
  color: var(--text-muted);
}

.estimator-body {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 32px;
}

.estimator-controls {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.estimator-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.estimator-label {
  font-size: 0.92rem;
  font-weight: 600;
  color: var(--dark);
  display: flex;
  align-items: center;
  gap: 8px;
}

.estimator-label i {
  color: var(--primary);
  font-size: 1.2rem;
}

.estimator-range {
  accent-color: var(--primary);
  height: 8px;
  border-radius: var(--radius-full);
  cursor: pointer;
}

.range-marks {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.checkbox-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--off-white);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-base);
}

.checkbox-card.checked {
  border-color: var(--primary);
  background: var(--tertiary-light);
}

.checkbox-card input {
  accent-color: var(--primary);
  width: 18px;
  height: 18px;
}

.checkbox-text strong {
  display: block;
  font-size: 0.88rem;
  color: var(--dark);
}

.checkbox-text span {
  font-size: 0.78rem;
  color: var(--text-muted);
}

.estimator-summary-panel {
  background: var(--off-white);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.summary-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: var(--primary);
  color: var(--white);
  font-size: 0.75rem;
  font-weight: 700;
  border-radius: var(--radius-full);
  align-self: flex-start;
}

.summary-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.88rem;
  color: var(--text-muted);
}

.summary-row strong {
  color: var(--dark);
  font-weight: 600;
}

.summary-divider {
  height: 1px;
  background: var(--border);
  margin: 4px 0;
}

.grand-price {
  font-family: var(--font-heading);
  font-size: 1.35rem;
  color: var(--primary);
  font-weight: 700;
}

.booking-cta-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 14px;
}

.btn-wa {
  background: #25D366;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 600;
  padding: 12px;
  border-radius: var(--radius-md);
  text-decoration: none;
  transition: all var(--transition-base);
}

.btn-wa:hover {
  background: #20b858;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 14px rgba(37, 211, 102, 0.3);
}

.btn-secondary {
  background: var(--white);
  border: 1px solid var(--border);
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 600;
  padding: 12px;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-base);
}

.btn-secondary:hover {
  background: var(--tertiary);
  border-color: var(--primary);
}

.step-nav-footer {
  display: flex;
  justify-content: flex-start;
}

/* MODAL DIALOG */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
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
  animation: zoomIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
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
  font-size: 1.4rem;
  cursor: pointer;
  color: var(--text-muted);
}

.modal-close:hover {
  background: var(--primary);
  color: var(--white);
}

.modal-header h2 {
  font-size: 1.4rem;
  color: var(--dark);
  margin-bottom: 4px;
}

.modal-header p {
  font-size: 0.88rem;
  color: var(--text-muted);
  margin-bottom: 20px;
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
  color: var(--dark);
}

.form-group input,
.form-group textarea {
  padding: 10px 14px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  font-family: var(--font-body);
  font-size: 0.9rem;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(84, 26, 26, 0.1);
}

.form-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--off-white);
  padding: 12px 16px;
  border-radius: var(--radius-md);
  font-size: 0.88rem;
  color: var(--text-muted);
}

.form-summary strong {
  color: var(--primary);
  font-size: 1.1rem;
}

.submit-booking-btn {
  width: 100%;
  padding: 12px;
}

.modal-success {
  text-align: center;
  padding: 20px 0;
}

.success-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #DCFCE7;
  color: #16A34A;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.2rem;
  margin: 0 auto 16px;
}

.modal-success h2 {
  font-size: 1.5rem;
  margin-bottom: 10px;
  color: var(--dark);
}

.modal-success p {
  font-size: 0.92rem;
  color: var(--text-muted);
  line-height: 1.6;
  margin-bottom: 24px;
}

/* RESPONSIVE MEDIA QUERIES */
@media (max-width: 1024px) {
  .type-selection-grid,
  .room-detail-layout,
  .estimator-body {
    grid-template-columns: 1fr;
  }
  .building-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .floor-node-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .building-grid {
    grid-template-columns: 1fr;
  }
  .floor-node-grid {
    grid-template-columns: 1fr;
  }
  .spec-grid {
    grid-template-columns: 1fr;
  }
  .step-progress {
    gap: 4px;
  }
  .step-connector {
    margin: 0 6px 24px;
  }
  .step-label {
    font-size: 0.72rem;
  }
  .step-number {
    width: 32px;
    height: 32px;
    font-size: 0.82rem;
  }
  .selection-summary {
    flex-wrap: wrap;
    gap: 6px;
    padding: 10px 14px;
    font-size: 0.78rem;
  }
  .summary-chip {
    font-size: 0.75rem;
    padding: 4px 8px;
  }
  .step-title h2 {
    font-size: 1.3rem;
  }
  .step-title p {
    font-size: 0.85rem;
  }
  .type-card {
    padding: 24px 18px;
  }
  .type-card h3 {
    font-size: 1.15rem;
  }
  .type-desc {
    font-size: 0.85rem;
  }
  .building-card {
    padding: 20px 16px;
  }
  .building-card h3 {
    font-size: 1.05rem;
  }
  .room-detail-header h2 {
    font-size: 1.25rem;
  }
  .gallery-main img {
    height: 240px;
  }
  .gallery-thumbs img {
    width: 60px;
    height: 45px;
  }
  .estimator-box {
    padding: 20px 16px;
  }
  .modal-content {
    width: 92vw;
    max-height: 90vh;
    padding: 24px 18px;
  }
}

@media (max-width: 480px) {
  .step-progress {
    gap: 2px;
    padding: 0 6px;
  }
  .step-connector {
    margin: 0 4px 24px;
    min-width: 20px;
  }
  .step-label {
    font-size: 0.65rem;
    max-width: 70px;
    text-align: center;
  }
  .step-number {
    width: 28px;
    height: 28px;
    font-size: 0.75rem;
  }
  .selection-summary {
    padding: 8px 10px;
  }
  .summary-chip {
    font-size: 0.7rem;
    padding: 3px 6px;
  }
  .summary-separator {
    display: none;
  }
  .step-title h2 {
    font-size: 1.15rem;
  }
  .step-title p {
    font-size: 0.8rem;
  }
  .type-card {
    padding: 20px 14px;
  }
  .type-features li {
    font-size: 0.82rem;
  }
  .price-amount {
    font-size: 1.15rem;
  }
  .floor-node-grid {
    gap: 10px;
  }
  .room-node {
    padding: 14px 12px;
  }
  .gallery-main img {
    height: 200px;
  }
  .gallery-thumbs {
    gap: 6px;
  }
  .gallery-thumbs img {
    width: 50px;
    height: 38px;
  }
  .spec-item {
    padding: 10px 12px;
  }
  .estimator-box {
    padding: 16px 12px;
  }
  .modal-content {
    width: 96vw;
    padding: 20px 14px;
    border-radius: var(--radius-lg);
  }
}
</style>
