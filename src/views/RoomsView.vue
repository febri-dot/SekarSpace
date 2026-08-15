<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import Navbar from '../components/layout/Navbar.vue'
import Footer from '../components/layout/Footer.vue'
import { useDataStore, getRoomPriceByDuration, type RoomData, type RoomTypeData } from '../composables/useDataStore'
import communalFacilitiesData from '../data/communalFacilities.json'
import roomGalleriesData from '../data/roomGalleries.json'

const { rooms, roomTypes, bookRoom, buildings, cmsSettings } = useDataStore()
const route = useRoute()

// Floating button state for Step 2 & Step 3
const showScrollToTopBtn = ref(false)

const handleScroll = () => {
  if (currentStep.value === 2) {
    showScrollToTopBtn.value = window.scrollY > 350
  } else if (currentStep.value === 3) {
    showScrollToTopBtn.value = window.scrollY > 300
  } else {
    showScrollToTopBtn.value = false
  }
}

const handleFloatingAction = () => {
  if (currentStep.value === 2) {
    scrollToBuildingGrid()
  } else if (currentStep.value === 3) {
    window.scrollTo({ top: 140, behavior: 'smooth' })
  }
}

// Dynamic Room Types Data derived directly from roomTypes.json + live room counts from rooms.json
const roomTypesData = computed(() => {
  const kmLuarMeta = (roomTypes.value.find(t => t.typeId === 'km-luar') || {}) as RoomTypeData
  const kmDalamMeta = (roomTypes.value.find(t => t.typeId === 'km-dalam') || {}) as RoomTypeData

  const kmLuarRooms = rooms.value.filter(r => r.typeId === 'km-luar')
  const kmLuarAvailable = kmLuarRooms.filter(r => r.status === 'available').length
  const minPriceKmLuar = kmLuarRooms.length > 0 
    ? Math.min(...kmLuarRooms.map(r => r.price || r.price1Month || 600000))
    : (cmsSettings.value?.priceKmLuarMonthly || 600000)

  const kmDalamRooms = rooms.value.filter(r => r.typeId === 'km-dalam')
  const kmDalamAvailable = kmDalamRooms.filter(r => r.status === 'available').length
  const minPriceKmDalam = kmDalamRooms.length > 0
    ? Math.min(...kmDalamRooms.map(r => r.price || r.price1Month || 850000))
    : (cmsSettings.value?.priceKmDalamMonthly || 850000)

  return {
    kmLuar: {
      ...kmLuarMeta,
      price: minPriceKmLuar,
      totalRooms: kmLuarRooms.length,
      availableRooms: kmLuarAvailable
    },
    kmDalam: {
      ...kmDalamMeta,
      price: minPriceKmDalam,
      totalRooms: kmDalamRooms.length,
      availableRooms: kmDalamAvailable
    }
  }
})

const getAvailableCountForBuilding = (bId: string) => {
  return rooms.value.filter(r => {
    const isThisBuilding = r.buildingId === bId || (bId === 'utama' && r.buildingId === 'bld-a') || (bId === 'timur' && r.buildingId === 'bld-b') || (bId === 'barat' && r.buildingId === 'bld-c')
    const isAvail = r.status === 'available'
    const isTypeMatch = !selectedType.value || r.typeId === selectedType.value
    return isThisBuilding && isAvail && isTypeMatch
  }).length
}

// Step Management
const currentStep = ref<number>(1)
const selectedType = ref<'km-luar' | 'km-dalam' | null>(null)
const selectedBuildingId = ref<string>('utama')
const selectedRoomId = ref<string | null>(null)
const activeFloor = ref<'floor1' | 'floor2'>('floor1')

// Selected Active Room Object for Step 3
const selectedRoom = computed<RoomData | null>(() => {
  if (selectedRoomId.value) {
    const found = rooms.value.find(r => r.id === selectedRoomId.value)
    if (found) return found
  }
  return null
})

// Gallery State for Step 3
const activeImageIndex = ref<number>(0)

// Dynamic Gallery Images based on Room Type loaded from JSON
const galleryImages = computed(() => {
  const typeKey = selectedRoom.value?.typeId === 'km-dalam' ? 'km-dalam' : 'km-luar'
  return (roomGalleriesData as Record<string, { url: string; title: string }[]>)[typeKey] || []
})

// Reset gallery active index when room changes
watch(selectedRoomId, () => {
  activeImageIndex.value = 0
})

// Lightbox Preview Modal State
const isLightboxOpen = ref(false)
const openLightbox = () => {
  isLightboxOpen.value = true
}
const closeLightbox = () => {
  isLightboxOpen.value = false
}
const prevLightboxImage = () => {
  activeImageIndex.value = (activeImageIndex.value - 1 + galleryImages.value.length) % galleryImages.value.length
}
const nextLightboxImage = () => {
  activeImageIndex.value = (activeImageIndex.value + 1) % galleryImages.value.length
}

// Calculator & Estimator State for Step 3
const durationOptions = [1, 3, 6, 12]
const durationIndex = ref<number>(0) // 0 = 1 month, 1 = 3 months, 2 = 6 months, 3 = 12 months
const calcDuration = computed(() => durationOptions[durationIndex.value] || 1)

const calcAddonExtraPerson = ref<boolean>(false)
const calcAddonCarParking = ref<boolean>(false)

// Building Data Definition (Loaded from JSON via useDataStore)
const buildingList = computed(() => buildings.value)

// Selected Building Object
const currentBuilding = computed(() => {
  return buildingList.value.find(b => b.id === selectedBuildingId.value) || buildingList.value[0]!
})

// Rooms filtered by Building & Type
const roomsInSelectedBuilding = computed(() => {
  return rooms.value.filter(r => r.buildingId === selectedBuildingId.value || (selectedBuildingId.value === 'utama' && r.buildingId === 'bld-a') || (selectedBuildingId.value === 'timur' && r.buildingId === 'bld-b') || (selectedBuildingId.value === 'barat' && r.buildingId === 'bld-c'))
})

const availableRoomsInBuilding = computed(() => {
  return roomsInSelectedBuilding.value.filter(r => r.status === 'available')
})

// Helper to map building identifier to standard key
const getBuildingKey = (bId: string): 'bld-a' | 'bld-b' | 'bld-c' => {
  if (bId === 'utama' || bId === 'bld-a') return 'bld-a'
  if (bId === 'timur' || bId === 'bld-b') return 'bld-b'
  if (bId === 'barat' || bId === 'bld-c') return 'bld-c'
  return 'bld-a'
}

// Floor Plan Nodes for Selected Building (Clean JSON lookup, no repetitive if/else)
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

  const key = getBuildingKey(selectedBuildingId.value)
  const communalMap = communalFacilitiesData[key] || communalFacilitiesData['bld-a']
  const communalNodes = (communalMap as any)[String(floorNum)] || []

  return [...roomNodes, ...communalNodes]
})

// Calculator Calculations (Direct JSON Data Lookup)
const basePriceTotal = computed(() => {
  if (!selectedRoom.value) return 0
  return getRoomPriceByDuration(selectedRoom.value, calcDuration.value)
})

const totalAddonsTotal = computed(() => {
  let addons = 0
  if (calcAddonExtraPerson.value) addons += 250000 * calcDuration.value
  if (calcAddonCarParking.value) addons += 50000 * calcDuration.value
  return addons
})

const grandTotalEstimator = computed(() => {
  return basePriceTotal.value + totalAddonsTotal.value
})

const calcWaMessage = computed(() => {
  if (!selectedRoom.value) return ''
  const roomNum = selectedRoom.value.number
  const bldName = currentBuilding.value.name
  const roomType = selectedRoom.value.typeName
  const addons = []
  if (calcAddonExtraPerson.value) {
    addons.push(`Penghuni Lebih dari 1 Orang (Rp ${(250000 * calcDuration.value).toLocaleString('id-ID')} untuk ${calcDuration.value} bln)`)
  }
  if (calcAddonCarParking.value) {
    addons.push(`Parkir Mobil (Rp ${(50000 * calcDuration.value).toLocaleString('id-ID')} untuk ${calcDuration.value} bln)`)
  }
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
  selectedRoomId.value = null // Reset room selection when building changes

  nextTick(() => {
    const el = document.getElementById('floorPlanSection')
    if (el) {
      const topPos = el.getBoundingClientRect().top + window.scrollY - 85
      window.scrollTo({ top: topPos, behavior: 'smooth' })
    }
  })
}

const scrollToBuildingGrid = () => {
  const el = document.getElementById('buildingSelectionSection')
  if (el) {
    const topPos = el.getBoundingClientRect().top + window.scrollY - 85
    window.scrollTo({ top: topPos, behavior: 'smooth' })
  } else {
    window.scrollTo({ top: 150, behavior: 'smooth' })
  }
}

const selectRoomFromFloorPlan = (roomNode: any) => {
  if (!roomNode.isRoom) return
  if (roomNode.roomData.status === 'occupied') return
  if (selectedType.value && roomNode.typeId !== selectedType.value) {
    alert(`Kamar ini bertipe ${roomNode.typeId === 'km-dalam' ? 'Kamar Mandi Dalam' : 'Kamar Mandi Luar'}. Silakan pilih kamar tipe ${selectedType.value === 'km-dalam' ? 'Kamar Mandi Dalam' : 'Kamar Mandi Luar'} sesuai pilihan Anda di Langkah 1.`)
    return
  }
  selectedRoomId.value = roomNode.roomData.id
  currentStep.value = 3
}

const selectRoomDirect = (room: RoomData) => {
  if (room.status === 'occupied') return
  if (selectedType.value && room.typeId !== selectedType.value) {
    alert(`Kamar ini bertipe ${room.typeId === 'km-dalam' ? 'Kamar Mandi Dalam' : 'Kamar Mandi Luar'}. Silakan pilih kamar tipe ${selectedType.value === 'km-dalam' ? 'Kamar Mandi Dalam' : 'Kamar Mandi Luar'} sesuai pilihan Anda di Langkah 1.`)
    return
  }
  selectedRoomId.value = room.id
}

const goToStep = (step: number) => {
  if (step >= 2 && !selectedType.value) {
    alert('Silakan pilih Tipe Kamar terlebih dahulu.')
    return
  }
  if (step === 3 && !selectedRoomId.value) {
    alert('Silakan pilih Kamar yang tersedia terlebih dahulu.')
    return
  }

  currentStep.value = step
  window.scrollTo({ top: 180, behavior: 'smooth' })
}

const formatRupiah = (val: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)
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
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
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
          <i class='bx bx-bed'></i> Tipe: {{ selectedType === 'km-dalam' ? 'Kamar Mandi Dalam' : selectedType === 'km-luar' ? 'Kamar Mandi Luar' : 'Belum Dipilih' }}
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
            <div class="type-badge-top">
              <span class="badge-avail-pill">
                <i class='bx bx-check-circle'></i> {{ roomTypesData.kmLuar.availableRooms }} Kamar Tersedia
              </span>
            </div>
            <div class="type-card-icon">
              <i class='bx bx-door-open'></i>
            </div>
            <h3>{{ roomTypesData.kmLuar.typeName }}</h3>
            <p class="type-desc">{{ roomTypesData.kmLuar.desc }}</p>
            <ul class="type-features">
              <li v-for="(feat, idx) in roomTypesData.kmLuar.features" :key="idx">
                <i class='bx bx-check-circle'></i> {{ feat }}
              </li>
            </ul>
            <div class="type-price">
              <span class="price-label">Mulai dari</span>
              <strong class="price-amount">{{ formatRupiah(roomTypesData.kmLuar.price) }} <span>/ bulan</span></strong>
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
              <i class='bx bxs-star'></i> {{ roomTypesData.kmDalam.badge }}
            </div>
            <div class="type-badge-top">
              <span class="badge-avail-pill">
                <i class='bx bx-check-circle'></i> {{ roomTypesData.kmDalam.availableRooms }} Kamar Tersedia
              </span>
            </div>
            <div class="type-card-icon">
              <i class='bx bx-bath'></i>
            </div>
            <h3>{{ roomTypesData.kmDalam.typeName }}</h3>
            <p class="type-desc">{{ roomTypesData.kmDalam.desc }}</p>
            <ul class="type-features">
              <li v-for="(feat, idx) in roomTypesData.kmDalam.features" :key="idx">
                <i class='bx bx-check-circle'></i> {{ feat }}
              </li>
            </ul>
            <div class="type-price">
              <span class="price-label">Mulai dari</span>
              <strong class="price-amount">{{ formatRupiah(roomTypesData.kmDalam.price) }} <span>/ bulan</span></strong>
            </div>
            <button class="btn btn-primary type-btn">Pilih Tipe Kamar Ini</button>
          </div>
        </div>
      </section>

      <!-- ==================== STEP 2: PILIH GEDUNG & DENAH BANGUNAN ==================== -->
      <section v-if="currentStep === 2" id="buildingSelectionSection" class="step-panel">
        <div class="step-title">
          <h2>Langkah 2: Pilih Gedung & Lihat Denah Layout</h2>
          <p>Pilih gedung hunian Anda untuk melihat tata letak ruangan (Lantai 1 & 2) dan kamar yang masih siap dihuni</p>
        </div>

        <!-- Selected Room Type Notice Banner -->
        <div class="type-filter-notice">
          <div class="filter-notice-icon">
            <i :class="selectedType === 'km-dalam' ? 'bx bx-bath' : 'bx bx-door-open'"></i>
          </div>
          <div class="filter-notice-text">
            <h4>Filter Aktif: {{ selectedType === 'km-dalam' ? 'Kamar Mandi Dalam' : 'Kamar Mandi Luar' }}</h4>
            <p>Jumlah kamar yang ditampilkan di bawah adalah kamar yang <strong>tersedia khusus tipe {{ selectedType === 'km-dalam' ? 'Kamar Mandi Dalam' : 'Kamar Mandi Luar' }}</strong>.</p>
          </div>
          <button class="btn btn-outline btn-sm filter-change-btn" @click="goToStep(1)">
            <i class='bx bx-edit-alt'></i> Ubah Tipe
          </button>
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
                <i class='bx bx-check-circle'></i> {{ getAvailableCountForBuilding(bld.id) }} Kamar {{ selectedType === 'km-dalam' ? 'KM Dalam' : 'KM Luar' }} Tersedia
              </span>
            </div>
          </div>
        </div>

        <!-- INTERACTIVE FLOOR PLAN DENAH BANGUNAN FOR SELECTED BUILDING -->
        <div id="floorPlanSection" class="floor-plan-container">
          <div class="floor-plan-header">
            <div>
              <h3><i class='bx bx-map-alt'></i> Denah Layout — {{ currentBuilding.name }}</h3>
              <p>Menampilkan denah ruangan. Klik nomor kamar tipe <strong>{{ selectedType === 'km-dalam' ? 'KM Dalam' : 'KM Luar' }}</strong> yang berwarna hijau untuk memesan.</p>
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
                  { 'is-clickable': node.isRoom && node.status === 'Tersedia' && node.typeId === selectedType },
                  { 'is-disabled-type': node.isRoom && node.typeId !== selectedType },
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
                <span v-if="node.isRoom && node.status === 'Tersedia' && node.typeId === selectedType" class="node-click-hint">Pilih Kamar Ini</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ==================== STEP 3: DETAIL KAMAR, ESTIMASI BIAYA & BOOKING ==================== -->
      <section v-if="currentStep === 3 && selectedRoom" class="step-panel">
        <div class="room-detail-layout">
          <!-- Left Column: Photo Gallery -->
          <div class="room-gallery">
            <div class="gallery-main" @click="openLightbox" title="Klik untuk melihat foto ukuran penuh">
              <span class="gallery-badge">{{ selectedRoom.typeName }}</span>
              <img :src="galleryImages[activeImageIndex]?.url || galleryImages[0]!.url" :alt="selectedRoom.typeName" class="main-img" />
              <div class="gallery-zoom-overlay">
                <i class='bx bx-fullscreen'></i>
                <span>{{ galleryImages[activeImageIndex]?.title }} · <em>Klik untuk perbesar</em></span>
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
                  <strong>Token Bersama</strong>
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
                { selected: selectedRoomId === rm.id },
                { 'pill-disabled': rm.typeId !== selectedType }
              ]"
              :disabled="rm.status === 'occupied' || rm.typeId !== selectedType"
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
                  min="0" 
                  max="3" 
                  v-model.number="durationIndex" 
                  class="estimator-range"
                />
                <div class="range-marks" style="justify-content: space-between;">
                  <span>1 Bln</span>
                  <span>3 Bln</span>
                  <span>6 Bln</span>
                  <span>12 Bln</span>
                </div>
              </div>

              <!-- Add-ons Checkboxes -->
              <div class="estimator-group">
                <label class="estimator-label"><i class='bx bx-plus-circle'></i> Layanan Tambahan (Opsional)</label>
                <div class="checkbox-group">
                  <label class="checkbox-card" :class="{ checked: calcAddonExtraPerson }">
                    <input type="checkbox" v-model="calcAddonExtraPerson" />
                    <div class="checkbox-text">
                      <strong>Penghuni Lebih dari 1 Orang</strong>
                      <span>+ Rp 250.000 / bulan</span>
                    </div>
                  </label>
                  <label class="checkbox-card" :class="{ checked: calcAddonCarParking }">
                    <input type="checkbox" v-model="calcAddonCarParking" />
                    <div class="checkbox-text">
                      <strong>Parkir Mobil</strong>
                      <span>+ Rp 50.000 / bulan</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <!-- Estimator Price Summary -->
            <div class="estimator-summary-panel">
              <div class="summary-badge"><i class='bx bx-receipt'></i> Rincian Biaya</div>
              <div class="summary-row">
                <span>Harga Kamar ({{ calcDuration }} Bulan):</span>
                <strong>{{ formatRupiah(basePriceTotal) }}</strong>
              </div>
              <div v-if="calcAddonExtraPerson" class="summary-row">
                <span>Tambahan Penghuni ({{ calcDuration }} Bln):</span>
                <strong>+ {{ formatRupiah(250000 * calcDuration) }}</strong>
              </div>
              <div v-if="calcAddonCarParking" class="summary-row">
                <span>Parkir Mobil ({{ calcDuration }} Bln):</span>
                <strong>+ {{ formatRupiah(50000 * calcDuration) }}</strong>
              </div>
              <div class="summary-divider"></div>
              <div class="summary-row summary-grand">
                <span>Estimasi Total Pembayaran:</span>
                <strong class="grand-price">{{ formatRupiah(grandTotalEstimator) }}</strong>
              </div>

              <!-- Booking CTA -->
              <a 
                :href="`https://wa.me/62895378020456?text=${calcWaMessage}`" 
                target="_blank" 
                rel="noopener"
                class="btn btn-primary btn-wa btn-wa-full"
              >
                <i class='bx bxl-whatsapp'></i> Pesan via WhatsApp
              </a>

              <!-- Info Box -->
              <div class="wa-info-box"><i class='bx bx-info-circle'></i><strong> Cara Pemesanan</strong>
                <div>
                  <p>Klik tombol di atas, lalu kirim pesan ke admin. Tim kami akan membalas dalam waktu kurang dari 1 jam pada jam kerja (08.00–17.00 WIB).</p>
                </div>
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



    <Footer />

    <!-- ROOM GALLERY FULLSCREEN LIGHTBOX PREVIEW -->
    <Teleport to="body">
      <Transition name="fade">
        <div 
          v-if="isLightboxOpen" 
          class="room-lightbox-backdrop" 
          @click="closeLightbox"
        >
          <div class="room-lightbox-content" @click.stop>
            <button class="lightbox-close-btn" @click="closeLightbox" aria-label="Tutup preview">
              <i class='bx bx-x'></i>
            </button>
            
            <button class="lightbox-nav-btn prev-btn" @click="prevLightboxImage" aria-label="Foto sebelumnya">
              <i class='bx bx-chevron-left'></i>
            </button>

            <div class="lightbox-image-box">
              <img 
                :src="galleryImages[activeImageIndex]?.url" 
                :alt="galleryImages[activeImageIndex]?.title" 
                class="lightbox-img" 
              />
              <div class="lightbox-caption">
                <span class="lightbox-badge">{{ selectedRoom?.typeName }}</span>
                <h4>{{ galleryImages[activeImageIndex]?.title }}</h4>
                <span class="lightbox-counter">{{ activeImageIndex + 1 }} / {{ galleryImages.length }}</span>
              </div>
            </div>

            <button class="lightbox-nav-btn next-btn" @click="nextLightboxImage" aria-label="Foto berikutnya">
              <i class='bx bx-chevron-right'></i>
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Floating Back to Top / Action Button for Step 2 & Step 3 -->
    <Transition name="fade-slide">
      <button 
        v-if="(currentStep === 2 || currentStep === 3) && showScrollToTopBtn" 
        class="floating-scroll-top-btn"
        @click="handleFloatingAction"
        :aria-label="currentStep === 2 ? 'Kembali ke Pilihan Gedung' : 'Kembali ke Atas'"
        :title="currentStep === 2 ? 'Kembali ke pilihan gedung di atas' : 'Kembali ke detail kamar di atas'"
      >
        <i class='bx bx-up-arrow-alt'></i>
        <span>{{ currentStep === 2 ? 'Pilih Gedung Lain' : 'Kembali ke Atas' }}</span>
      </button>
    </Transition>
  </div>
</template>

<style scoped>
.rooms-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--off-white);
  position: relative;
  overflow-x: hidden;
  width: 100%;
  max-width: 100vw;
}

.main-body {
  flex: 1;
  padding-top: 95px;
  padding-bottom: 70px;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.page-header {
  margin-bottom: 24px;
  text-align: center;
}

.breadcrumb {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 0.86rem;
  color: var(--text-muted);
  margin-bottom: 8px;
}

.breadcrumb a {
  color: var(--primary);
}

.page-header h1 {
  font-size: 1.95rem;
  margin-bottom: 6px;
}

.page-header p {
  color: var(--text-muted);
  font-size: 0.92rem;
}

/* STEP PROGRESS INDICATOR */
.step-progress {
  display: flex;
  align-items: center;
  justify-content: center;
  max-width: 640px;
  margin: 0 auto 28px;
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  transition: all var(--transition-base);
}

.step-number {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: var(--white);
  border: 2px solid var(--border);
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.95rem;
  transition: all var(--transition-base);
}

.step-item.active .step-number {
  background: var(--primary);
  border-color: var(--primary);
  color: var(--white);
  box-shadow: 0 4px 14px rgba(84, 26, 26, 0.25);
}

.step-label {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-muted);
}

.step-item.active .step-label {
  color: var(--primary);
}

.step-connector {
  flex: 1;
  height: 2px;
  background: var(--border);
  margin: 0 14px 20px;
}

.step-connector.active {
  background: var(--primary);
}

/* SELECTION SUMMARY BAR */
.selection-summary {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.summary-chip {
  background: var(--white);
  border: 1px solid var(--border);
  color: var(--primary);
  padding: 5px 14px;
  border-radius: var(--radius-full);
  font-size: 0.84rem;
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
  font-size: 1.1rem;
  font-weight: 700;
}

/* STEP TITLE & SPACING */
.step-panel {
  animation: fadeIn 0.4s cubic-bezier(0.25, 1, 0.5, 1);
}

.step-title {
  text-align: center;
  max-width: 760px;
  margin: 0 auto 28px;
  padding: 0 16px;
}

.step-title h2 {
  font-size: clamp(1.4rem, 2.8vw, 1.75rem);
  color: var(--dark);
  margin-bottom: 6px;
  font-weight: 700;
  line-height: 1.3;
}

.step-title p {
  font-size: 0.92rem;
  color: var(--text-muted);
  line-height: 1.5;
}

/* STEP 1: TYPE SELECTION GRID */
.type-selection-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 28px;
  max-width: 1040px;
  margin: 0 auto;
}

.type-card {
  background: var(--white);
  border: 2px solid var(--border);
  border-radius: var(--radius-xl);
  padding: 28px 28px 30px;
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
  top: 18px;
  right: 18px;
  background: linear-gradient(135deg, #E8A838, #D4912A);
  color: white;
  font-size: 0.74rem;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: var(--radius-full);
  box-shadow: 0 4px 12px rgba(212, 145, 42, 0.28);
}

.type-badge-top {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.badge-avail-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.76rem;
  font-weight: 600;
  padding: 3px 10px;
  background: #E8F5E9;
  color: #1B5E20;
  border-radius: var(--radius-full);
  border: 1px solid rgba(46, 125, 50, 0.2);
}

.type-card-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  background: var(--tertiary);
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  margin-bottom: 14px;
}

.type-card h3 {
  font-size: 1.3rem;
  margin-bottom: 6px;
  color: var(--dark);
}

.type-desc {
  font-size: 0.88rem;
  color: var(--text-muted);
  margin-bottom: 16px;
  line-height: 1.48;
}

.type-features {
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.type-features li {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.86rem;
  color: var(--dark);
}

.type-features i {
  color: #16A34A;
  font-size: 1.05rem;
}

.type-price {
  margin-top: auto;
  margin-bottom: 18px;
}

.price-label {
  display: block;
  font-size: 0.76rem;
  color: var(--text-muted);
}

.price-amount {
  font-family: var(--font-heading);
  font-size: 1.35rem;
  color: var(--primary);
  font-weight: 700;
}

.price-amount span {
  font-size: 0.84rem;
  font-weight: 400;
  color: var(--text-muted);
}

.type-btn {
  width: 100%;
  padding: 10px 20px;
  font-size: 0.92rem;
  font-weight: 600;
}

/* STEP 2: BUILDING GRID & FLOOR PLAN */
.type-filter-notice {
  display: flex;
  align-items: center;
  gap: 16px;
  background: var(--tertiary-light);
  border: 1px solid var(--border);
  border-left: 4px solid var(--primary);
  border-radius: var(--radius-lg);
  padding: 16px 20px;
  max-width: 1040px;
  margin: 0 auto 32px;
  box-shadow: var(--shadow-sm);
}

.filter-notice-icon {
  width: 44px;
  height: 44px;
  min-width: 44px;
  border-radius: 50%;
  background: var(--white);
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  box-shadow: 0 2px 8px rgba(84, 26, 26, 0.1);
}

.filter-notice-text {
  flex: 1;
}

.filter-notice-text h4 {
  font-size: 0.98rem;
  color: var(--primary);
  margin-bottom: 2px;
  font-weight: 700;
}

.filter-notice-text p {
  font-size: 0.88rem;
  color: var(--text);
  margin: 0;
  line-height: 1.45;
}

.filter-change-btn {
  white-space: nowrap;
  font-size: 0.82rem;
  padding: 8px 16px;
  border-radius: var(--radius-full);
  background: var(--white);
  border: 1px solid var(--primary);
  color: var(--primary);
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.filter-change-btn:hover {
  background: var(--primary);
  color: var(--white);
}

@media (max-width: 600px) {
  .type-filter-notice {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    padding: 16px;
  }
  .filter-change-btn {
    width: 100%;
    justify-content: center;
  }
}

.building-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  max-width: 1040px;
  margin: 0 auto 48px;
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
  padding-top: 12px;
  border-top: 1px solid var(--border);
}

.badge-avail {
  font-size: 0.8rem;
  color: #1B5E20;
  background: #E8F5E9;
  padding: 4px 12px;
  border-radius: var(--radius-full);
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid rgba(46, 125, 50, 0.2);
}

/* FLOOR PLAN CONTAINER */
.floor-plan-container {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  padding: 32px;
  max-width: 1040px;
  margin: 0 auto;
  box-shadow: var(--shadow-md);
  box-sizing: border-box;
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

.floor-node-card.is-disabled-type {
  opacity: 0.5;
  cursor: not-allowed;
  filter: grayscale(80%);
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
  max-width: 1040px;
  margin: 0 auto 32px;
  box-shadow: var(--shadow-sm);
  min-width: 0;
  width: 100%;
  box-sizing: border-box;
}

.room-gallery {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
  max-width: 100%;
  width: 100%;
  box-sizing: border-box;
}

.gallery-main {
  position: relative;
  width: 100%;
  max-width: 100%;
  aspect-ratio: 4 / 3;
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: #201410;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: 1px solid var(--border);
  box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.03);
  transition: all var(--transition-base);
  box-sizing: border-box;
}

.gallery-main:hover {
  border-color: var(--primary);
  box-shadow: 0 8px 24px rgba(84, 26, 26, 0.15);
}

.main-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  display: block;
  transition: transform 0.4s ease;
}

.gallery-main:hover .main-img {
  transform: scale(1.03);
}

.gallery-badge {
  position: absolute;
  top: 14px;
  left: 14px;
  padding: 4px 12px;
  background: rgba(84, 26, 26, 0.88);
  color: var(--white);
  font-size: 0.78rem;
  font-weight: 700;
  border-radius: var(--radius-full);
  backdrop-filter: blur(6px);
  z-index: 2;
  box-shadow: 0 2px 8px rgba(0,0,0,0.25);
}

.gallery-zoom-overlay {
  position: absolute;
  bottom: 0;
  inset-x: 0;
  padding: 12px 16px;
  background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 70%, transparent 100%);
  color: var(--white);
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.82rem;
  z-index: 2;
  transition: all var(--transition-base);
  box-sizing: border-box;
}

.gallery-main:hover .gallery-zoom-overlay {
  background: linear-gradient(to top, rgba(84,26,26,0.92) 0%, rgba(84,26,26,0.5) 70%, transparent 100%);
}

/* LIGHTBOX FULLSCREEN MODAL */
.room-lightbox-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(18, 12, 10, 0.94);
  backdrop-filter: blur(12px);
  z-index: 99999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.room-lightbox-content {
  position: relative;
  max-width: 92vw;
  max-height: 90vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.lightbox-image-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 100%;
  max-height: 85vh;
}

.lightbox-img {
  max-width: 86vw;
  max-height: 76vh;
  object-fit: contain;
  border-radius: var(--radius-lg);
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.6);
  animation: zoomIn 0.3s ease;
}

.lightbox-caption {
  margin-top: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--white);
}

.lightbox-caption h4 {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
}

.lightbox-badge {
  padding: 2px 10px;
  background: var(--primary);
  color: var(--white);
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 700;
}

.lightbox-counter {
  font-size: 0.85rem;
  color: var(--secondary);
  background: rgba(255, 255, 255, 0.12);
  padding: 2px 10px;
  border-radius: var(--radius-full);
  font-weight: 600;
}

.lightbox-close-btn {
  position: absolute;
  top: -48px;
  right: 0;
  width: 42px;
  height: 42px;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 50%;
  color: var(--white);
  font-size: 1.6rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-base);
}

.lightbox-close-btn:hover {
  background: var(--primary);
  transform: scale(1.1);
}

.lightbox-nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 50px;
  height: 50px;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 50%;
  color: var(--white);
  font-size: 2.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-base);
  z-index: 10;
}

.lightbox-nav-btn:hover {
  background: var(--primary);
  transform: translateY(-50%) scale(1.1);
}

.lightbox-nav-btn.prev-btn {
  left: -64px;
}

.lightbox-nav-btn.next-btn {
  right: -64px;
}

.gallery-thumbs {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 6px;
  scrollbar-width: thin;
  min-width: 0;
  max-width: 100%;
  width: 100%;
  box-sizing: border-box;
  -webkit-overflow-scrolling: touch;
}

.thumb-btn {
  flex: 0 0 60px;
  width: 60px;
  height: 48px;
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 2px solid transparent;
  cursor: pointer;
  opacity: 0.7;
  transition: all var(--transition-base);
  padding: 0;
  background: var(--off-white);
  flex-shrink: 0;
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
  max-width: 1040px;
  margin: 0 auto 32px;
  box-shadow: var(--shadow-sm);
  box-sizing: border-box;
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

.room-number-pill.pill-disabled {
  background: var(--light);
  border-color: var(--border);
  color: var(--text-muted);
  cursor: not-allowed;
  opacity: 0.5;
  filter: grayscale(100%);
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
  max-width: 1040px;
  margin: 0 auto 32px;
  box-shadow: var(--shadow-md);
  box-sizing: border-box;
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
  max-width: 1040px;
  margin: 0 auto;
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

/* ---- TABLET (max 1024px) ---- */
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
  .room-detail-layout {
    padding: 28px;
    gap: 28px;
  }
  .estimator-container {
    padding: 28px;
  }
  .floor-plan-container {
    padding: 24px;
  }
  .spec-grid {
    grid-template-columns: 1fr 1fr;
  }
}

/* ---- MOBILE LANDSCAPE / SMALL TABLET (max 768px) ---- */
@media (max-width: 768px) {
  .main-body {
    padding-top: 78px;
    padding-bottom: 50px;
  }
  .page-header h1 {
    font-size: 1.5rem;
  }
  .page-header p {
    font-size: 0.85rem;
  }
  .building-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  .building-card {
    padding: 20px 16px;
  }
  .building-card h3 {
    font-size: 1.05rem;
  }
  .floor-node-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  .floor-plan-container {
    padding: 18px;
    border-radius: var(--radius-lg);
  }
  .floor-plan-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  .floor-plan-header h3 {
    font-size: 1.1rem;
  }
  .floor-plan-header p {
    font-size: 0.82rem;
  }
  .floor-switcher {
    width: 100%;
    justify-content: center;
  }
  .floor-btn {
    flex: 1;
    justify-content: center;
    padding: 8px 12px;
    font-size: 0.82rem;
  }
  .floor-plan-legend {
    gap: 10px;
    padding: 10px 12px;
    font-size: 0.75rem;
  }
  .floor-layout-box {
    padding: 14px;
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
    padding: 22px 18px;
  }
  .type-card h3 {
    font-size: 1.15rem;
  }
  .type-desc {
    font-size: 0.84rem;
  }
  .type-card-icon {
    width: 42px;
    height: 42px;
    font-size: 1.3rem;
    margin-bottom: 10px;
  }
  .room-detail-layout {
    padding: 20px 16px;
    gap: 24px;
    border-radius: var(--radius-lg);
  }
  .room-detail-header h2 {
    font-size: 1.25rem;
  }
  .gallery-main {
    aspect-ratio: 16 / 10;
  }
  .gallery-thumbs img {
    width: 56px;
    height: 44px;
  }
  .room-price-display {
    padding: 14px 16px;
  }
  .price-main {
    font-size: 1.4rem;
  }
  .estimator-container {
    padding: 20px 16px;
    border-radius: var(--radius-lg);
  }
  .estimator-header h3 {
    font-size: 1.2rem;
  }
  .estimator-header p {
    font-size: 0.85rem;
  }
  .estimator-body {
    gap: 24px;
  }
  .estimator-summary-panel {
    padding: 18px;
  }
  .room-number-section {
    padding: 20px 16px;
    border-radius: var(--radius-lg);
  }
  .room-number-pill {
    min-width: 100px;
    padding: 10px 14px;
  }
  .modal-content {
    width: 92vw;
    max-height: 90vh;
    padding: 24px 18px;
  }
  .lightbox-nav-btn.prev-btn {
    left: 8px;
  }
  .lightbox-nav-btn.next-btn {
    right: 8px;
  }
  .lightbox-nav-btn {
    width: 40px;
    height: 40px;
    font-size: 1.6rem;
  }
  .lightbox-close-btn {
    top: -40px;
    right: 8px;
  }
  .lightbox-caption {
    flex-direction: column;
    gap: 6px;
    text-align: center;
  }
  .lightbox-caption h4 {
    font-size: 0.95rem;
  }
  .modal-box {
    padding: 24px 18px;
    max-width: 95vw;
  }
  .modal-header h2 {
    font-size: 1.2rem;
  }
  .floating-scroll-top-btn {
    bottom: 20px;
    right: 16px;
    padding: 10px 16px;
    font-size: 0.82rem;
  }
  .floating-scroll-top-btn i {
    font-size: 1.1rem;
  }
}

/* ---- MOBILE PORTRAIT (max 480px) ---- */
@media (max-width: 480px) {
  .main-body {
    padding-top: 70px;
    padding-bottom: 40px;
  }
  .page-header {
    margin-bottom: 16px;
  }
  .page-header h1 {
    font-size: 1.3rem;
  }
  .page-header p {
    font-size: 0.8rem;
  }
  .breadcrumb {
    font-size: 0.78rem;
    gap: 6px;
  }
  .step-progress {
    gap: 2px;
    padding: 0 6px;
    margin-bottom: 16px;
  }
  .step-connector {
    margin: 0 4px 24px;
    min-width: 20px;
  }
  .step-label {
    font-size: 0.62rem;
    max-width: 64px;
    text-align: center;
    line-height: 1.25;
  }
  .step-number {
    width: 28px;
    height: 28px;
    font-size: 0.75rem;
  }
  .selection-summary {
    padding: 8px 10px;
    gap: 5px;
  }
  .summary-chip {
    font-size: 0.68rem;
    padding: 3px 6px;
    gap: 4px;
  }
  .summary-chip i {
    font-size: 0.78rem;
  }
  .summary-separator {
    display: none;
  }
  .step-title {
    margin-bottom: 18px;
    padding: 0 8px;
  }
  .step-title h2 {
    font-size: 1.12rem;
  }
  .step-title p {
    font-size: 0.8rem;
  }
  .type-selection-grid {
    gap: 16px;
  }
  .type-card {
    padding: 18px 14px 20px;
    border-radius: var(--radius-lg);
  }
  .type-card h3 {
    font-size: 1.08rem;
  }
  .type-card-icon {
    width: 38px;
    height: 38px;
    font-size: 1.2rem;
    margin-bottom: 8px;
  }
  .type-desc {
    font-size: 0.8rem;
    margin-bottom: 12px;
  }
  .type-features {
    gap: 6px;
    margin-bottom: 14px;
  }
  .type-features li {
    font-size: 0.78rem;
    gap: 6px;
  }
  .type-features i {
    font-size: 0.92rem;
  }
  .type-price {
    margin-bottom: 12px;
  }
  .price-label {
    font-size: 0.7rem;
  }
  .price-amount {
    font-size: 1.15rem;
  }
  .price-amount span {
    font-size: 0.76rem;
  }
  .type-btn {
    padding: 9px 14px;
    font-size: 0.85rem;
  }
  .type-badge-float {
    top: 12px;
    right: 12px;
    font-size: 0.68rem;
    padding: 3px 8px;
  }
  .badge-avail-pill {
    font-size: 0.68rem;
    padding: 2px 7px;
  }
  /* Step 2 */
  .type-filter-notice {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
    padding: 14px;
    margin-bottom: 20px;
  }
  .filter-notice-icon {
    width: 36px;
    height: 36px;
    min-width: 36px;
    font-size: 1.2rem;
  }
  .filter-notice-text h4 {
    font-size: 0.88rem;
  }
  .filter-notice-text p {
    font-size: 0.8rem;
  }
  .filter-change-btn {
    width: 100%;
    justify-content: center;
    padding: 8px 12px;
    font-size: 0.8rem;
  }
  .building-grid {
    gap: 12px;
    margin-bottom: 28px;
  }
  .building-card {
    padding: 16px 14px;
    border-radius: var(--radius-lg);
  }
  .building-card h3 {
    font-size: 1rem;
    margin-bottom: 4px;
  }
  .building-desc {
    font-size: 0.78rem;
    margin-bottom: 10px;
  }
  .building-fac-list {
    gap: 4px;
    margin-bottom: 14px;
  }
  .building-fac-list li {
    font-size: 0.76rem;
  }
  .building-icon {
    width: 38px;
    height: 38px;
    font-size: 1.3rem;
  }
  .building-badge {
    font-size: 0.68rem;
    padding: 2px 8px;
  }
  .badge-avail {
    font-size: 0.72rem;
    padding: 3px 8px;
  }
  .floor-plan-container {
    padding: 14px;
    border-radius: var(--radius-md);
  }
  .floor-plan-header h3 {
    font-size: 1rem;
  }
  .floor-plan-header p {
    font-size: 0.78rem;
  }
  .floor-switcher {
    gap: 4px;
  }
  .floor-btn {
    padding: 7px 10px;
    font-size: 0.78rem;
    gap: 4px;
  }
  .floor-plan-legend {
    gap: 8px;
    padding: 8px 10px;
    font-size: 0.7rem;
    flex-wrap: wrap;
  }
  .legend-pill {
    font-size: 0.66rem;
    padding: 2px 7px;
  }
  .floor-layout-box {
    padding: 10px;
    margin-bottom: 14px;
  }
  .floor-node-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }
  .floor-node-card {
    padding: 14px 10px 10px;
  }
  .node-room-type-tag {
    top: 6px;
    right: 6px;
    font-size: 0.58rem;
    padding: 1px 6px;
  }
  .node-icon {
    width: 30px;
    height: 30px;
    font-size: 1.1rem;
    margin-bottom: 4px;
  }
  .node-num {
    font-size: 0.92rem;
  }
  .node-type {
    font-size: 0.7rem;
    margin-bottom: 4px;
  }
  .node-badge {
    font-size: 0.62rem;
    padding: 2px 6px;
  }
  .node-click-hint {
    font-size: 0.62rem;
    margin-top: 4px;
  }
  /* Step 3 */
  .room-detail-layout {
    padding: 16px 12px;
    gap: 20px;
    border-radius: var(--radius-md);
    margin-bottom: 20px;
  }
  .gallery-main {
    aspect-ratio: 16 / 11;
    border-radius: var(--radius-md);
  }
  .gallery-badge {
    top: 10px;
    left: 10px;
    font-size: 0.7rem;
    padding: 3px 8px;
  }
  .gallery-zoom-overlay {
    padding: 10px 12px;
    font-size: 0.78rem;
  }
  .gallery-thumbs {
    gap: 6px;
  }
  .thumb-btn {
    flex: 0 0 52px;
    height: 44px;
  }
  .type-badge {
    font-size: 0.7rem;
    padding: 3px 10px;
  }
  .room-specs-header h2 {
    font-size: 1.2rem;
  }
  .building-name {
    font-size: 0.82rem;
    margin-bottom: 14px;
  }
  .room-price-display {
    padding: 12px 14px;
    margin-bottom: 18px;
  }
  .price-main {
    font-size: 1.3rem;
  }
  .price-main span {
    font-size: 0.78rem;
  }
  .spec-item {
    padding: 10px 12px;
    gap: 10px;
  }
  .spec-icon {
    width: 34px;
    height: 34px;
    font-size: 1.1rem;
  }
  .spec-text small {
    font-size: 0.7rem;
  }
  .spec-text strong {
    font-size: 0.82rem;
  }
  .room-number-section {
    padding: 16px 12px;
    border-radius: var(--radius-md);
    margin-bottom: 20px;
  }
  .room-number-section h3 {
    font-size: 1.05rem;
  }
  .room-number-section p {
    font-size: 0.82rem;
    margin-bottom: 14px;
  }
  .room-number-grid {
    gap: 8px;
  }
  .room-number-pill {
    min-width: 90px;
    padding: 8px 12px;
  }
  .room-number-pill i {
    font-size: 1.1rem;
  }
  .room-number-pill span {
    font-size: 0.85rem;
  }
  .room-number-pill small {
    font-size: 0.66rem;
  }
  .estimator-container {
    padding: 16px 12px;
    border-radius: var(--radius-md);
    margin-bottom: 20px;
  }
  .estimator-header {
    margin-bottom: 18px;
  }
  .estimator-tag {
    font-size: 0.72rem;
    padding: 3px 10px;
  }
  .estimator-header h3 {
    font-size: 1.1rem;
  }
  .estimator-header p {
    font-size: 0.82rem;
  }
  .estimator-body {
    gap: 20px;
  }
  .estimator-controls {
    gap: 18px;
  }
  .estimator-label {
    font-size: 0.85rem;
  }
  .range-marks {
    font-size: 0.7rem;
  }
  .checkbox-card {
    padding: 10px 12px;
    gap: 10px;
  }
  .checkbox-card input {
    width: 16px;
    height: 16px;
  }
  .checkbox-text strong {
    font-size: 0.82rem;
  }
  .checkbox-text span {
    font-size: 0.72rem;
  }
  .estimator-summary-panel {
    padding: 14px;
    gap: 10px;
  }
  .summary-badge {
    font-size: 0.7rem;
    padding: 3px 8px;
  }
  .summary-row {
    font-size: 0.82rem;
  }
  .grand-price {
    font-size: 1.15rem;
  }
  .booking-cta-group {
    margin-top: 10px;
    gap: 8px;
  }
  .btn-wa,
  .btn-secondary {
    padding: 10px;
    font-size: 0.85rem;
  }
  .step-nav-footer {
    flex-direction: column;
    gap: 10px;
  }
  .step-nav-footer .btn {
    width: 100%;
    justify-content: center;
  }
  .modal-box {
    padding: 20px 14px;
    max-width: 96vw;
    border-radius: var(--radius-lg);
  }
  .modal-header h2 {
    font-size: 1.1rem;
  }
  .modal-header p {
    font-size: 0.82rem;
  }
  .form-group label {
    font-size: 0.8rem;
  }
  .form-group input,
  .form-group textarea {
    font-size: 0.85rem;
    padding: 9px 12px;
  }
  .form-summary {
    font-size: 0.82rem;
    padding: 10px 12px;
  }
  .form-summary strong {
    font-size: 1rem;
  }
  .modal-content {
    width: 96vw;
    padding: 20px 14px;
    border-radius: var(--radius-lg);
  }
  .lightbox-img {
    max-width: 94vw;
    max-height: 70vh;
    border-radius: var(--radius-md);
  }
  .lightbox-nav-btn {
    width: 36px;
    height: 36px;
    font-size: 1.4rem;
  }
  .lightbox-nav-btn.prev-btn {
    left: 4px;
  }
  .lightbox-nav-btn.next-btn {
    right: 4px;
  }
  .lightbox-close-btn {
    top: -36px;
    right: 4px;
    width: 34px;
    height: 34px;
    font-size: 1.3rem;
  }
  .lightbox-caption h4 {
    font-size: 0.85rem;
  }
  .lightbox-badge {
    font-size: 0.68rem;
  }
  .lightbox-counter {
    font-size: 0.75rem;
  }
  .room-lightbox-backdrop {
    padding: 12px;
  }
  .floating-scroll-top-btn {
    bottom: 16px;
    right: 12px;
    padding: 9px 14px;
    font-size: 0.78rem;
    gap: 6px;
  }
  .floating-scroll-top-btn i {
    font-size: 1rem;
  }
  .floating-scroll-top-btn span {
    font-size: 0.76rem;
  }
}

/* FLOATING BUTTON (STEP 2: BACK TO BUILDING SELECTOR) */
.floating-scroll-top-btn {
  position: fixed;
  bottom: 28px;
  right: 28px;
  z-index: 99;
  background: var(--primary);
  color: var(--white);
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 11px 20px;
  border-radius: var(--radius-full);
  font-size: 0.88rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 8px 24px rgba(84, 26, 26, 0.35);
  cursor: pointer;
  transition: all var(--transition-smooth);
}

.floating-scroll-top-btn:hover {
  background: var(--primary-light);
  transform: translateY(-3px) scale(1.03);
  box-shadow: 0 12px 30px rgba(84, 26, 26, 0.45);
}

.floating-scroll-top-btn i {
  font-size: 1.25rem;
  animation: bounceUp 1.5s infinite;
}

@keyframes bounceUp {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.9);
}
</style>
