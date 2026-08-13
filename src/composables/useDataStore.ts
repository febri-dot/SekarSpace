import { ref } from 'vue'
import defaultRooms from '../data/rooms.json'
import defaultComplaints from '../data/complaints.json'
import defaultPayments from '../data/payments.json'

export interface RoomData {
  id: string
  number: string
  floor: number
  buildingId: string
  buildingName: string
  typeId: 'km-luar' | 'km-dalam'
  typeName: string
  price: number
  status: 'available' | 'occupied'
  size: string
  features: string[]
}

export interface ComplaintData {
  id: string
  tenantName: string
  title: string
  category: string
  roomNumber: string
  date: string
  status: 'pending' | 'in-progress' | 'resolved'
  priority: 'low' | 'medium' | 'high'
  description: string
  response?: string
}

export interface PaymentData {
  id: string
  tenantName: string
  period: string
  amount: number
  method: string
  date: string
  dueDate?: string
  status: 'paid' | 'pending' | 'rejected'
  proofImage?: string
  notes?: string
}

export interface CmsSettings {
  announcementBarText: string
  heroBadgeText: string
  heroHeadline: string
  heroDescription: string
  contactPhone: string
  contactEmail: string
  contactAddress: string
  promoActive: boolean
  promoText: string
  // Dynamic Pricing for Landing Page
  priceKmLuarMonthly: number
  priceKmDalamMonthly: number
  priceKmLuarYearly: number
  priceKmDalamYearly: number
  // Hero Images for Banner
  heroImage1: string
  heroImage2: string
  heroImage3: string
}

const STORAGE_ROOMS = 'sekar_space_rooms_v5'
const STORAGE_COMPLAINTS = 'sekar_space_complaints_v4'
const STORAGE_PAYMENTS = 'sekar_space_payments_v4'
const STORAGE_CMS = 'sekar_space_cms_v2'

const defaultCmsSettings: CmsSettings = {
  announcementBarText: '✨ Promo Merdeka: Diskon Rp 100.000 untuk pembayaran 6 bulan pertama! Chat WhatsApp Admin sekarang.',
  heroBadgeText: 'Hunian Khusus Muslimah di Jogja',
  heroHeadline: 'Kost Muslimah Sekar Wangi',
  heroDescription: 'Hunian eksklusif, aman, nyaman, dan strategis dekat Kampus UTY & MMTC Jogja dengan fasilitas lengkap.',
  contactPhone: '+62 895-3780-20456',
  contactEmail: 'info@sekarspace.com',
  contactAddress: 'Kost Muslimah Sekar Wangi, Trini, Sinduadi, Kec. Mlati, Kabupaten Sleman, D.I. Yogyakarta 55284',
  promoActive: true,
  promoText: 'Diskon Rp 100.000 / bulan untuk sewa tahunan!',
  priceKmLuarMonthly: 700000,
  priceKmDalamMonthly: 950000,
  priceKmLuarYearly: 650000,
  priceKmDalamYearly: 880000,
  heroImage1: '/assets/images/hero-gedung-depan.png',
  heroImage2: '/assets/images/hero-kamar.png',
  heroImage3: '/assets/images/hero-dapur.png'
}

const loadStorage = <T>(key: string, defaultValue: T): T => {
  const saved = localStorage.getItem(key)
  if (saved) {
    try {
      return JSON.parse(saved)
    } catch (e) {
      console.error(`Failed parsing ${key}`, e)
    }
  }
  localStorage.setItem(key, JSON.stringify(defaultValue))
  return defaultValue
}

const rooms = ref<RoomData[]>(loadStorage(STORAGE_ROOMS, defaultRooms as RoomData[]))
const complaints = ref<ComplaintData[]>(loadStorage(STORAGE_COMPLAINTS, defaultComplaints as ComplaintData[]))
const payments = ref<PaymentData[]>(loadStorage(STORAGE_PAYMENTS, defaultPayments as PaymentData[]))
const cmsSettings = ref<CmsSettings>(loadStorage(STORAGE_CMS, defaultCmsSettings))
let isCmsChanged = false
if (!cmsSettings.value.heroImage1 || cmsSettings.value.heroImage1 === '/assets/images/hero-bg.png') {
  cmsSettings.value.heroImage1 = '/assets/images/hero-gedung-depan.png'
  isCmsChanged = true
}
if (!cmsSettings.value.heroImage2 || cmsSettings.value.heroImage2 === '/assets/images/room-deluxe.png') {
  cmsSettings.value.heroImage2 = '/assets/images/hero-kamar.png'
  isCmsChanged = true
}
if (!cmsSettings.value.heroImage3 || cmsSettings.value.heroImage3 === '/assets/images/room-single.png') {
  cmsSettings.value.heroImage3 = '/assets/images/hero-dapur.png'
  isCmsChanged = true
}
if (isCmsChanged) {
  localStorage.setItem(STORAGE_CMS, JSON.stringify(cmsSettings.value))
}

// Helper to physically write to disk JSON file via Vite API
const writeJsonDisk = async (filename: 'rooms' | 'complaints' | 'payments', data: any) => {
  try {
    await fetch('/api/save-json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename, data })
    })
  } catch (e) {
    console.warn(`Failed writing ${filename}.json to disk`, e)
  }
}

const saveAll = () => {
  localStorage.setItem(STORAGE_ROOMS, JSON.stringify(rooms.value))
  localStorage.setItem(STORAGE_COMPLAINTS, JSON.stringify(complaints.value))
  localStorage.setItem(STORAGE_PAYMENTS, JSON.stringify(payments.value))
  localStorage.setItem(STORAGE_CMS, JSON.stringify(cmsSettings.value))

  writeJsonDisk('rooms', rooms.value)
  writeJsonDisk('complaints', complaints.value)
  writeJsonDisk('payments', payments.value)
}

export function useDataStore() {
  const addComplaint = (newComp: Omit<ComplaintData, 'id'>) => {
    const created: ComplaintData = {
      ...newComp,
      id: `CMP-00${complaints.value.length + 1}`
    }
    complaints.value.unshift(created)
    saveAll()
    return created
  }

  const updateComplaintResponse = (id: string, response: string, newStatus?: 'pending' | 'in-progress' | 'resolved') => {
    const item = complaints.value.find(c => c.id === id)
    if (item) {
      item.response = response
      if (newStatus) item.status = newStatus
      saveAll()
    }
  }

  const addPayment = (newPay: Omit<PaymentData, 'id'>) => {
    const created: PaymentData = {
      ...newPay,
      id: `PAY-2026-0${payments.value.length + 1}`
    }
    payments.value.unshift(created)
    saveAll()
    return created
  }

  const updatePaymentStatus = (id: string, status: 'paid' | 'pending' | 'rejected', notes?: string) => {
    const item = payments.value.find(p => p.id === id)
    if (item) {
      item.status = status
      if (notes) item.notes = notes
      saveAll()
    }
  }

  const addRoom = (newRoom: Omit<RoomData, 'id'>): RoomData => {
    const id = `rm-${Date.now().toString(36)}`
    const created: RoomData = { ...newRoom, id }
    rooms.value.push(created)
    saveAll()
    return created
  }

  const updateRoom = (id: string, updatedData: Partial<RoomData>) => {
    const item = rooms.value.find(r => r.id === id)
    if (item) {
      Object.assign(item, updatedData)
      saveAll()
    }
  }

  const deleteRoom = (id: string) => {
    const idx = rooms.value.findIndex(r => r.id === id)
    if (idx !== -1) {
      rooms.value.splice(idx, 1)
      saveAll()
    }
  }

  const updateCmsSettings = (newSettings: Partial<CmsSettings>) => {
    Object.assign(cmsSettings.value, newSettings)
    saveAll()
  }

  const bookRoom = (roomId: string) => {
    const rm = rooms.value.find(r => r.id === roomId)
    if (rm) {
      rm.status = 'occupied'
      saveAll()
    }
  }

  const resetDataToJSON = () => {
    rooms.value = defaultRooms as RoomData[]
    complaints.value = defaultComplaints as ComplaintData[]
    payments.value = defaultPayments as PaymentData[]
    cmsSettings.value = defaultCmsSettings
    saveAll()
  }

  return {
    rooms,
    complaints,
    payments,
    cmsSettings,
    addComplaint,
    updateComplaintResponse,
    addPayment,
    updatePaymentStatus,
    addRoom,
    updateRoom,
    deleteRoom,
    updateCmsSettings,
    bookRoom,
    resetDataToJSON
  }
}
