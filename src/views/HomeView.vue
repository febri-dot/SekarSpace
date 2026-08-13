<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import Navbar from '../components/layout/Navbar.vue'
import Footer from '../components/layout/Footer.vue'
import { RouterLink } from 'vue-router'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// Interactive State
const activeFaq = ref<number | null>(0)
const selectedCategory = ref('all')
const activeLightboxItem = ref<any | null>(null)
const selectedFacilityModal = ref<any | null>(null)
const scrollProgress = ref(0)
const showBackToTop = ref(false)
const roomPricingPeriod = ref<'monthly' | 'quarterly' | 'yearly'>('monthly')

// Hero Background Slideshow State
const activeHeroSlide = ref(0)
let heroTimer: any = null

const heroSlides = [
  {
    id: 1,
    image: '/assets/images/hero-bg.png',
    tag: 'Kost Muslimah Terpercaya',
    titleMain: 'Temukan Hunian',
    titleGradient: 'Nyaman & Aman',
    desc: 'Sekar Space menyediakan kost muslimah dengan fasilitas lengkap, lingkungan yang kondusif, dan harga terjangkau untuk kenyamanan Anda.'
  },
  {
    id: 2,
    image: '/assets/images/room-deluxe.png',
    tag: 'Kamar Mandi Dalam Premium',
    titleMain: 'Privasi & Ketenangan',
    titleGradient: 'Maksimal Setiap Hari',
    desc: 'Nikmati interior kamar eksklusif dengan cermin, lemari pakaian, kasur empuk, serta sirkulasi udara dan cahaya alami yang sehat.'
  },
  {
    id: 3,
    image: '/assets/images/gallery-livingroom.png',
    tag: 'Ruang Tamu & Bersantai',
    titleMain: 'Suasana Hangat',
    titleGradient: '& Penuh Kekeluargaan',
    desc: 'Fasilitas area santai untuk menerima kunjungan keluarga atau teman wanita dengan suasana rapi, sopan, dan terawat.'
  },
  {
    id: 4,
    image: '/assets/images/gallery-kitchen.png',
    tag: 'Dapur Bersama Lengkap',
    titleMain: 'Memasak Lebih Praktis',
    titleGradient: '& Selalu Bersih',
    desc: 'Dilengkapi kompor gas, kulkas bersama, kabinet penyimpanan, serta dispenser air minum untuk menunjang harian Anda.'
  }
]

const currentHeroSlide = computed<{
  id: number
  image: string
  tag: string
  titleMain: string
  titleGradient: string
  desc: string
}>(() => heroSlides[activeHeroSlide.value] ?? heroSlides[0]!)

const nextHeroSlide = () => {
  activeHeroSlide.value = (activeHeroSlide.value + 1) % heroSlides.length
}

const prevHeroSlide = () => {
  activeHeroSlide.value = (activeHeroSlide.value - 1 + heroSlides.length) % heroSlides.length
}

const setHeroSlide = (index: number) => {
  activeHeroSlide.value = index
  resetHeroTimer()
}

const startHeroTimer = () => {
  heroTimer = setInterval(() => {
    nextHeroSlide()
  }, 4500)
}

const resetHeroTimer = () => {
  if (heroTimer) clearInterval(heroTimer)
  startHeroTimer()
}

// 1. CALCULATOR & ESTIMATOR STATE
const calcRoomType = ref<'km-luar' | 'km-dalam'>('km-luar')
const calcDuration = ref<number>(1) // months
const calcAddonParking = ref<boolean>(false)
const calcAddonLaundry = ref<boolean>(false)

const calcBasePrice = computed(() => {
  const isKmDalam = calcRoomType.value === 'km-dalam'
  if (calcDuration.value >= 12) {
    return isKmDalam ? 880000 : 650000
  } else if (calcDuration.value >= 3) {
    return isKmDalam ? 910000 : 675000
  }
  return isKmDalam ? 950000 : 700000
})

const calcTotalPerMonth = computed(() => {
  let total = calcBasePrice.value
  if (calcAddonParking.value) total += 50000
  if (calcAddonLaundry.value) total += 75000
  return total
})

const calcGrandTotal = computed(() => {
  return calcTotalPerMonth.value * calcDuration.value
})

const calcWaMessage = computed(() => {
  const roomName = calcRoomType.value === 'km-dalam' ? 'Kamar Mandi Dalam (Premium)' : 'Kamar Mandi Luar (Standard)'
  const addons = []
  if (calcAddonParking.value) addons.push('Parkir Motor/Sepeda Dedicated (+Rp 50rb)')
  if (calcAddonLaundry.value) addons.push('Jasa Laundry Berlangganan (+Rp 75rb)')
  const addonStr = addons.length > 0 ? addons.join(', ') : 'Tanpa Tambahan'
  
  const text = `Halo Admin Sekar Space, saya ingin memesan kamar dengan rincian berikut:
- Tipe Kamar: ${roomName}
- Durasi Sewa: ${calcDuration.value} Bulan
- Layanan Tambahan: ${addonStr}
- Estimasi Total: Rp ${calcGrandTotal.value.toLocaleString('id-ID')}

Apakah kamar ini masih tersedia? Terima kasih.`
  return encodeURIComponent(text)
})

// 2. ACCESSIBILITY / NEARBY PLACES STATE
const activePlaceCategory = ref('all')

const placeCategories = [
  { id: 'all', label: 'Semua Tempat' },
  { id: 'campus', label: 'Kampus & Pendidikan' },
  { id: 'shopping', label: 'Perbelanjaan & Publik' },
  { id: 'health', label: 'Fasilitas Kesehatan' },
  { id: 'worship', label: 'Tempat Ibadah' }
]

const nearbyPlaces = [
  {
    id: 1,
    name: 'Universitas Gadjah Mada (UGM)',
    category: 'campus',
    distance: '2.5 km',
    time: '5–7 menit (motor)',
    icon: 'bx bxs-school',
    badge: 'Kampus Utama',
    desc: 'Akses cepat melalui Jl. Monjali / Jl. Ringroad Utara tanpa macet.'
  },
  {
    id: 2,
    name: 'Universitas Negeri Yogyakarta (UNY)',
    category: 'campus',
    distance: '3.8 km',
    time: '10 menit (motor)',
    icon: 'bx bxs-graduation',
    badge: 'Kampus',
    desc: 'Rute mudah & nyaman menuju area Colombo dan Gejayan.'
  },
  {
    id: 3,
    name: 'Sleman City Hall (SCH)',
    category: 'shopping',
    distance: '3.0 km',
    time: '7 menit (motor)',
    icon: 'bx bxs-shopping-bag',
    badge: 'Pusat Perbelanjaan',
    desc: 'Mall terbesar di Sleman dengan bioskop, supermarket, dan culinary hub.'
  },
  {
    id: 4,
    name: 'RSUP Dr. Sardjito',
    category: 'health',
    distance: '2.8 km',
    time: '7 menit (motor)',
    icon: 'bx bxs-first-aid',
    badge: 'Rumah Sakit Rujukan',
    desc: 'Fasilitas medis terdekat untuk kebutuhan kesehatan darurat maupun medis umum.'
  },
  {
    id: 5,
    name: 'Indomaret / Alfamart Trini',
    category: 'shopping',
    distance: '300 meter',
    time: '3 menit (jalan kaki)',
    icon: 'bx bxs-store-alt',
    badge: 'Minimarket 24h',
    desc: 'Sangat dekat untuk membeli kebutuhan harian, cemilan, dan saldo e-money.'
  },
  {
    id: 6,
    name: 'Masjid Al-Ikhlas Trini',
    category: 'worship',
    distance: '150 meter',
    time: '2 menit (jalan kaki)',
    icon: 'bx bxs-institution',
    badge: 'Tempat Ibadah',
    desc: 'Masjid warga yang bersih dan aktif dengan jamaah muslimah sekitar.'
  }
]

const filteredPlaces = computed(() => {
  if (activePlaceCategory.value === 'all') return nearbyPlaces
  return nearbyPlaces.filter(p => p.category === activePlaceCategory.value)
})

// 3. TESTIMONIAL CAROUSEL STATE
const activeTestimonial = ref(0)

const testimonials = [
  {
    id: 1,
    name: 'Anisa Rahmawati',
    role: 'Mahasiswi UGM - Fak. Hukum',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    rating: 5,
    tag: 'Penyewa 2 Tahun',
    comment: 'Tinggal di Sekar Space bikin fokus belajar banget. Lingkungannya tenang khusus muslimah, akses kunci aman, dan kamarnya bersih banget pas pertama masuk. Pokoknya recommended!'
  },
  {
    id: 2,
    name: 'Siti Nurhaliza',
    role: 'Alumni UNY - Software Engineer',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    rating: 5,
    tag: 'Penyewa 1.5 Tahun',
    comment: 'Fasilitas dapur bersama dan WiFi-nya kenceng banget! Sangat membantu aku yang sering kerja WFH / remote job. Pengelolanya juga ramah dan responnya cepat kalau ada kendala.'
  },
  {
    id: 3,
    name: 'Dwi Kartika Sari',
    role: 'Karyawan Swasta Sleman',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    rating: 5,
    tag: 'Penyewa 1 Tahun',
    comment: 'Suka banget sama lokasinya yang dekat UGM dan RS Sardjito. Parkirannya aman terlindung hujan dan ada CCTV 24 jam. Biaya sewanya juga sangat worth it!'
  }
]

const currentTestimonial = computed<{
  id: number
  name: string
  role: string
  avatar: string
  rating: number
  tag: string
  comment: string
}>(() => testimonials[activeTestimonial.value] ?? testimonials[0]!)

const nextTestimonial = () => {
  activeTestimonial.value = (activeTestimonial.value + 1) % testimonials.length
}

const prevTestimonial = () => {
  activeTestimonial.value = (activeTestimonial.value - 1 + testimonials.length) % testimonials.length
}

const facilities = [
  { 
    icon: 'bx bx-wifi', 
    title: 'WiFi Cepat', 
    desc: 'Internet berkecepatan tinggi tersedia 24 jam untuk kebutuhan belajar dan bekerja.',
    details: 'Masing-masing lantai dilengkapi router dedicated dengan kecepatan hingga 100Mbps. Sangat stabil untuk video call, streaming, hingga tugas kuliah.'
  },
  { 
    icon: 'bx bx-shield-quarter', 
    title: 'Keamanan 24 Jam', 
    desc: 'Sistem keamanan terpadu dengan CCTV dan akses terbatas untuk kenyamanan Anda.',
    details: 'Dilengkapi CCTV 24 jam di sudut strategis, pagar gerbang dengan akses kunci khusus, serta lingkungan yang kondusif & terpantau pengelola.'
  },
  { 
    icon: 'bx bxs-car-garage', 
    title: 'Parkir Luas', 
    desc: 'Area parkir yang memadai untuk motor dan sepeda, aman dan terlindung.',
    details: 'Area parkir dalam ruangan (cover indoor) terlindung dari hujan dan panas matahari, dilengkapi sistem penataan tempat parkir pribadi.'
  },
  { 
    icon: 'bx bx-fridge', 
    title: 'Dapur Bersama', 
    desc: 'Dapur lengkap dengan peralatan memasak yang bisa digunakan bersama.',
    details: 'Tersedia kompor gas, kulkas bersama, dispenser air minum gratis, microwave, dan perlengkapan memasak lengkap yang selalu dibersihkan rutin.'
  },
  { 
    icon: 'bx bxs-tv', 
    title: 'TV Bersama', 
    desc: 'Tersedia fasilitas televisi sebagai sarana hiburan untuk bersantai dan menikmati waktu bersama.',
    details: 'Ruang santai dengan TV layar datar, meja sofa empuk, dan koneksi Smart TV untuk menonton tayangan favorit saat melepas penat.'
  },
  { 
    icon: 'bx bxs-group', 
    title: 'Ruang Tamu', 
    desc: 'Tersedia ruang tamu yang nyaman untuk menerima tamu, bersantai, dan berkumpul bersama.',
    details: 'Area khusus untuk menerima kunjungan keluarga atau teman wanita dengan suasana yang sopan, rapi, dan menjaga privasi area kamar.'
  }
]

// 4. FLOOR PLAN STATE
const activeFloor = ref<'floor1' | 'floor2'>('floor1')

const floor1Rooms = [
  { id: '101', type: 'Kamar Mandi Dalam', status: 'Terisi', icon: 'bx bx-bed' },
  { id: '102', type: 'Kamar Mandi Luar', status: 'Tersedia', icon: 'bx bx-door-open' },
  { id: '103', type: 'Kamar Mandi Dalam', status: 'Terisi', icon: 'bx bx-bath' },
  { id: '104', type: 'Ruang Tamu Utama', status: 'Fasilitas Umum', icon: 'bx bxs-group' },
  { id: '105', type: 'Dapur Bersama', status: 'Fasilitas Umum', icon: 'bx bx-fridge' }
]

const floor2Rooms = [
  { id: '201', type: 'Kamar Mandi Dalam', status: 'Tersedia', icon: 'bx bxs-star' },
  { id: '202', type: 'Kamar Mandi Luar', status: 'Tersedia', icon: 'bx bx-bed' },
  { id: '203', type: 'Kamar Mandi Luar', status: 'Terisi', icon: 'bx bx-door-open' },
  { id: '204', type: 'Balkon & Area Santai', status: 'Fasilitas Umum', icon: 'bx bxs-sun' },
  { id: '205', type: 'Area Jemuran', status: 'Fasilitas Umum', icon: 'bx bx-closet' }
]

const toggleFaq = (index: number) => {
  if (activeFaq.value === index) {
    activeFaq.value = null
  } else {
    activeFaq.value = index
  }
}

const openLightbox = (item: any) => {
  activeLightboxItem.value = item
  document.body.style.overflow = 'hidden'
}

const closeLightbox = () => {
  activeLightboxItem.value = null
  document.body.style.overflow = ''
}

const openFacilityModal = (fac: any) => {
  selectedFacilityModal.value = fac
  document.body.style.overflow = 'hidden'
}

const closeFacilityModal = () => {
  selectedFacilityModal.value = null
  document.body.style.overflow = ''
}

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// Data Collections
const galleryCategories = [
  { id: 'all', label: 'Semuanya' },
  { id: 'rooms', label: 'Kamar' },
  { id: 'facilities', label: 'Fasilitas' },
  { id: 'environment', label: 'Suasana' }
]

const galleryRow1All = [
  {
    id: 101,
    title: 'Ruang Tamu & Bersantai',
    category: 'facilities',
    categoryLabel: 'Fasilitas Umum',
    image: '/assets/images/gallery-livingroom.png',
    sizeClass: 'card-wide',
    desc: 'Ruang tamu hangat dan nyaman untuk berkumpul, bersantai, atau menerima kunjungan keluarga.'
  },
  {
    id: 102,
    title: 'Kamar Mandi Luar',
    category: 'rooms',
    categoryLabel: 'Kamar Standard',
    image: '/assets/images/room-single.png',
    sizeClass: 'card-standard',
    desc: 'Kamar nyaman dan bersih dengan sirkulasi udara yang baik, kasur empuk, lemari, cermin, dan meja belajar.'
  },
  {
    id: 103,
    title: 'Dapur Bersama Bersih',
    category: 'facilities',
    categoryLabel: 'Fasilitas Umum',
    image: '/assets/images/gallery-kitchen.png',
    sizeClass: 'card-tall',
    desc: 'Dapur lengkap dengan kompor, kulkas bersama, dan kabinet penyimpanan yang rapi dan selalu terawat.'
  },
  {
    id: 104,
    title: 'Kamar Mandi Dalam',
    category: 'rooms',
    categoryLabel: 'Kamar Premium',
    image: '/assets/images/room-deluxe.png',
    sizeClass: 'card-standard',
    desc: 'Kamar mandi dalam eksklusif dengan pencahayaan alami, cermin, dan interior modern minimalis yang bersih.'
  },
  {
    id: 105,
    title: 'Tampak Depan & Halaman',
    category: 'environment',
    categoryLabel: 'Suasana Kost',
    image: '/assets/images/hero-bg.png',
    sizeClass: 'card-large',
    desc: 'Lingkungan kost yang asri, tenang, dan aman khusus muslimah dengan pagar pengaman terpadu.'
  },
  {
    id: 106,
    title: 'Kamar Double / Shared',
    category: 'rooms',
    categoryLabel: 'Kamar Kapasitas 2',
    image: '/assets/images/room-double.png',
    sizeClass: 'card-standard',
    desc: 'Kamar luas untuk berdua dengan kasur berkualitas, lemari ganda, dan suasana belajar yang kondusif.'
  }
]

const galleryRow2All = [
  {
    id: 201,
    title: 'Kamar Mandi Dalam',
    category: 'rooms',
    categoryLabel: 'Kamar Premium',
    image: '/assets/images/room-deluxe.png',
    sizeClass: 'card-standard',
    desc: 'Kamar mandi dalam eksklusif dengan pencahayaan alami, cermin, dan interior modern minimalis yang bersih.'
  },
  {
    id: 202,
    title: 'Dapur Bersama Bersih',
    category: 'facilities',
    categoryLabel: 'Fasilitas Umum',
    image: '/assets/images/gallery-kitchen.png',
    sizeClass: 'card-large',
    desc: 'Dapur lengkap dengan kompor, kulkas bersama, dan kabinet penyimpanan yang rapi dan selalu terawat.'
  },
  {
    id: 203,
    title: 'Kamar Double / Shared',
    category: 'rooms',
    categoryLabel: 'Kamar Kapasitas 2',
    image: '/assets/images/room-double.png',
    sizeClass: 'card-tall',
    desc: 'Kamar luas untuk berdua dengan kasur berkualitas, lemari ganda, dan suasana belajar yang kondusif.'
  },
  {
    id: 204,
    title: 'Ruang Tamu & Santai',
    category: 'facilities',
    categoryLabel: 'Fasilitas Umum',
    image: '/assets/images/gallery-livingroom.png',
    sizeClass: 'card-wide',
    desc: 'Ruang tamu hangat dan nyaman untuk berkumpul, bersantai, atau menerima kunjungan keluarga.'
  },
  {
    id: 205,
    title: 'Kamar Mandi Luar',
    category: 'rooms',
    categoryLabel: 'Kamar Standard',
    image: '/assets/images/room-single.png',
    sizeClass: 'card-standard',
    desc: 'Kamar nyaman dan bersih dengan sirkulasi udara yang baik, kasur empuk, lemari, cermin, dan meja belajar.'
  },
  {
    id: 206,
    title: 'Tampak Depan & Halaman',
    category: 'environment',
    categoryLabel: 'Suasana Kost',
    image: '/assets/images/hero-bg.png',
    sizeClass: 'card-large',
    desc: 'Lingkungan kost yang asri, tenang, dan aman khusus muslimah dengan pagar pengaman terpadu.'
  }
]

const filteredRow1 = computed(() => {
  if (selectedCategory.value === 'all') return galleryRow1All
  return galleryRow1All.filter(item => item.category === selectedCategory.value)
})

const filteredRow2 = computed(() => {
  if (selectedCategory.value === 'all') return galleryRow2All
  return galleryRow2All.filter(item => item.category === selectedCategory.value)
})

const selectGalleryCategory = (catId: string) => {
  selectedCategory.value = catId
}

const faqs = [
  {
    number: '01',
    question: 'Apa saja peraturan utama di Kost Muslimah Sekar Wangi?',
    isList: true,
    list: [
      { label: 'Identitas:', text: 'Penyewa wajib seorang muslimah.' },
      { label: 'Jam Malam:', text: 'Aktivitas yang menimbulkan keramaian atau mengganggu waktu istirahat diperbolehkan hingga pukul 22.00. Setelah waktu tersebut, pintu kost akan dikunci demi keamanan dan kenyamanan bersama.' },
      { label: 'Tamu:', text: 'Tidak diperkenankan membawa lawan jenis ke dalam kamar; tamu lawan jenis hanya diperbolehkan di area ruang tamu.' },
      { label: 'Menginap:', text: 'Tamu (sesama wanita) yang menginap lebih dari 2 hari akan dikenakan biaya tambahan Rp 50.000/hari.' },
      { label: 'Kebersihan:', text: 'Wajib menjaga kebersihan fasilitas umum seperti dapur dan kamar mandi bersama.' },
      { label: 'Hewan Peliharaan:', text: 'Dilarang membawa hewan peliharaan jenis apapun.' },
      { label: 'Perizinan:', text: 'Wajib melapor kepada pengelola kost jika meninggalkan kost untuk pulang kampung atau pergi dalam waktu lama.' },
      { label: 'Ketertiban:', text: 'Dilarang keras merokok dan mengonsumsi minuman keras di seluruh area kost, termasuk di dalam kamar.' }
    ]
  },
  {
    number: '02',
    question: 'Apakah biaya sewa sudah termasuk Wi-Fi dan air?',
    isList: false,
    text: 'Ya, biaya sewa bulanan sudah mencakup penggunaan air bersih dan Wi-Fi untuk kebutuhan sehari-hari. Biaya listrik belum termasuk dalam biaya sewa dan akan dibayarkan secara terpisah sesuai pemakaian.'
  },
  {
    number: '03',
    question: 'Bagaimana sistem pembayaran sewa kamar kost?',
    isList: false,
    text: 'Pembayaran sewa dapat dilakukan secara bulanan, per 3 bulan, atau tahunan melalui transfer bank ke rekening pengelola. Pembayaran wajib diselesaikan paling lambat pada tanggal jatuh tempo setiap bulannya sesuai kesepakatan awal.'
  },
  {
    number: '04',
    question: 'Apakah ada jam malam untuk tamu yang berkunjung?',
    isList: false,
    text: 'Tamu hanya diperbolehkan berkunjung di area ruang tamu luar hingga pukul 21.00 WIB. Demi kenyamanan dan privasi penghuni lain, tamu (termasuk keluarga perempuan) tidak diizinkan memasuki area kamar tanpa izin khusus.'
  },
  {
    number: '05',
    question: 'Bagaimana dengan fasilitas dapur dan laundry?',
    isList: false,
    text: 'Kami menyediakan dapur bersama yang lengkap dengan kompor, kulkas, dan peralatan dasar. Penghuni wajib membersihkan perlengkapan setelah dipakai. Untuk laundry, tersedia mesin cuci yang bisa digunakan bersama atau Anda dapat menggunakan jasa laundry berlangganan di sekitar area kost.'
  }
]

// Dynamic Pricing Calculator
const getPriceKmLuar = computed(() => {
  if (roomPricingPeriod.value === 'quarterly') return 'Rp 675.000'
  if (roomPricingPeriod.value === 'yearly') return 'Rp 650.000'
  return 'Rp 700.000'
})

const getPriceKmDalam = computed(() => {
  if (roomPricingPeriod.value === 'quarterly') return 'Rp 910.000'
  if (roomPricingPeriod.value === 'yearly') return 'Rp 880.000'
  return 'Rp 950.000'
})

// Scroll Progress
const handleWindowScroll = () => {
  const winScroll = document.documentElement.scrollTop || document.body.scrollTop
  const height = document.documentElement.scrollHeight - document.documentElement.clientHeight
  scrollProgress.value = (winScroll / height) * 100
  showBackToTop.value = winScroll > 400
}

let gsapCtx: gsap.Context | null = null

const initGsapAnimations = () => {
  gsapCtx = gsap.context(() => {
    // 1. HERO ANIMATIONS
    gsap.fromTo('.hero-badge', 
      { scale: 0, opacity: 0 },
      { scale: 1, opacity: 1, duration: 1, ease: 'back.out(1.8)', clearProps: 'all' }
    )

    gsap.fromTo('#heroHeading', 
      { y: 50, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, delay: 0.15, ease: 'power3.out', clearProps: 'all' }
    )

    gsap.fromTo('.hero-desc', 
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, delay: 0.3, ease: 'power2.out', clearProps: 'all' }
    )

    gsap.fromTo('.hero-actions .btn', 
      { y: 30, scale: 0.9, opacity: 0 },
      { y: 0, scale: 1, opacity: 1, stagger: 0.15, duration: 0.8, delay: 0.45, ease: 'back.out(1.5)', clearProps: 'all' }
    )

    gsap.fromTo('.hero-stats', 
      { y: 40, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.9, delay: 0.6, ease: 'power3.out', clearProps: 'all' }
    )

    // 2. FACILITIES SECTION
    gsap.fromTo('#facilities .section-header', 
      { y: 40, opacity: 0 },
      { 
        y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', clearProps: 'all',
        scrollTrigger: { trigger: '#facilities', start: 'top 85%', once: true }
      }
    )

    gsap.fromTo('.facility-card', 
      { y: 50, opacity: 0 },
      { 
        y: 0, opacity: 1, stagger: 0.08, duration: 0.8, ease: 'power3.out', clearProps: 'all',
        scrollTrigger: { trigger: '.facilities-grid', start: 'top 90%', once: true }
      }
    )

    // 3. ROOMS SECTION
    gsap.fromTo('#rooms .section-header', 
      { y: 40, opacity: 0 },
      { 
        y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', clearProps: 'all',
        scrollTrigger: { trigger: '#rooms', start: 'top 85%', once: true }
      }
    )

    gsap.fromTo('#roomKmLuar', 
      { x: -60, opacity: 0 },
      { 
        x: 0, opacity: 1, duration: 0.9, ease: 'power3.out', clearProps: 'all',
        scrollTrigger: { trigger: '.room-comparison', start: 'top 85%', once: true }
      }
    )

    gsap.fromTo('#roomKmDalam', 
      { x: 60, opacity: 0 },
      { 
        x: 0, opacity: 1, duration: 0.9, ease: 'power3.out', clearProps: 'all',
        scrollTrigger: { trigger: '.room-comparison', start: 'top 85%', once: true }
      }
    )

    // 4. ACCESSIBILITY SECTION
    gsap.fromTo('.place-card', 
      { y: 40, opacity: 0 },
      { 
        y: 0, opacity: 1, stagger: 0.08, duration: 0.8, ease: 'power3.out', clearProps: 'all',
        scrollTrigger: { trigger: '.accessibility-grid', start: 'top 90%', once: true }
      }
    )

    // 5. TESTIMONIALS SECTION
    gsap.fromTo('.testimonial-card', 
      { scale: 0.9, opacity: 0 },
      { 
        scale: 1, opacity: 1, duration: 0.8, ease: 'back.out(1.4)', clearProps: 'all',
        scrollTrigger: { trigger: '#testimonials', start: 'top 85%', once: true }
      }
    )

    // 8. FAQ SECTION
    gsap.fromTo('.faq-intro', 
      { x: -40, opacity: 0 },
      { 
        x: 0, opacity: 1, duration: 0.9, ease: 'power3.out', clearProps: 'all',
        scrollTrigger: { trigger: '#faq', start: 'top 85%', once: true }
      }
    )

    gsap.fromTo('.faq-item', 
      { x: 40, opacity: 0 },
      { 
        x: 0, opacity: 1, stagger: 0.08, duration: 0.8, ease: 'power3.out', clearProps: 'all',
        scrollTrigger: { trigger: '.faq-container', start: 'top 90%', once: true }
      }
    )

    // 9. GALLERY SECTION
    gsap.fromTo('.gallery-double-row-wrapper', 
      { y: 45, opacity: 0 },
      { 
        y: 0, opacity: 1, duration: 0.9, ease: 'power3.out', clearProps: 'all',
        scrollTrigger: { trigger: '#gallery', start: 'top 85%', once: true }
      }
    )

    // 10. CONTACT SECTION
    gsap.fromTo('.contact-item', 
      { x: -40, opacity: 0 },
      { 
        x: 0, opacity: 1, stagger: 0.08, duration: 0.8, ease: 'power3.out', clearProps: 'all',
        scrollTrigger: { trigger: '.contact-grid', start: 'top 85%', once: true }
      }
    )

    gsap.fromTo('#contactMap', 
      { scale: 0.92, opacity: 0 },
      { 
        scale: 1, opacity: 1, duration: 0.9, ease: 'power3.out', clearProps: 'all',
        scrollTrigger: { trigger: '.contact-grid', start: 'top 85%', once: true }
      }
    )
  })

  setTimeout(() => {
    ScrollTrigger.refresh()
  }, 200)
}

onMounted(() => {
  window.addEventListener('scroll', handleWindowScroll)
  startHeroTimer()
  nextTick(() => {
    initGsapAnimations()
  })
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleWindowScroll)
  if (heroTimer) clearInterval(heroTimer)
  if (gsapCtx) {
    gsapCtx.revert()
  }
})
</script>

<template>
  <div class="home-page">
    <!-- Top Scroll Progress Bar -->
    <div class="scroll-progress-bar" :style="{ width: `${scrollProgress}%` }"></div>

    <Navbar />

    <main class="main-body">
      <!-- HERO SECTION WITH AUTO BACKGROUND SLIDESHOW -->
      <section id="hero" class="hero" aria-labelledby="heroHeading">
        <!-- Background Slideshow Layers -->
        <div class="hero-bg-slider">
          <div 
            v-for="(slide, index) in heroSlides" 
            :key="slide.id"
            class="hero-bg-slide"
            :class="{ active: activeHeroSlide === index }"
            :style="{ backgroundImage: `url(${slide.image})` }"
          ></div>
        </div>

        <div class="hero-overlay"></div>

        <!-- Hero Prev/Next Arrows -->
        <button class="hero-arrow hero-arrow-left" @click="prevHeroSlide(); resetHeroTimer()" aria-label="Slide sebelumnya">
          <i class='bx bx-chevron-left'></i>
        </button>
        <button class="hero-arrow hero-arrow-right" @click="nextHeroSlide(); resetHeroTimer()" aria-label="Slide berikutnya">
          <i class='bx bx-chevron-right'></i>
        </button>

        <div class="hero-content">
          <span class="hero-badge">
            <i class='bx bxs-star'></i>
            {{ currentHeroSlide.tag }}
          </span>
          <h1 id="heroHeading">
            {{ currentHeroSlide.titleMain }}<br>
            <span class="text-gradient">{{ currentHeroSlide.titleGradient }}</span>
          </h1>
          <p class="hero-desc">
            {{ currentHeroSlide.desc }}
          </p>
          <div class="hero-actions">
            <RouterLink to="/rooms" class="btn btn-primary" id="btnExploreRooms">
              <i class='bx bx-search-alt'></i>
              Lihat Kamar
            </RouterLink>
            <a href="https://wa.me/62895378020456" class="btn btn-ghost" id="btnWhatsapp" target="_blank" rel="noopener">
              <i class='bx bxl-whatsapp'></i>
              Hubungi Kami
            </a>
          </div>
          <div class="hero-stats">
            <div class="stat-item">
              <strong class="stat-number">50+</strong>
              <span>Penyewa Puas</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <strong class="stat-number">15+</strong>
              <span>Kamar Tersedia</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <strong class="stat-number">4.8</strong>
              <span>Rating Kualitas</span>
            </div>
          </div>

          <!-- Hero Slide Dots -->
          <div class="hero-slide-dots">
            <button 
              v-for="(slide, index) in heroSlides" 
              :key="slide.id"
              class="dot-btn"
              :class="{ active: activeHeroSlide === index }"
              @click="setHeroSlide(index)"
              :aria-label="`Ke slide ${index + 1}`"
            >
              <span class="dot-num">0{{ index + 1 }}</span>
              <span class="dot-bar"></span>
            </button>
          </div>
        </div>
      </section>

      <!-- FACILITIES SECTION -->
      <section id="facilities" class="section facilities" aria-labelledby="facilitiesHeading">
        <div class="container">
          <header class="section-header">
            <span class="section-tag">Keunggulan Kami</span>
            <h2 id="facilitiesHeading">Fasilitas <span class="text-gradient">Lengkap</span></h2>
            <p>Kami menyediakan berbagai fasilitas untuk menunjang kenyamanan dan keamanan Anda selama tinggal. Klik kartu untuk detail lengkap.</p>
          </header>
          
          <div class="facilities-grid">
            <article 
              v-for="(fac, index) in facilities" 
              :key="index" 
              class="facility-card"
              @click="openFacilityModal(fac)"
            >
              <div class="facility-icon">
                <i :class="fac.icon"></i>
              </div>
              <h3>{{ fac.title }}</h3>
              <p>{{ fac.desc }}</p>
              <div class="facility-more-hint">
                <span>Detail Fasilitas</span>
                <i class='bx bx-chevron-right'></i>
              </div>
            </article>
          </div>
        </div>
      </section>

      <!-- ROOMS PREVIEW SECTION WITH DYNAMIC PRICING TOGGLE -->
      <section id="rooms" class="section rooms" aria-labelledby="roomsHeading">
        <div class="container">
          <header class="section-header">
            <span class="section-tag">Pilihan Kamar</span>
            <h2 id="roomsHeading">Pilih Tipe <span class="text-gradient">Kamar</span></h2>
            <p>Kami menyediakan dua pilihan tipe kamar yang bisa disesuaikan dengan kebutuhan dan kenyamanan Anda.</p>
            
            <!-- Interactive Period Switcher -->
            <div class="pricing-period-selector">
              <button 
                class="period-btn" 
                :class="{ active: roomPricingPeriod === 'monthly' }"
                @click="roomPricingPeriod = 'monthly'"
              >
                Bulanan
              </button>
              <button 
                class="period-btn" 
                :class="{ active: roomPricingPeriod === 'quarterly' }"
                @click="roomPricingPeriod = 'quarterly'"
              >
                3 Bulan <span class="discount-badge">Diskon 5%</span>
              </button>
              <button 
                class="period-btn" 
                :class="{ active: roomPricingPeriod === 'yearly' }"
                @click="roomPricingPeriod = 'yearly'"
              >
                Tahunan <span class="discount-badge badge-best">Hemat S/d 1 Juta!</span>
              </button>
            </div>
          </header>

          <div class="room-comparison">
            <!-- Kamar Mandi Luar -->
            <RouterLink to="/rooms?tipe=km-luar" class="room-type-card" id="roomKmLuar">
              <div class="room-type-image-wrapper">
                <img src="/assets/images/room-single.png" alt="Tipe Kamar Mandi Luar Sekar Space" class="room-type-img">
                <div class="room-type-img-overlay"></div>
                <div class="room-type-icon-badge">
                  <i class='bx bx-door-open'></i>
                </div>
              </div>
              <div class="room-type-content">
                <span class="room-type-tag">Terjangkau</span>
                <h3>Kamar Mandi Luar</h3>
                <p class="room-type-desc">Kamar nyaman dengan akses kamar mandi bersama yang selalu bersih dan terawat.</p>
                <ul class="room-type-features">
                  <li><i class='bx bx-check-circle'></i> Ukuran 3 × 3 meter</li>
                  <li><i class='bx bx-check-circle'></i> Kasur & Lemari</li>
                  <li><i class='bx bx-check-circle'></i> Cermin</li>
                  <li><i class='bx bx-check-circle'></i> WiFi 24 Jam</li>
                </ul>
                <div class="room-type-price">
                  <span class="price-from">
                    {{ roomPricingPeriod === 'monthly' ? 'Mulai dari' : roomPricingPeriod === 'quarterly' ? 'Harga Per Bulan (Sewa 3 Bln)' : 'Harga Per Bulan (Sewa 1 Thn)' }}
                  </span>
                  <strong>{{ getPriceKmLuar }}<span>/bulan</span></strong>
                </div>
                <div class="room-type-cta">
                  <span>Lihat Kamar Tersedia</span>
                  <i class='bx bx-right-arrow-alt'></i>
                </div>
              </div>
            </RouterLink>

            <!-- Divider -->
            <div class="room-comparison-divider">
              <span>atau</span>
            </div>

            <!-- Kamar Mandi Dalam -->
            <RouterLink to="/rooms?tipe=km-dalam" class="room-type-card room-type-premium" id="roomKmDalam">
              <div class="room-type-badge-float">
                <i class='bx bxs-star'></i> Populer
              </div>
              <div class="room-type-image-wrapper">
                <img src="/assets/images/room-deluxe.png" alt="Tipe Kamar Mandi Dalam Sekar Space" class="room-type-img">
                <div class="room-type-img-overlay"></div>
                <div class="room-type-icon-badge">
                  <i class='bx bx-bath'></i>
                </div>
              </div>
              <div class="room-type-content">
                <span class="room-type-tag tag-premium">Premium</span>
                <h3>Kamar Mandi Dalam</h3>
                <p class="room-type-desc">Privasi lebih dengan kamar mandi dalam yang nyaman. Lebih leluasa dan eksklusif.</p>
                <ul class="room-type-features">
                  <li><i class='bx bx-check-circle'></i> Ukuran 3 × 3 meter</li>
                  <li><i class='bx bx-check-circle'></i> Kasur & Lemari</li>
                  <li><i class='bx bx-check-circle'></i> Cermin</li>
                  <li><i class='bx bx-check-circle'></i> WiFi 24 Jam</li>
                </ul>
                <div class="room-type-price">
                  <span class="price-from">
                    {{ roomPricingPeriod === 'monthly' ? 'Mulai dari' : roomPricingPeriod === 'quarterly' ? 'Harga Per Bulan (Sewa 3 Bln)' : 'Harga Per Bulan (Sewa 1 Thn)' }}
                  </span>
                  <strong>{{ getPriceKmDalam }}<span>/bulan</span></strong>
                </div>
                <div class="room-type-cta">
                  <span>Lihat Kamar Tersedia</span>
                  <i class='bx bx-right-arrow-alt'></i>
                </div>
              </div>
            </RouterLink>
          </div>
        </div>
      </section>



      <!-- NEW SECTION 2: ACCESSIBILITY & NEARBY PLACES -->
      <section id="accessibility" class="section accessibility-section">
        <div class="container">
          <header class="section-header">
            <span class="section-tag">Aksesbilitas Strategis</span>
            <h2>Jarak ke <span class="text-gradient">Tempat Terdekat</span></h2>
            <p>Lokasi Kost Muslimah Sekar Wangi di Mlati, Sleman sangat dekat dengan berbagai kampus ternama & fasilitas publik.</p>

            <div class="place-filters">
              <button 
                v-for="cat in placeCategories" 
                :key="cat.id"
                class="filter-btn"
                :class="{ active: activePlaceCategory === cat.id }"
                @click="activePlaceCategory = cat.id"
              >
                {{ cat.label }}
              </button>
            </div>
          </header>

          <div class="accessibility-grid">
            <div 
              v-for="place in filteredPlaces" 
              :key="place.id"
              class="place-card"
            >
              <div class="place-header">
                <div class="place-icon"><i :class="place.icon"></i></div>
                <span class="place-badge">{{ place.badge }}</span>
              </div>
              <h3>{{ place.name }}</h3>
              <p class="place-desc">{{ place.desc }}</p>
              <div class="place-footer">
                <div class="place-stat">
                  <i class='bx bx-map-pin'></i> <strong>{{ place.distance }}</strong>
                </div>
                <div class="place-stat">
                  <i class='bx bx-time-five'></i> <span>{{ place.time }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- NEW SECTION 3: TESTIMONIAL CAROUSEL -->
      <section id="testimonials" class="section testimonials-section">
        <div class="container">
          <header class="section-header">
            <span class="section-tag">Pengalaman Penghuni</span>
            <h2>Kata Mereka tentang <span class="text-gradient">Sekar Space</span></h2>
            <p>Dengarkan langsung ulasan dan pengalaman dari mahasiswi dan pekerja muslimah yang tinggal di kost kami.</p>
          </header>

          <div class="testimonial-slider-box">
            <button class="testi-arrow arrow-left" @click="prevTestimonial" aria-label="Ulasan sebelumnya">
              <i class='bx bx-chevron-left'></i>
            </button>
            <button class="testi-arrow arrow-right" @click="nextTestimonial" aria-label="Ulasan berikutnya">
              <i class='bx bx-chevron-right'></i>
            </button>

            <div class="testimonial-card">
              <div class="testi-stars">
                <i v-for="s in currentTestimonial.rating" :key="s" class='bx bxs-star'></i>
              </div>
              <blockquote class="testi-quote">
                "{{ currentTestimonial.comment }}"
              </blockquote>
              <div class="testi-user">
                <img :src="currentTestimonial.avatar" :alt="currentTestimonial.name" class="testi-avatar" />
                <div>
                  <h4>{{ currentTestimonial.name }}</h4>
                  <p>{{ currentTestimonial.role }} • <span class="text-primary">{{ currentTestimonial.tag }}</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>



      <!-- FAQ SECTION -->
      <section id="faq" class="section faq" aria-labelledby="faqHeading">
        <div class="container">
          <div class="faq-grid">
            <div class="faq-intro">
              <span class="section-tag">Tanya Jawab</span>
              <h2 id="faqHeading">Pertanyaan yang Sering <span class="text-gradient">Diajukan</span></h2>
              <p>Temukan jawaban atas pertanyaan umum seputar peraturan dan fasilitas di Kost Muslimah Sekar Wangi. Kami merangkum semua informasi untuk kenyamanan Anda.</p>
              
              <div class="faq-support-card">
                <div class="support-icon">
                  <i class='bx bx-support'></i>
                </div>
                <div class="support-text">
                  <h4>Punya pertanyaan lain?</h4>
                  <p>Jangan ragu untuk menghubungi pengelola kami secara langsung.</p>
                  <a href="https://wa.me/62895378020456" class="btn btn-primary btn-sm" target="_blank" rel="noopener">Hubungi Admin</a>
                </div>
              </div>
            </div>

            <div class="faq-container">
              <div 
                v-for="(faq, index) in faqs" 
                :key="index"
                class="faq-item"
                :class="{ active: activeFaq === index }"
              >
                <button 
                  class="faq-question" 
                  :aria-expanded="activeFaq === index ? 'true' : 'false'"
                  @click="toggleFaq(index)"
                >
                  <div class="faq-q-text">
                    <span class="faq-number">{{ faq.number }}</span>
                    <h3>{{ faq.question }}</h3>
                  </div>
                  <span class="faq-icon-wrapper"><i class='bx bx-plus'></i></span>
                </button>
                <div class="faq-answer">
                  <div class="faq-answer-inner">
                    <ul v-if="faq.isList && faq.list" class="faq-list">
                      <li v-for="(item, idx) in faq.list" :key="idx">
                        <strong>{{ item.label }}</strong> {{ item.text }}
                      </li>
                    </ul>
                    <p v-else>{{ faq.text }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- GALLERY SECTION (2-ROW DYNAMIC BENTO GRID WITH 100% GAPLESS INFINITY MARQUEE) -->
      <section id="gallery" class="section gallery" aria-labelledby="galleryHeading">
        <div class="container">
          <header class="section-header">
            <span class="section-tag">Suasana Kost</span>
            <h2 id="galleryHeading">Galeri <span class="text-gradient">Hunian</span></h2>
            <p>Lihat lebih dekat kenyamanan lingkungan, tipe kamar, dan fasilitas di Kost Muslimah Sekar Wangi. Hover pada galeri untuk menjeda pergerakan.</p>

            <!-- Gallery Filter Tabs -->
            <div class="gallery-filters justify-center">
              <button 
                v-for="cat in galleryCategories" 
                :key="cat.id"
                class="filter-btn"
                :class="{ active: selectedCategory === cat.id }"
                @click="selectGalleryCategory(cat.id)"
              >
                {{ cat.label }}
              </button>
            </div>
          </header>
        </div>

        <!-- 2-ROW INFINITE HORIZONTAL MARQUEE -->
        <div class="gallery-double-row-wrapper">
          <!-- Row 1: Left Infinite Loop -->
          <div class="gallery-marquee-row row-left">
            <div class="gallery-marquee-track">
              <div 
                v-for="(item, idx) in filteredRow1" 
                :key="`r1-a-${item.id}-${idx}`"
                class="gallery-card"
                :class="item.sizeClass"
                @click="openLightbox(item)"
              >
                <div class="gallery-img-wrapper">
                  <img :src="item.image" :alt="item.title" class="gallery-img" loading="lazy" />
                  <div class="gallery-overlay">
                    <span class="gallery-cat-badge">{{ item.categoryLabel }}</span>
                    <h3>{{ item.title }}</h3>
                    <div class="gallery-zoom-icon">
                      <i class='bx bx-search-plus'></i>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Duplicate for seamless math 100% infinite loop -->
              <div 
                v-for="(item, idx) in filteredRow1" 
                :key="`r1-b-${item.id}-${idx}`"
                class="gallery-card"
                :class="item.sizeClass"
                @click="openLightbox(item)"
              >
                <div class="gallery-img-wrapper">
                  <img :src="item.image" :alt="item.title" class="gallery-img" loading="lazy" />
                  <div class="gallery-overlay">
                    <span class="gallery-cat-badge">{{ item.categoryLabel }}</span>
                    <h3>{{ item.title }}</h3>
                    <div class="gallery-zoom-icon">
                      <i class='bx bx-search-plus'></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Row 2: Right Infinite Loop -->
          <div class="gallery-marquee-row row-right">
            <div class="gallery-marquee-track">
              <div 
                v-for="(item, idx) in filteredRow2" 
                :key="`r2-a-${item.id}-${idx}`"
                class="gallery-card"
                :class="item.sizeClass"
                @click="openLightbox(item)"
              >
                <div class="gallery-img-wrapper">
                  <img :src="item.image" :alt="item.title" class="gallery-img" loading="lazy" />
                  <div class="gallery-overlay">
                    <span class="gallery-cat-badge">{{ item.categoryLabel }}</span>
                    <h3>{{ item.title }}</h3>
                    <div class="gallery-zoom-icon">
                      <i class='bx bx-search-plus'></i>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Duplicate for seamless math 100% infinite loop -->
              <div 
                v-for="(item, idx) in filteredRow2" 
                :key="`r2-b-${item.id}-${idx}`"
                class="gallery-card"
                :class="item.sizeClass"
                @click="openLightbox(item)"
              >
                <div class="gallery-img-wrapper">
                  <img :src="item.image" :alt="item.title" class="gallery-img" loading="lazy" />
                  <div class="gallery-overlay">
                    <span class="gallery-cat-badge">{{ item.categoryLabel }}</span>
                    <h3>{{ item.title }}</h3>
                    <div class="gallery-zoom-icon">
                      <i class='bx bx-search-plus'></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- CONTACT SECTION -->
      <section id="contact" class="section contact" aria-labelledby="contactHeading">
        <div class="container">
          <header class="section-header">
            <span class="section-tag">Hubungi Kami</span>
            <h2 id="contactHeading">Lokasi & <span class="text-gradient">Kontak</span></h2>
            <p>Kunjungi langsung atau hubungi kami untuk informasi lebih lanjut.</p>
          </header>
          <div class="contact-grid">
            <div class="contact-info-wrapper">
              <address class="contact-details">
                <div class="contact-item" id="contactAddress">
                  <div class="contact-icon">
                    <i class='bx bxs-map'></i>
                  </div>
                  <div>
                    <h3>Alamat</h3>
                    <p>Kost Muslimah Sekar Wangi, Trini, Sinduadi, Kec. Mlati,<br>Kabupaten Sleman, Daerah Istimewa Yogyakarta 55284</p>
                  </div>
                </div>
                <div class="contact-item" id="contactPhone">
                  <div class="contact-icon">
                    <i class='bx bxs-phone'></i>
                  </div>
                  <div>
                    <h3>Telepon</h3>
                    <p><a href="tel:+62895378020456">+62 895-3780-20456</a></p>
                  </div>
                </div>
                <div class="contact-item" id="contactEmail">
                  <div class="contact-icon">
                    <i class='bx bxs-envelope'></i>
                  </div>
                  <div>
                    <h3>Email</h3>
                    <p><a href="mailto:info@sekarspace.com">info@sekarspace.com</a></p>
                  </div>
                </div>
                <div class="contact-item" id="contactHours">
                  <div class="contact-icon">
                    <i class='bx bxs-time'></i>
                  </div>
                  <div>
                    <h3>Jam Operasional</h3>
                    <p>Senin – Sabtu: 08.00 – 17.00<br>Minggu: Dengan perjanjian</p>
                  </div>
                </div>
              </address>
              <div class="contact-cta-group">
                <a 
                  href="https://wa.me/62895378020456?text=Halo%20Sekar%20Space%2C%20saya%20ingin%20bertanya%20tentang%20ketersediaan%20kamar." 
                  class="contact-cta-btn cta-wa" 
                  id="ctaWhatsappContact" 
                  target="_blank" 
                  rel="noopener"
                >
                  <i class='bx bxl-whatsapp'></i>
                  <span>Hubungi via WhatsApp</span>
                </a>
                <a 
                  href="https://www.google.com/maps/search/?api=1&query=-7.7507099,110.3496808" 
                  class="contact-cta-btn cta-maps" 
                  id="ctaGoogleMapsContact" 
                  target="_blank" 
                  rel="noopener"
                >
                  <i class='bx bxs-map-pin'></i>
                  <span>Buka Google Maps</span>
                </a>
              </div>
            </div>
            <div class="contact-map" id="contactMap">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d4096.961547023015!2d110.34968085650138!3d-7.7507099072810774!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e7a588cdcef73f3%3A0x2c8d90ddb0433c7c!2sKost%20Muslimah%20Sekar%20Wangi!5e0!3m2!1sid!2sid!4v1786543183534!5m2!1sid!2sid"
                width="100%"
                height="100%"
                style="border:0; border-radius: 16px;"
                allowfullscreen
                loading="lazy"
                referrerpolicy="strict-origin-when-cross-origin"
                title="Lokasi Kost Muslimah Sekar Wangi di Google Maps">
              </iframe>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- GALLERY LIGHTBOX MODAL -->
    <Transition name="fade">
      <div v-if="activeLightboxItem" class="lightbox-overlay" @click.self="closeLightbox">
        <div class="lightbox-modal">
          <button class="lightbox-close" @click="closeLightbox">
            <i class='bx bx-x'></i>
          </button>
          <div class="lightbox-body">
            <img :src="activeLightboxItem.image" :alt="activeLightboxItem.title" class="lightbox-img" />
            <div class="lightbox-info">
              <span class="lightbox-badge">{{ activeLightboxItem.categoryLabel }}</span>
              <h3>{{ activeLightboxItem.title }}</h3>
              <p>{{ activeLightboxItem.desc }}</p>
              <RouterLink to="/rooms" class="btn btn-primary btn-sm mt-4" @click="closeLightbox">
                Pesan Kamar Sekarang
              </RouterLink>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- FACILITY DETAIL MODAL -->
    <Transition name="fade">
      <div v-if="selectedFacilityModal" class="facility-modal-overlay" @click.self="closeFacilityModal">
        <div class="facility-modal-card">
          <button class="facility-modal-close" @click="closeFacilityModal">
            <i class='bx bx-x'></i>
          </button>
          <div class="facility-modal-header">
            <div class="facility-modal-icon">
              <i :class="selectedFacilityModal.icon"></i>
            </div>
            <div>
              <h3>{{ selectedFacilityModal.title }}</h3>
              <span class="facility-modal-tag">Keunggulan Utama</span>
            </div>
          </div>
          <p class="facility-modal-desc">{{ selectedFacilityModal.details }}</p>
          <div class="facility-modal-footer">
            <button class="btn btn-primary btn-sm" @click="closeFacilityModal">
              Tutup & Lanjutkan
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- BACK TO TOP FLOATING BUTTON -->
    <button 
      class="back-to-top" 
      :class="{ show: showBackToTop }" 
      @click="scrollToTop" 
      aria-label="Kembali ke atas"
    >
      <i class='bx bx-up-arrow-alt'></i>
    </button>

    <!-- FLOATING WHATSAPP -->
    <a 
      href="https://wa.me/62895378020456" 
      class="floating-wa" 
      id="floatingWhatsapp" 
      target="_blank" 
      rel="noopener" 
      aria-label="Hubungi via WhatsApp"
    >
      <i class='bx bxl-whatsapp'></i>
    </a>

    <Footer />
  </div>
</template>

<style scoped>
.home-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  position: relative;
}

.main-body {
  flex: 1;
}

/* Scroll Progress Bar */
.scroll-progress-bar {
  position: fixed;
  top: 0;
  left: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--primary), var(--secondary), #E8A838);
  z-index: 2000;
  transition: width 0.1s ease-out;
}

/* HERO SECTION WITH SLIDESHOW */
.hero {
  position: relative;
  min-height: 100vh;
  min-height: 100svh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 120px 24px 80px;
  overflow: hidden;
  background: var(--dark);
}

.hero-bg-slider {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.hero-bg-slide {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  opacity: 0;
  transform: scale(1.06);
  transition: opacity 1.2s cubic-bezier(0.4, 0, 0.2, 1), transform 6s ease-out;
}

.hero-bg-slide.active {
  opacity: 1;
  transform: scale(1);
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    rgba(84, 26, 26, 0.88) 0%,
    rgba(84, 26, 26, 0.72) 40%,
    rgba(61, 18, 18, 0.65) 100%
  );
  z-index: 1;
}

.hero::before,
.hero::after {
  content: '';
  position: absolute;
  border-radius: 50%;
  z-index: 1;
  pointer-events: none;
}

.hero::before {
  width: 450px;
  height: 450px;
  background: radial-gradient(circle, rgba(220, 195, 170, 0.22) 0%, transparent 70%);
  top: -120px;
  right: -120px;
  animation: floatOrb 8s ease-in-out infinite;
}

.hero::after {
  width: 350px;
  height: 350px;
  background: radial-gradient(circle, rgba(241, 226, 209, 0.18) 0%, transparent 70%);
  bottom: -60px;
  left: -90px;
  animation: floatOrb 10s ease-in-out infinite reverse;
}

.hero-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(8px);
  color: var(--white);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  cursor: pointer;
  z-index: 5;
  transition: all var(--transition-fast);
}

.hero-arrow:hover {
  background: var(--white);
  color: var(--primary);
  transform: translateY(-50%) scale(1.1);
}

.hero-arrow-left {
  left: 24px;
}

.hero-arrow-right {
  right: 24px;
}

.hero-content {
  position: relative;
  z-index: 2;
  max-width: 720px;
  text-align: center;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  background: rgba(220, 195, 170, 0.2);
  border: 1px solid rgba(220, 195, 170, 0.3);
  border-radius: var(--radius-full);
  color: var(--secondary);
  font-size: 0.85rem;
  font-weight: 500;
  margin-bottom: 16px;
  backdrop-filter: blur(8px);
}

.hero-badge i {
  font-size: 0.9rem;
  color: var(--secondary);
}

.hero h1 {
  font-size: clamp(2.2rem, 4.5vw, 3.4rem);
  font-weight: 700;
  color: var(--white);
  line-height: 1.15;
  margin-bottom: 14px;
  text-shadow: 0 2px 24px rgba(0, 0, 0, 0.15);
}

.hero h1 .text-gradient {
  background: linear-gradient(135deg, var(--secondary), var(--tertiary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-desc {
  font-size: 1.05rem;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.6;
  margin-bottom: 24px;
  max-width: 560px;
  margin-left: auto;
  margin-right: auto;
}

.hero-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 36px;
}

.hero-actions .btn {
  padding: 14px 28px;
  font-size: 0.95rem;
}

.hero-stats {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 32px;
  padding: 16px 36px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: var(--radius-xl);
  backdrop-filter: blur(16px);
  transition: transform var(--transition-smooth);
  margin-bottom: 28px;
}

.hero-stats:hover {
  transform: translateY(-4px);
}

.stat-item {
  text-align: center;
}

.stat-number {
  display: block;
  font-family: var(--font-heading);
  font-size: 1.7rem;
  font-weight: 700;
  color: var(--white);
  line-height: 1.1;
}

.stat-item span {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 400;
}

.stat-divider {
  width: 1px;
  height: 40px;
  background: rgba(255, 255, 255, 0.15);
}

.hero-slide-dots {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.dot-btn {
  background: transparent;
  border: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  opacity: 0.5;
  transition: all var(--transition-base);
}

.dot-num {
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--white);
  letter-spacing: 0.5px;
}

.dot-bar {
  width: 28px;
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: var(--radius-full);
  transition: all var(--transition-base);
}

.dot-btn.active {
  opacity: 1;
}

.dot-btn.active .dot-bar {
  width: 48px;
  background: var(--secondary);
  box-shadow: 0 0 12px rgba(220, 195, 170, 0.6);
}

/* SECTION STYLES */
.section {
  padding: var(--section-padding);
  position: relative;
}

.section-header {
  text-align: center;
  max-width: 650px;
  margin: 0 auto 40px;
}

.section-tag {
  display: inline-block;
  padding: 4px 14px;
  background: var(--tertiary);
  color: var(--primary);
  font-size: 0.78rem;
  font-weight: 600;
  border-radius: var(--radius-full);
  letter-spacing: 0.5px;
  text-transform: uppercase;
  margin-bottom: 10px;
}

.section-header h2 {
  font-size: clamp(1.6rem, 3vw, 2.2rem);
  margin-bottom: 8px;
  position: relative;
}

.section-header h2::after {
  content: '';
  display: block;
  width: 50px;
  height: 3px;
  background: linear-gradient(90deg, var(--primary), var(--secondary));
  border-radius: 2px;
  margin: 8px auto 0;
  animation: shimmerLine 3s ease-in-out infinite;
}

.section-header p {
  color: var(--text-muted);
  font-size: 0.95rem;
}

/* FACILITIES */
.facilities {
  background: var(--white);
  overflow: hidden;
}

.facilities-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  position: relative;
  z-index: 1;
  perspective: 1000px;
}

.facility-card {
  padding: 28px 24px;
  background: var(--off-white);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  text-align: center;
  transition: all var(--transition-smooth);
  position: relative;
  overflow: hidden;
  cursor: pointer;
}

.facility-card::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--primary), var(--secondary), var(--primary));
  background-size: 200% 100%;
  transform: scaleX(0);
  transition: transform var(--transition-smooth);
}

.facility-card:hover::after {
  transform: scaleX(1);
}

.facility-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: var(--shadow-lg);
  border-color: var(--secondary);
  background: var(--white);
}

.facility-icon {
  width: 54px;
  height: 54px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--tertiary), var(--secondary-light));
  border-radius: var(--radius-md);
  margin: 0 auto 16px;
  transition: all var(--transition-base);
}

.facility-icon i {
  font-size: 1.6rem;
  color: var(--primary);
  transition: color var(--transition-base);
}

.facility-card:hover .facility-icon {
  background: linear-gradient(135deg, var(--primary), var(--primary-light));
  transform: scale(1.15) rotate(-8deg);
}

.facility-card:hover .facility-icon i {
  color: var(--white);
}

.facility-card h3 {
  font-size: 1.15rem;
  margin-bottom: 8px;
  color: var(--dark);
}

.facility-card p {
  font-size: 0.9rem;
  color: var(--text-muted);
  line-height: 1.6;
  margin-bottom: 12px;
}

.facility-more-hint {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--primary);
  opacity: 0.7;
  transition: all var(--transition-fast);
}

.facility-card:hover .facility-more-hint {
  opacity: 1;
  gap: 6px;
}

/* ROOMS & PRICING SWITCHER */
.rooms {
  background: var(--off-white);
  overflow: hidden;
}

.pricing-period-selector {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--white);
  padding: 6px;
  border-radius: var(--radius-full);
  border: 1px solid var(--border);
  margin-top: 20px;
  box-shadow: var(--shadow-sm);
}

.period-btn {
  padding: 8px 18px;
  border: none;
  background: transparent;
  border-radius: var(--radius-full);
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-muted);
  cursor: pointer;
  transition: all var(--transition-base);
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.period-btn.active {
  background: var(--primary);
  color: var(--white);
  box-shadow: 0 4px 12px rgba(84, 26, 26, 0.25);
}

.discount-badge {
  font-size: 0.7rem;
  padding: 2px 8px;
  background: #25D366;
  color: white;
  border-radius: var(--radius-full);
}

.discount-badge.badge-best {
  background: #E8A838;
}

.room-comparison {
  display: flex;
  align-items: stretch;
  gap: 24px;
  width: 100%;
}

.room-type-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 16px 16px 28px;
  background: var(--white);
  border: 2px solid var(--border);
  border-radius: var(--radius-xl);
  transition: all var(--transition-smooth);
  position: relative;
  overflow: hidden;
  text-decoration: none;
  color: inherit;
}

.room-type-card:hover {
  transform: translateY(-8px) scale(1.01);
  border-color: var(--secondary);
  box-shadow: var(--shadow-xl);
}

.room-type-premium {
  border-color: var(--secondary);
  background: linear-gradient(180deg, var(--white) 0%, var(--tertiary-light) 100%);
}

.room-type-premium:hover {
  border-color: var(--primary);
  box-shadow: 0 16px 48px rgba(84, 26, 26, 0.18);
}

.room-type-badge-float {
  position: absolute;
  top: 26px;
  right: 26px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
  background: linear-gradient(135deg, #E8A838, #D4912A);
  color: var(--white);
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: var(--radius-full);
  z-index: 3;
  box-shadow: 0 4px 12px rgba(212, 145, 42, 0.35);
  animation: pulse-badge 2s ease-in-out infinite;
}

.room-type-image-wrapper {
  width: 100%;
  height: 200px;
  position: relative;
  border-radius: var(--radius-lg);
  overflow: hidden;
  margin-bottom: 20px;
}

.room-type-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.6s cubic-bezier(0.25, 1, 0.5, 1), filter 0.4s ease;
}

.room-type-img-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(44, 24, 16, 0.35) 0%, transparent 60%);
}

.room-type-icon-badge {
  position: absolute;
  bottom: 12px;
  right: 12px;
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  border-radius: var(--radius-md);
  color: var(--primary);
  font-size: 1.3rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.4s ease;
  z-index: 2;
}

.room-type-card:hover .room-type-img {
  transform: scale(1.08);
  filter: brightness(1.05);
}

.room-type-card:hover .room-type-icon-badge {
  background: var(--primary);
  color: var(--white);
  transform: scale(1.1) rotate(-6deg);
}

.room-type-content {
  position: relative;
  z-index: 1;
  width: 100%;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.room-type-tag {
  display: inline-block;
  padding: 4px 14px;
  background: var(--tertiary);
  color: var(--primary);
  font-size: 0.72rem;
  font-weight: 600;
  border-radius: var(--radius-full);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0 auto 12px;
}

.tag-premium {
  background: linear-gradient(135deg, var(--primary), var(--primary-light));
  color: var(--white);
}

.room-type-content h3 {
  font-size: 1.25rem;
  margin-bottom: 8px;
  color: var(--dark);
}

.room-type-desc {
  font-size: 0.88rem;
  color: var(--text-muted);
  line-height: 1.5;
  margin-bottom: 16px;
}

.room-type-features {
  text-align: left;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border);
}

.room-type-features li {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.88rem;
  color: var(--text);
  padding: 6px 0;
}

.room-type-features li i {
  font-size: 1.1rem;
  color: #16A34A;
  flex-shrink: 0;
}

.room-type-price {
  margin-top: auto;
  margin-bottom: 16px;
}

.price-from {
  display: block;
  font-size: 0.78rem;
  color: var(--text-muted);
  margin-bottom: 2px;
}

.room-type-price strong {
  font-family: var(--font-heading);
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary);
  transition: all var(--transition-base);
}

.room-type-price strong span {
  font-size: 0.85rem;
  font-weight: 400;
  color: var(--text-muted);
}

.room-type-cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 28px;
  background: var(--primary);
  color: var(--white);
  border-radius: var(--radius-full);
  font-size: 0.9rem;
  font-weight: 500;
  transition: all var(--transition-base);
  margin: 0 auto;
}

.room-type-card:hover .room-type-cta {
  background: var(--primary-light);
  gap: 14px;
  box-shadow: 0 8px 24px rgba(84, 26, 26, 0.25);
}

.room-type-cta i {
  font-size: 1.2rem;
  transition: transform var(--transition-base);
}

.room-type-card:hover .room-type-cta i {
  transform: translateX(4px);
}

.room-comparison-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.room-comparison-divider span {
  writing-mode: vertical-lr;
  text-transform: uppercase;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--text-muted);
  letter-spacing: 2px;
  position: relative;
  padding: 20px 0;
}

.room-comparison-divider span::before,
.room-comparison-divider span::after {
  content: '';
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: 1px;
  height: 60px;
  background: linear-gradient(to bottom, transparent, var(--border), transparent);
}

.room-comparison-divider span::before {
  bottom: 100%;
}

.room-comparison-divider span::after {
  top: 100%;
}

/* NEW STYLES: ESTIMATOR CALCULATOR */
.calculator-section {
  background: var(--white);
}

.estimator-box {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 36px;
  background: var(--off-white);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  padding: 36px;
  box-shadow: var(--shadow-md);
}

.estimator-controls {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.estimator-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.estimator-label {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--dark);
  display: flex;
  align-items: center;
  gap: 8px;
}

.estimator-label i {
  font-size: 1.2rem;
  color: var(--primary);
}

.radio-pill-group {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.radio-pill {
  flex: 1;
  min-width: 200px;
  padding: 12px 16px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  background: var(--white);
  color: var(--text);
  font-size: 0.88rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-base);
  text-align: center;
}

.radio-pill.active {
  background: var(--primary);
  color: var(--white);
  border-color: var(--primary);
  box-shadow: 0 4px 12px rgba(84, 26, 26, 0.2);
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
  font-size: 0.78rem;
  color: var(--text-muted);
  margin-top: 4px;
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.checkbox-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 18px;
  background: var(--white);
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
  width: 18px;
  height: 18px;
  accent-color: var(--primary);
}

.checkbox-text {
  display: flex;
  flex-direction: column;
}

.checkbox-text strong {
  font-size: 0.9rem;
  color: var(--dark);
}

.checkbox-text span {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.estimator-summary {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 28px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  box-shadow: var(--shadow-sm);
}

.summary-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  background: var(--tertiary);
  color: var(--primary);
  font-size: 0.8rem;
  font-weight: 700;
  border-radius: var(--radius-full);
  align-self: flex-start;
}

.summary-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.9rem;
  color: var(--text-muted);
}

.summary-row strong {
  color: var(--dark);
  font-weight: 600;
}

.summary-divider {
  height: 1px;
  background: var(--border);
  margin: 6px 0;
}

.summary-grand {
  margin-top: 4px;
}

.grand-price {
  font-family: var(--font-heading);
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--primary);
}

.btn-block {
  width: 100%;
  justify-content: center;
}

/* NEW STYLES: ACCESSIBILITY */
.accessibility-section {
  background: var(--off-white);
}

.place-filters {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 20px;
}

.accessibility-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.place-card {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 24px;
  transition: all var(--transition-smooth);
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
}

.place-card:hover {
  transform: translateY(-6px);
  box-shadow: var(--shadow-lg);
  border-color: var(--secondary);
}

.place-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.place-icon {
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

.place-badge {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 4px 10px;
  background: var(--off-white);
  color: var(--primary);
  border-radius: var(--radius-full);
  border: 1px solid var(--border);
}

.place-card h3 {
  font-size: 1.1rem;
  margin-bottom: 8px;
  color: var(--dark);
}

.place-desc {
  font-size: 0.88rem;
  color: var(--text-muted);
  line-height: 1.5;
  margin-bottom: 20px;
  flex: 1;
}

.place-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 14px;
  border-top: 1px solid var(--border);
  font-size: 0.85rem;
}

.place-stat {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--dark);
}

.place-stat i {
  color: var(--primary);
  font-size: 1.1rem;
}

/* NEW STYLES: TESTIMONIALS */
.testimonials-section {
  background: var(--white);
}

.testimonial-slider-box {
  position: relative;
  max-width: 760px;
  margin: 0 auto;
}

.testi-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--white);
  border: 1px solid var(--border);
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.6rem;
  cursor: pointer;
  z-index: 5;
  box-shadow: var(--shadow-md);
  transition: all var(--transition-fast);
}

.testi-arrow:hover {
  background: var(--primary);
  color: var(--white);
}

.testi-arrow.arrow-left {
  left: -60px;
}

.testi-arrow.arrow-right {
  right: -60px;
}

.testimonial-card {
  background: var(--off-white);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  padding: 40px;
  text-align: center;
  box-shadow: var(--shadow-md);
}

.testi-stars {
  display: flex;
  justify-content: center;
  gap: 4px;
  color: #E8A838;
  font-size: 1.3rem;
  margin-bottom: 16px;
}

.testi-quote {
  font-family: var(--font-heading);
  font-size: 1.15rem;
  font-style: italic;
  color: var(--dark);
  line-height: 1.6;
  margin-bottom: 28px;
}

.testi-user {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.testi-avatar {
  width: 54px;
  height: 54px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--secondary);
}

.testi-user h4 {
  font-size: 1.05rem;
  margin-bottom: 2px;
  color: var(--dark);
  text-align: left;
}

.testi-user p {
  font-size: 0.85rem;
  color: var(--text-muted);
  text-align: left;
}

/* NEW STYLES: FLOOR PLAN */
.floorplan-section {
  background: var(--off-white);
}

.floor-switcher {
  display: inline-flex;
  gap: 10px;
  background: var(--white);
  padding: 6px;
  border-radius: var(--radius-full);
  border: 1px solid var(--border);
  margin-top: 20px;
}

.floor-btn {
  padding: 10px 22px;
  border-radius: var(--radius-full);
  border: none;
  background: transparent;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all var(--transition-base);
}

.floor-btn.active {
  background: var(--primary);
  color: var(--white);
  box-shadow: 0 4px 14px rgba(84, 26, 26, 0.22);
}

.floor-plan-card {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  padding: 36px;
  box-shadow: var(--shadow-md);
  max-width: 900px;
  margin: 0 auto;
}

.floor-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.room-plan-node {
  border: 2px dashed var(--border);
  border-radius: var(--radius-lg);
  padding: 20px;
  text-align: center;
  transition: all var(--transition-base);
  background: var(--off-white);
}

.room-plan-node:hover {
  transform: scale(1.03);
  border-style: solid;
}

.node-icon {
  width: 44px;
  height: 44px;
  margin: 0 auto 10px;
  border-radius: 50%;
  background: var(--tertiary);
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
}

.node-title {
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 1.1rem;
  color: var(--dark);
}

.node-type {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-bottom: 10px;
}

.node-status-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: var(--radius-full);
  font-size: 0.72rem;
  font-weight: 700;
}

.room-plan-node.tersedia .node-status-badge {
  background: #DCFCE7;
  color: #15803D;
}

.room-plan-node.terisi .node-status-badge {
  background: #FEE2E2;
  color: #B91C1C;
}

.room-plan-node.fasilitas-umum .node-status-badge {
  background: #E0F2FE;
  color: #0369A1;
}

/* FAQ SECTION */
.faq {
  background: var(--white);
  position: relative;
}

.faq-grid {
  display: grid;
  grid-template-columns: 1fr 1.3fr;
  gap: 60px;
  align-items: flex-start;
}

.faq-intro {
  position: sticky;
  top: 100px;
}

.faq-intro h2 {
  font-size: clamp(1.8rem, 3.5vw, 2.5rem);
  margin: 16px 0 20px;
  line-height: 1.2;
}

.faq-intro p {
  color: var(--text-muted);
  font-size: 1.02rem;
  line-height: 1.7;
  margin-bottom: 32px;
}

.faq-support-card {
  background: linear-gradient(135deg, var(--white), var(--tertiary-light));
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 24px;
  display: flex;
  align-items: flex-start;
  gap: 20px;
  box-shadow: var(--shadow-sm);
}

.support-icon {
  width: 50px;
  height: 50px;
  min-width: 50px;
  background: var(--primary);
  color: var(--white);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
}

.support-text h4 {
  font-size: 1.1rem;
  color: var(--dark);
  margin-bottom: 6px;
}

.support-text p {
  font-size: 0.9rem;
  color: var(--text-muted);
  margin-bottom: 16px;
}

.faq-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.faq-item {
  background: var(--off-white);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: all var(--transition-base);
  box-shadow: var(--shadow-sm);
}

.faq-item:hover {
  border-color: var(--secondary);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.faq-item.active {
  border-color: var(--primary);
  box-shadow: 0 10px 30px rgba(84, 26, 26, 0.08);
  transform: translateY(-2px);
  background: var(--white);
}

.faq-question {
  width: 100%;
  text-align: left;
  padding: 24px 28px;
  background: transparent;
  border: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  font-family: var(--font-body);
  transition: all var(--transition-base);
}

.faq-q-text {
  display: flex;
  align-items: center;
  gap: 16px;
}

.faq-number {
  font-family: var(--font-heading);
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--secondary);
  transition: color var(--transition-base);
}

.faq-item.active .faq-number {
  color: var(--primary);
}

.faq-question h3 {
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--dark);
  margin: 0;
  line-height: 1.4;
  transition: color var(--transition-base);
}

.faq-item.active .faq-question h3 {
  color: var(--primary);
}

.faq-icon-wrapper {
  width: 36px;
  height: 36px;
  min-width: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--tertiary-light);
  border-radius: 50%;
  color: var(--primary);
  transition: all var(--transition-base);
}

.faq-icon-wrapper i {
  font-size: 1.5rem;
  transition: transform var(--transition-base);
}

.faq-item:hover .faq-icon-wrapper {
  background: var(--secondary-light);
}

.faq-item.active .faq-icon-wrapper {
  background: var(--primary);
  color: var(--white);
}

.faq-item.active .faq-icon-wrapper i {
  transform: rotate(45deg);
}

.faq-answer {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  background: var(--white);
}

.faq-item.active .faq-answer {
  grid-template-rows: 1fr;
  border-top: 1px dashed var(--border);
}

.faq-answer-inner {
  overflow: hidden;
}

.faq-answer-inner > p,
.faq-answer-inner > ul {
  padding: 24px 28px;
  margin: 0;
  color: var(--text-muted);
  font-size: 0.95rem;
  line-height: 1.7;
}

.faq-list {
  list-style-type: none;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.faq-list li {
  position: relative;
  padding-left: 24px;
}

.faq-list li::before {
  content: "•";
  position: absolute;
  left: 4px;
  top: -2px;
  color: var(--primary);
  font-size: 1.4rem;
  line-height: 1;
}

.faq-list li strong {
  color: var(--dark);
  font-weight: 600;
}

/* GALLERY SECTION (2-ROW DYNAMIC BENTO GRID WITH 100% GAPLESS INFINITY MARQUEE) */
.gallery {
  background: var(--off-white);
  padding-left: 0;
  padding-right: 0;
  padding-bottom: 80px;
}

.gallery-filters {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 20px;
}

.gallery-filters.justify-center {
  justify-content: center;
}

.filter-btn {
  padding: 8px 20px;
  border-radius: var(--radius-full);
  border: 1px solid var(--border);
  background: var(--white);
  color: var(--text-muted);
  font-size: 0.88rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-base);
}

.filter-btn:hover {
  background: var(--tertiary);
  color: var(--primary);
  border-color: var(--secondary);
}

.filter-btn.active {
  background: var(--primary);
  color: var(--white);
  border-color: var(--primary);
  box-shadow: 0 4px 14px rgba(84, 26, 26, 0.22);
}

.gallery-double-row-wrapper {
  width: 100%;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 10px 0;
}

.gallery-double-row-wrapper::before,
.gallery-double-row-wrapper::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  width: 100px;
  z-index: 5;
  pointer-events: none;
}

.gallery-double-row-wrapper::before {
  left: 0;
  background: linear-gradient(to right, var(--off-white), transparent);
}

.gallery-double-row-wrapper::after {
  right: 0;
  background: linear-gradient(to left, var(--off-white), transparent);
}

.gallery-marquee-row {
  width: 100%;
  overflow: hidden;
  display: flex;
  position: relative;
}

.gallery-marquee-track {
  display: flex;
  align-items: center;
  gap: 20px;
  width: max-content;
  will-change: transform;
}

.row-left .gallery-marquee-track {
  animation: marqueeLeft 34s linear infinite;
}

.row-right .gallery-marquee-track {
  animation: marqueeRight 38s linear infinite;
}

.gallery-marquee-row:hover .gallery-marquee-track {
  animation-play-state: paused;
}

@keyframes marqueeLeft {
  0% { transform: translate3d(0, 0, 0); }
  100% { transform: translate3d(-50%, 0, 0); }
}

@keyframes marqueeRight {
  0% { transform: translate3d(-50%, 0, 0); }
  100% { transform: translate3d(0, 0, 0); }
}

/* Varied Dynamic Card Sizes for Bento Marquee Effect */
.gallery-card {
  position: relative;
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--dark);
  cursor: pointer;
  box-shadow: var(--shadow-md);
  flex-shrink: 0;
  transition: all var(--transition-smooth);
}

.gallery-card.card-standard {
  width: 300px;
  min-width: 300px;
  height: 230px;
}

.gallery-card.card-wide {
  width: 420px;
  min-width: 420px;
  height: 230px;
}

.gallery-card.card-tall {
  width: 340px;
  min-width: 340px;
  height: 260px;
}

.gallery-card.card-large {
  width: 460px;
  min-width: 460px;
  height: 260px;
}

.gallery-card:hover {
  transform: translateY(-6px) scale(1.03);
  box-shadow: var(--shadow-xl);
}

.gallery-img-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.gallery-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.6s ease, filter 0.4s ease;
}

.gallery-card:hover .gallery-img {
  transform: scale(1.1);
  filter: brightness(0.9);
}

.gallery-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(44, 24, 16, 0.85) 0%, rgba(44, 24, 16, 0.2) 60%, transparent 100%);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 20px;
  transition: opacity var(--transition-base);
}

.gallery-cat-badge {
  display: inline-block;
  align-self: flex-start;
  padding: 4px 10px;
  background: rgba(220, 195, 170, 0.9);
  color: var(--primary);
  font-size: 0.72rem;
  font-weight: 700;
  border-radius: var(--radius-full);
  margin-bottom: 6px;
  backdrop-filter: blur(4px);
}

.gallery-overlay h3 {
  color: var(--white);
  font-size: 1.1rem;
  margin-bottom: 4px;
  line-height: 1.3;
}

.gallery-zoom-icon {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(8px);
  color: var(--white);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  opacity: 0;
  transform: scale(0.8);
  transition: all var(--transition-base);
}

.gallery-card:hover .gallery-zoom-icon {
  opacity: 1;
  transform: scale(1);
  background: var(--white);
  color: var(--primary);
}

/* CONTACT SECTION */
.contact {
  background: var(--white);
}

.contact-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
}

.contact-info-wrapper {
  display: flex;
  flex-direction: column;
}

.contact-details {
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin-bottom: 32px;
  font-style: normal;
}

.contact-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  background: transparent;
  border: none;
  padding: 0;
}

.contact-icon {
  width: 48px;
  height: 48px;
  min-width: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--tertiary);
  border-radius: var(--radius-md);
  color: var(--primary);
  font-size: 1.4rem;
  flex-shrink: 0;
  transition: all var(--transition-base);
}

.contact-item:hover .contact-icon {
  background: var(--primary);
  color: var(--white);
  transform: scale(1.05);
}

.contact-item h3 {
  font-size: 1rem;
  margin-bottom: 4px;
  color: var(--dark);
}

.contact-item p {
  font-size: 0.9rem;
  color: var(--text-muted);
  line-height: 1.5;
}

.contact-item a {
  color: var(--primary);
}

.contact-item a:hover {
  text-decoration: underline;
}

.contact-cta-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.contact-cta-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 14px 24px;
  border-radius: var(--radius-lg);
  font-weight: 600;
  font-size: 0.95rem;
  transition: all var(--transition-smooth);
}

.contact-cta-btn i {
  font-size: 1.35rem;
}

.cta-wa {
  background: #25D366;
  color: white;
  box-shadow: 0 4px 14px rgba(37, 211, 102, 0.25);
}

.cta-wa:hover {
  background: #20b858;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(37, 211, 102, 0.35);
  color: white;
}

.cta-maps {
  background: var(--tertiary);
  color: var(--primary);
}

.cta-maps:hover {
  background: var(--secondary);
  transform: translateY(-2px);
  color: var(--primary);
}

.contact-map {
  min-height: 380px;
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-md);
}

/* LIGHTBOX MODAL */
.lightbox-overlay,
.facility-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(8px);
  z-index: 2100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.lightbox-modal {
  background: var(--white);
  border-radius: var(--radius-xl);
  max-width: 900px;
  width: 100%;
  overflow: hidden;
  position: relative;
  box-shadow: var(--shadow-xl);
  animation: zoomIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.lightbox-close,
.facility-modal-close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  cursor: pointer;
  z-index: 10;
  transition: all var(--transition-fast);
}

.lightbox-close:hover,
.facility-modal-close:hover {
  background: var(--primary);
}

.lightbox-body {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
}

.lightbox-img {
  width: 100%;
  height: 400px;
  object-fit: cover;
}

.lightbox-info {
  padding: 32px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.lightbox-badge {
  display: inline-block;
  align-self: flex-start;
  padding: 4px 12px;
  background: var(--tertiary);
  color: var(--primary);
  font-size: 0.75rem;
  font-weight: 700;
  border-radius: var(--radius-full);
  margin-bottom: 12px;
}

.lightbox-info h3 {
  font-size: 1.5rem;
  margin-bottom: 12px;
  color: var(--dark);
}

.lightbox-info p {
  font-size: 0.95rem;
  color: var(--text-muted);
  line-height: 1.6;
}

/* FACILITY MODAL */
.facility-modal-card {
  background: var(--white);
  border-radius: var(--radius-xl);
  max-width: 500px;
  width: 100%;
  padding: 32px;
  position: relative;
  box-shadow: var(--shadow-xl);
  animation: zoomIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.facility-modal-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.facility-modal-icon {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-md);
  background: var(--tertiary);
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
}

.facility-modal-header h3 {
  font-size: 1.3rem;
}

.facility-modal-tag {
  font-size: 0.75rem;
  color: var(--primary);
  font-weight: 600;
  text-transform: uppercase;
}

.facility-modal-desc {
  color: var(--text-muted);
  line-height: 1.7;
  font-size: 0.95rem;
  margin-bottom: 24px;
}

.facility-modal-footer {
  display: flex;
  justify-content: flex-end;
}

/* BACK TO TOP BUTTON */
.back-to-top {
  position: fixed;
  bottom: 90px;
  right: 24px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--white);
  color: var(--primary);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  cursor: pointer;
  z-index: 997;
  opacity: 0;
  transform: translateY(16px);
  pointer-events: none;
  transition: all var(--transition-base);
}

.back-to-top.show {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

.back-to-top:hover {
  background: var(--primary);
  color: var(--white);
  border-color: var(--primary);
}

/* FLOATING WA BUTTON */
.floating-wa {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 56px;
  height: 56px;
  background: #25D366;
  color: var(--white);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  box-shadow: 0 4px 16px rgba(37, 211, 102, 0.4);
  z-index: 998;
  transition: all var(--transition-base);
  animation: pulse-wa 2s ease-in-out infinite;
}

.floating-wa:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 24px rgba(37, 211, 102, 0.6);
}

/* FADE TRANSITION */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* KEYFRAMES */
@keyframes floatOrb {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(20px, -20px) scale(1.05); }
  66% { transform: translate(-15px, 15px) scale(0.95); }
}

@keyframes shimmerLine {
  0%, 100% { width: 50px; opacity: 1; }
  50% { width: 80px; opacity: 0.7; }
}

@keyframes pulse-badge {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.06); }
}

@keyframes pulse-wa {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.08); }
}

@keyframes zoomIn {
  from {
    opacity: 0;
    transform: scale(0.92);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* RESPONSIVE MEDIA QUERIES */
@media (max-width: 1024px) {
  .facilities-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .estimator-box {
    grid-template-columns: 1fr;
  }
  .accessibility-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .floor-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .contact-grid {
    grid-template-columns: 1fr;
  }
  .contact-map {
    min-height: 350px;
  }
  .faq-grid {
    grid-template-columns: 1fr;
    gap: 40px;
  }
  .faq-intro {
    position: static;
  }
  .lightbox-body {
    grid-template-columns: 1fr;
  }
  .lightbox-img {
    height: 260px;
  }
  .hero-arrow,
  .testi-arrow {
    display: none;
  }
}

@media (max-width: 768px) {
  .hero {
    padding: 100px 20px 60px;
  }
  .hero-actions {
    flex-direction: column;
    width: 100%;
  }
  .hero-actions .btn {
    width: 100%;
    justify-content: center;
  }
  .room-comparison {
    flex-direction: column;
    max-width: 440px;
    margin: 0 auto;
  }
  .room-comparison-divider span {
    writing-mode: horizontal-tb;
    padding: 0 20px;
  }
  .room-comparison-divider span::before,
  .room-comparison-divider span::after {
    top: 50%;
    transform: translateY(-50%);
    width: 60px;
    height: 1px;
  }
  .room-comparison-divider span::before {
    right: 100%;
    left: auto;
    bottom: auto;
  }
  .room-comparison-divider span::after {
    left: 100%;
    top: 50%;
  }
  .facilities-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  .facility-card {
    padding: 20px 14px;
  }
  .accessibility-grid {
    grid-template-columns: 1fr;
  }
  .floor-grid {
    grid-template-columns: 1fr;
  }
  .gallery-card.card-standard {
    width: 250px;
    min-width: 250px;
  }
  .gallery-card.card-wide,
  .gallery-card.card-large {
    width: 320px;
    min-width: 320px;
  }
}

@media (max-width: 480px) {
  .hero h1 {
    font-size: 2rem;
  }
  .hero-stats {
    gap: 12px;
    padding: 16px;
  }
  .facilities-grid {
    grid-template-columns: 1fr;
  }
  .pricing-period-selector,
  .floor-switcher {
    flex-direction: column;
    width: 100%;
    border-radius: var(--radius-lg);
  }
  .period-btn,
  .floor-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
