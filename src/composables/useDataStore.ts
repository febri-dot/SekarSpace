import { ref } from 'vue'
import defaultRooms from '../data/rooms.json'
import defaultRoomTypes from '../data/roomTypes.json'
import defaultComplaints from '../data/complaints.json'
import defaultPayments from '../data/payments.json'
import defaultCms from '../data/cms.json'
import defaultFacilities from '../data/facilities.json'
import defaultNearbyPlaces from '../data/nearbyPlaces.json'
import defaultTestimonials from '../data/testimonials.json'
import defaultGallery from '../data/gallery.json'
import defaultFaqs from '../data/faqs.json'
import defaultBuildings from '../data/buildings.json'
import defaultRentals from '../data/rentals.json'

export interface RentalData {
  id: string
  memberId: string
  roomId: string
  startDate: string
  endDate: string
  durationMonths: number
  basePrice: number
  addonPrice: number
  totalAmount: number
  addons: string[]
  status: 'active' | 'completed' | 'cancelled'
  extensionIntent?: 'extend' | 'not_extend' | 'pending'
  createdAt: string
}

export interface RoomTypeData {
  typeId: 'km-luar' | 'km-dalam'
  typeName: string
  tag?: string
  badge: string
  desc: string
  size: string
  price?: number
  price1Month?: number
  price3Months?: number
  price6Months?: number
  price12Months?: number
  icon: string
  image?: string
  features: string[]
}

export interface RoomData {
  id: string
  number: string
  floor: number
  buildingId: string
  typeId: 'km-luar' | 'km-dalam'
  typeName: string
  price: number
  price1Month?: number
  price3Months?: number
  price6Months?: number
  price12Months?: number
  status: 'available' | 'occupied'
  size: string
  features: string[]
}

export interface ComplaintData {
  id: string
  memberId: string
  title: string
  category: string
  date: string
  status: 'pending' | 'in-progress' | 'resolved'
  priority: 'low' | 'medium' | 'high'
  description: string
  response?: string
}

export interface PaymentData {
  id: string
  rentalId: string
  period: string
  amount?: number
  method: string
  date: string
  dueDate?: string
  status: 'paid' | 'pending' | 'rejected'
  proofImage?: string
  notes?: string
  durationMonths?: number
}

export const getRoomPriceByDuration = (room?: RoomData | null, duration: number = 1): number => {
  if (!room) {
    room = (defaultRooms as any[])[0]
  }
  if (!room) return 600000 * duration

  const currentTypes = roomTypes.value && roomTypes.value.length > 0 ? roomTypes.value : (defaultRoomTypes as RoomTypeData[])
  const typeMeta = currentTypes.find(t => t.typeId === room?.typeId)

  const p1 = (typeMeta as any)?.price1Month ?? (typeMeta as any)?.price ?? room.price1Month ?? room.price ?? (room.typeId === 'km-dalam' ? 850000 : 600000)
  const p3 = (typeMeta as any)?.price3Months ?? room.price3Months ?? (room.typeId === 'km-dalam' ? 2000000 : 1800000)
  const p6 = (typeMeta as any)?.price6Months ?? room.price6Months ?? (room.typeId === 'km-dalam' ? 4000000 : 3500000)
  const p12 = (typeMeta as any)?.price12Months ?? room.price12Months ?? (room.typeId === 'km-dalam' ? 8000000 : 7000000)

  if (duration === 1) return p1
  if (duration === 3) return p3
  if (duration === 6) return p6
  if (duration === 12) return p12
  return p1 * duration
}

export const calculateRoomPrice = (typeId: string, duration: number): number => {
  const match = (defaultRooms as any[]).find(r => r.typeId === typeId) || { typeId }
  return getRoomPriceByDuration(match as RoomData, duration)
}

export interface BankAccountData {
  bank: string
  number: string
  holder: string
  badgeClass: string
}

export interface CmsSettings {
  announcementBarText: string
  heroBadgeText: string
  heroHeadline: string
  heroDescription: string
  contactPhone: string
  contactEmail: string
  contactAddress: string
  priceKmLuarMonthly: number
  priceKmDalamMonthly: number
  priceKmLuarYearly: number
  priceKmDalamYearly: number
  heroImage1: string
  heroImage2: string
  heroImage3: string
  qrisImage?: string
  bankAccounts?: BankAccountData[]
}

export interface FacilityData {
  icon: string
  title: string
  desc: string
  details: string
}

export interface NearbyPlaceCategory {
  id: string
  label: string
}

export interface NearbyPlaceData {
  id?: number
  name: string
  category: string
  distance: string
  time: string
  icon: string
  badge?: string
  desc: string
  popular?: boolean
}

export interface TestimonialData {
  id: number
  name: string
  role: string
  avatar: string
  rating: number
  tag: string
  comment: string
}

export interface RoomTransferRequest {
  id: string
  memberId: string
  rentalId: string
  currentRoomId: string
  targetRoomId: string
  reason?: string
  requestDate: string
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  adminNotes?: string
  actionDate?: string
}

export interface GalleryCategory {
  id: string
  label: string
}

export interface GalleryItemData {
  id: number
  title: string
  category: string
  categoryLabel: string
  image: string
  sizeClass: string
  desc: string
}

export interface FaqData {
  number: string
  question: string
  isList?: boolean
  list?: { label: string; text: string }[]
  answer?: string
  text?: string
}

export interface BuildingData {
  id: string
  name: string
  desc: string
  badge: string
  facilities: string[]
}

const STORAGE_ROOMS = 'sekar_space_rooms_v11'
const STORAGE_ROOM_TYPES = 'sekar_space_room_types_v1'
const STORAGE_COMPLAINTS = 'sekar_space_complaints_v7'
const STORAGE_PAYMENTS = 'sekar_space_payments_v9'
const STORAGE_CMS = 'sekar_space_cms_v7'
const STORAGE_FACILITIES = 'sekar_space_facilities_v1'
const STORAGE_NEARBY = 'sekar_space_nearby_v4'
const STORAGE_TESTIMONIALS = 'sekar_space_testimonials_v3'
const STORAGE_GALLERY = 'sekar_space_gallery_v1'
const STORAGE_FAQS = 'sekar_space_faqs_v1'
const STORAGE_BUILDINGS = 'sekar_space_buildings_v3'
const STORAGE_RENTALS = 'sekar_space_rentals_v8'
const STORAGE_ROOM_TRANSFERS = 'sekar_space_room_transfers_v1'

const loadStorage = <T>(key: string, defaultValue: T): T => {
  const saved = localStorage.getItem(key)
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      if (typeof defaultValue === 'object' && defaultValue !== null && !Array.isArray(defaultValue)) {
        return { ...defaultValue, ...parsed }
      }
      return parsed
    } catch (e) {
      console.error(`Failed parsing ${key}`, e)
    }
  }
  localStorage.setItem(key, JSON.stringify(defaultValue))
  return defaultValue
}

const roomTypes = ref<RoomTypeData[]>(loadStorage(STORAGE_ROOM_TYPES, defaultRoomTypes as RoomTypeData[]))

const loadRoomsStorage = (): RoomData[] => {
  const saved = localStorage.getItem(STORAGE_ROOMS)
  let loadedRooms = defaultRooms as any[]
  if (saved) {
    try {
      loadedRooms = JSON.parse(saved)
    } catch (e) {
      console.error('Failed parsing rooms from localStorage', e)
    }
  }
  const merged = loadedRooms.map(r => {
    const typeMeta = (roomTypes.value || defaultRoomTypes).find(t => t.typeId === r.typeId)
    return {
      id: r.id,
      number: r.number,
      floor: r.floor,
      buildingId: r.buildingId,
      typeId: r.typeId,
      status: r.status,
      typeName: r.typeName || typeMeta?.typeName || (r.typeId === 'km-dalam' ? 'Kamar Mandi Dalam' : 'Kamar Mandi Luar'),
      price: r.price ?? (typeMeta as any)?.price ?? (r.typeId === 'km-dalam' ? 850000 : 600000),
      price1Month: r.price1Month ?? (typeMeta as any)?.price1Month ?? (typeMeta as any)?.price ?? (r.typeId === 'km-dalam' ? 850000 : 600000),
      price3Months: r.price3Months ?? (typeMeta as any)?.price3Months ?? (r.typeId === 'km-dalam' ? 2000000 : 1800000),
      price6Months: r.price6Months ?? (typeMeta as any)?.price6Months ?? (r.typeId === 'km-dalam' ? 4000000 : 3500000),
      price12Months: r.price12Months ?? (typeMeta as any)?.price12Months ?? (r.typeId === 'km-dalam' ? 8000000 : 7000000),
      size: r.size || typeMeta?.size || (r.typeId === 'km-dalam' ? '3 × 4 Meter' : '3 × 3 Meter'),
      features: (r.features && r.features.length > 0) ? r.features : (typeMeta?.features || ['Kasur & Bantal', 'Lemari Pakaian', 'Meja & Cermin'])
    } as RoomData
  })
  localStorage.setItem(STORAGE_ROOMS, JSON.stringify(merged))
  return merged
}

const rooms = ref<RoomData[]>(loadRoomsStorage())
const complaints = ref<ComplaintData[]>(loadStorage(STORAGE_COMPLAINTS, defaultComplaints as ComplaintData[]))
const payments = ref<PaymentData[]>(loadStorage(STORAGE_PAYMENTS, defaultPayments as PaymentData[]))
const cmsSettings = ref<CmsSettings>(loadStorage(STORAGE_CMS, defaultCms as CmsSettings))
const facilities = ref<FacilityData[]>(loadStorage(STORAGE_FACILITIES, defaultFacilities as FacilityData[]))
const nearbyPlacesData = ref<{ categories: NearbyPlaceCategory[]; places: NearbyPlaceData[] }>(
  loadStorage(STORAGE_NEARBY, defaultNearbyPlaces as any)
)
const testimonials = ref<TestimonialData[]>(loadStorage(STORAGE_TESTIMONIALS, defaultTestimonials as TestimonialData[]))
const galleryData = ref<{ categories: GalleryCategory[]; row1: GalleryItemData[]; row2: GalleryItemData[] }>(
  loadStorage(STORAGE_GALLERY, defaultGallery as any)
)
const faqs = ref<FaqData[]>(loadStorage(STORAGE_FAQS, defaultFaqs as FaqData[]))
const buildings = ref<BuildingData[]>(loadStorage(STORAGE_BUILDINGS, defaultBuildings as BuildingData[]))
const rentals = ref<RentalData[]>(loadStorage(STORAGE_RENTALS, defaultRentals as RentalData[]))
const roomTransfers = ref<RoomTransferRequest[]>(loadStorage(STORAGE_ROOM_TRANSFERS, [] as RoomTransferRequest[]))

// Helper to physically write to disk JSON file via Vite API
const writeJsonDisk = async (filename: string, data: any) => {
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
  localStorage.setItem(STORAGE_ROOM_TYPES, JSON.stringify(roomTypes.value))
  localStorage.setItem(STORAGE_COMPLAINTS, JSON.stringify(complaints.value))
  localStorage.setItem(STORAGE_PAYMENTS, JSON.stringify(payments.value))
  localStorage.setItem(STORAGE_CMS, JSON.stringify(cmsSettings.value))
  localStorage.setItem(STORAGE_FACILITIES, JSON.stringify(facilities.value))
  localStorage.setItem(STORAGE_NEARBY, JSON.stringify(nearbyPlacesData.value))
  localStorage.setItem(STORAGE_TESTIMONIALS, JSON.stringify(testimonials.value))
  localStorage.setItem(STORAGE_GALLERY, JSON.stringify(galleryData.value))
  localStorage.setItem(STORAGE_FAQS, JSON.stringify(faqs.value))
  localStorage.setItem(STORAGE_BUILDINGS, JSON.stringify(buildings.value))
  localStorage.setItem(STORAGE_RENTALS, JSON.stringify(rentals.value))
  localStorage.setItem(STORAGE_ROOM_TRANSFERS, JSON.stringify(roomTransfers.value))

  const normalizedRooms = rooms.value.map(r => ({
    id: r.id,
    number: r.number,
    floor: r.floor,
    buildingId: r.buildingId,
    typeId: r.typeId,
    status: r.status
  }))
  writeJsonDisk('rooms', normalizedRooms)
  writeJsonDisk('roomTypes', roomTypes.value)
  writeJsonDisk('complaints', complaints.value)
  writeJsonDisk('payments', payments.value)
  writeJsonDisk('cms', cmsSettings.value)
  writeJsonDisk('facilities', facilities.value)
  writeJsonDisk('nearbyPlaces', nearbyPlacesData.value)
  writeJsonDisk('testimonials', testimonials.value)
  writeJsonDisk('gallery', galleryData.value)
  writeJsonDisk('faqs', faqs.value)
  writeJsonDisk('buildings', buildings.value)
  writeJsonDisk('rentals', rentals.value)
}

export function useDataStore() {
  const getBuildingById = (buildingId: string): BuildingData | undefined => {
    return buildings.value.find(b => b.id === buildingId)
  }

  const getBuildingName = (buildingId: string): string => {
    const bld = getBuildingById(buildingId)
    return bld ? bld.name : (buildingId === 'bld-a' ? 'Gedung A' : buildingId === 'bld-b' ? 'Gedung B' : 'Gedung C')
  }

  const getRoomById = (roomId: string): RoomData | undefined => {
    return rooms.value.find(r => r.id === roomId || r.number === roomId)
  }

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

  const getPaymentsByMemberId = (memberId: string): PaymentData[] => {
    const memberRentalIds = new Set(rentals.value.filter(r => r.memberId === memberId).map(r => r.id))
    return payments.value.filter(p => memberRentalIds.has(p.rentalId))
  }

  const getPaymentsByRentalId = (rentalId: string): PaymentData[] => {
    return payments.value.filter(p => p.rentalId === rentalId)
  }

  const getRentalByPayment = (pay: PaymentData): RentalData | undefined => {
    return rentals.value.find(r => r.id === pay.rentalId)
  }

  const getPaymentAmount = (pay: PaymentData): number => {
    if (pay.amount !== undefined && pay.amount !== null && !isNaN(pay.amount)) {
      return pay.amount
    }
    const rent = rentals.value.find(r => r.id === pay.rentalId)
    if (rent) {
      return rent.totalAmount || rent.basePrice || 0
    }
    return 0
  }

  const getPaymentDurationMonths = (pay: PaymentData): number => {
    if (pay.durationMonths) return pay.durationMonths
    const rent = rentals.value.find(r => r.id === pay.rentalId)
    return rent ? rent.durationMonths : 1
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

  const transferRoom = (rentalId: string, newRoomId: string, reason?: string) => {
    const rent = rentals.value.find(r => r.id === rentalId)
    if (!rent) return { success: false, message: 'Kontrak sewa tidak ditemukan.' }

    const oldRoom = rooms.value.find(r => r.id === rent.roomId)
    const newRoom = rooms.value.find(r => r.id === newRoomId)

    if (!newRoom) return { success: false, message: 'Kamar tujuan tidak ditemukan.' }
    if (newRoom.status !== 'available') return { success: false, message: 'Kamar tujuan sedang tidak tersedia.' }
    if (oldRoom && newRoom.typeId !== oldRoom.typeId) {
      return { success: false, message: 'Pindah kamar hanya dapat dilakukan ke kamar dengan tipe yang sama.' }
    }
    if (rent.extensionIntent === 'not_extend') {
      return { success: false, message: 'Penyewa yang memilih tidak lanjut tidak dapat mengajukan pindah kamar.' }
    }

    // 1. Kosongkan status kamar lama
    if (oldRoom) {
      oldRoom.status = 'available'
    }

    // 2. Tandai kamar baru menjadi terisi
    newRoom.status = 'occupied'

    // 3. Perbarui roomId pada kontrak sewa
    const prevRoomNum = oldRoom?.number || rent.roomId
    rent.roomId = newRoom.id

    // Sinkronkan juga kontrak masa depan milik penyewa ini jika ada
    rentals.value.forEach(r => {
      if (r.memberId === rent.memberId && r.status !== 'cancelled') {
        r.roomId = newRoom.id
      }
    })

    saveAll()
    return { 
      success: true, 
      message: `Selamat! Anda berhasil pindah dari Kamar ${prevRoomNum} ke Kamar ${newRoom.number} (${getBuildingName(newRoom.buildingId)}).` 
    }
  }

  const createRoomTransferRequest = (params: {
    memberId: string
    rentalId: string
    currentRoomId: string
    targetRoomId: string
    reason?: string
  }) => {
    const existingPending = roomTransfers.value.find(
      t => t.memberId === params.memberId && t.status === 'pending'
    )
    if (existingPending) {
      return { success: false, message: 'Anda masih memiliki permohonan pindah kamar yang sedang diproses oleh pengelola.' }
    }

    const today = new Date().toISOString().substring(0, 10)
    const newReq: RoomTransferRequest = {
      id: `TRF-${String(roomTransfers.value.length + 1).padStart(3, '0')}`,
      memberId: params.memberId,
      rentalId: params.rentalId,
      currentRoomId: params.currentRoomId,
      targetRoomId: params.targetRoomId,
      reason: params.reason || '',
      requestDate: today,
      status: 'pending'
    }

    roomTransfers.value.unshift(newReq)
    saveAll()
    return { 
      success: true, 
      request: newReq, 
      message: 'Pengajuan pindah kamar berhasil dikirim! Menunggu konfirmasi & persetujuan pemilik kost.' 
    }
  }

  const cancelRoomTransferRequest = (requestId: string) => {
    const req = roomTransfers.value.find(t => t.id === requestId)
    if (req && req.status === 'pending') {
      req.status = 'cancelled'
      saveAll()
      return { success: true, message: 'Pengajuan pindah kamar berhasil dibatalkan.' }
    }
    return { success: false, message: 'Pengajuan tidak dapat dibatalkan.' }
  }

  const approveRoomTransferRequest = (requestId: string, adminNotes?: string) => {
    const req = roomTransfers.value.find(t => t.id === requestId)
    if (!req) return { success: false, message: 'Pengajuan pindah kamar tidak ditemukan.' }
    if (req.status !== 'pending') return { success: false, message: 'Pengajuan ini sudah tidak berstatus pending.' }

    const oldRoom = rooms.value.find(r => r.id === req.currentRoomId)
    const newRoom = rooms.value.find(r => r.id === req.targetRoomId)
    const rent = rentals.value.find(r => r.id === req.rentalId)

    if (!newRoom || newRoom.status !== 'available') {
      return { success: false, message: 'Kamar tujuan sedang tidak tersedia / telah diisi orang lain.' }
    }

    // 1. Kosongkan kamar lama
    if (oldRoom) {
      oldRoom.status = 'available'
    }

    // 2. Isi kamar baru
    newRoom.status = 'occupied'

    // 3. Update rental
    if (rent) {
      rent.roomId = newRoom.id
    }

    // Sinkronkan rental aktif & masa depan lainnya milik member ini
    rentals.value.forEach(r => {
      if (r.memberId === req.memberId && r.status !== 'cancelled') {
        r.roomId = newRoom.id
      }
    })

    // 4. Update request status
    req.status = 'approved'
    req.adminNotes = adminNotes || ''
    req.actionDate = new Date().toISOString().substring(0, 10)

    saveAll()
    return { 
      success: true, 
      message: `Permohonan pindah kamar disetujui! Kamar penyewa berhasil dialihkan ke Kamar ${newRoom.number}.` 
    }
  }

  const rejectRoomTransferRequest = (requestId: string, adminNotes?: string) => {
    const req = roomTransfers.value.find(t => t.id === requestId)
    if (!req) return { success: false, message: 'Pengajuan pindah kamar tidak ditemukan.' }
    if (req.status !== 'pending') return { success: false, message: 'Pengajuan ini sudah tidak berstatus pending.' }

    req.status = 'rejected'
    req.adminNotes = adminNotes || ''
    req.actionDate = new Date().toISOString().substring(0, 10)

    saveAll()
    return { success: true, message: 'Pengajuan pindah kamar berhasil ditolak.' }
  }

  const getRoomTransferRequestsByMemberId = (memberId: string) => {
    return roomTransfers.value.filter(t => t.memberId === memberId)
  }

  const getActivePendingTransferRequest = (memberId: string) => {
    return roomTransfers.value.find(t => t.memberId === memberId && t.status === 'pending')
  }

  const resetDataToJSON = () => {
    rooms.value = defaultRooms as RoomData[]
    roomTypes.value = defaultRoomTypes as RoomTypeData[]
    complaints.value = defaultComplaints as ComplaintData[]
    payments.value = defaultPayments as PaymentData[]
    cmsSettings.value = defaultCms as CmsSettings
    facilities.value = defaultFacilities as FacilityData[]
    nearbyPlacesData.value = defaultNearbyPlaces as any
    testimonials.value = defaultTestimonials as TestimonialData[]
    galleryData.value = defaultGallery as any
    faqs.value = defaultFaqs as FaqData[]
    buildings.value = defaultBuildings as BuildingData[]
    rentals.value = defaultRentals as RentalData[]
    roomTransfers.value = []
    saveAll()
  }

  const addRental = (newRent: Omit<RentalData, 'id' | 'createdAt'>): RentalData => {
    const created: RentalData = {
      ...newRent,
      id: `RNT-00${rentals.value.length + 1}`,
      createdAt: new Date().toISOString().substring(0, 10)
    }
    rentals.value.unshift(created)
    saveAll()
    return created
  }

  const getRentalsByMemberId = (memberId: string): RentalData[] => {
    return rentals.value.filter(r => r.memberId === memberId)
  }

  const getRentalContractStatus = (r: RentalData): 'active' | 'upcoming' | 'completed' | 'cancelled' => {
    if (r.status === 'completed' || r.status === 'cancelled') return r.status
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const start = new Date(r.startDate)
    const end = new Date(r.endDate)
    end.setHours(23, 59, 59, 999)

    if (now > end) {
      return 'completed'
    }
    if (now < start) {
      return 'upcoming'
    }
    return 'active'
  }

  const getTenantStayStatus = (memberId: string) => {
    const memberRentals = rentals.value.filter(r => r.memberId === memberId && r.status !== 'cancelled')
    if (memberRentals.length === 0) {
      return { hasActiveStay: false, isUpcomingOnly: false, upcomingRental: null, activeRental: null }
    }

    const now = new Date()
    now.setHours(0, 0, 0, 0)

    // 1. Cek apakah ada kontrak rental yang sedang aktif hari ini (now >= startDate && now <= endDate)
    const activeRental = memberRentals.find(r => {
      const start = new Date(r.startDate)
      start.setHours(0, 0, 0, 0)
      const end = new Date(r.endDate)
      end.setHours(23, 59, 59, 999)
      return now >= start && now <= end
    })

    if (activeRental) {
      return { hasActiveStay: true, isUpcomingOnly: false, upcomingRental: null, activeRental }
    }

    // 2. Cek apakah ada kontrak masa depan (now < startDate) dan tidak ada rental aktif hari ini
    const futureRentals = memberRentals.filter(r => {
      const start = new Date(r.startDate)
      start.setHours(0, 0, 0, 0)
      return now < start
    }).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())

    if (futureRentals.length > 0) {
      return { hasActiveStay: false, isUpcomingOnly: true, upcomingRental: futureRentals[0], activeRental: null }
    }

    return { hasActiveStay: false, isUpcomingOnly: false, upcomingRental: null, activeRental: null }
  }

  const getActiveRentalByMemberId = (memberId: string): RentalData | undefined => {
    const memberRentals = rentals.value.filter(r => r.memberId === memberId && r.status !== 'cancelled')
    if (memberRentals.length === 0) return undefined

    const now = new Date()
    now.setHours(0, 0, 0, 0)

    // Cari rental yang mencakup tanggal hari ini
    const currentActive = memberRentals.find(r => {
      const start = new Date(r.startDate)
      const end = new Date(r.endDate)
      end.setHours(23, 59, 59, 999)
      return now >= start && now <= end
    })
    if (currentActive) return currentActive

    // Jika belum masuk periode atau perpanjangan, kembalikan yang aktif terbaru
    return memberRentals.slice().sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())[0]
  }

  const getActiveRentalByRoomId = (roomId: string): RentalData | undefined => {
    const roomRentals = rentals.value.filter(r => r.roomId === roomId && r.status !== 'cancelled')
    if (roomRentals.length === 0) return undefined

    const now = new Date()
    now.setHours(0, 0, 0, 0)

    const currentActive = roomRentals.find(r => {
      const start = new Date(r.startDate)
      const end = new Date(r.endDate)
      end.setHours(23, 59, 59, 999)
      return now >= start && now <= end
    })
    if (currentActive) return currentActive

    return roomRentals.slice().sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())[0]
  }

  const updateRoomType = (typeId: string, updatedFields: Partial<RoomTypeData>) => {
    const item = roomTypes.value.find(t => t.typeId === typeId)
    if (item) {
      Object.assign(item, updatedFields)
      if (updatedFields.price1Month) {
        item.price = updatedFields.price1Month
      }
      // Sinkronkan harga kamar fisik yang memiliki typeId ini
      rooms.value.forEach(r => {
        if (r.typeId === typeId) {
          if (updatedFields.price1Month) {
            r.price = updatedFields.price1Month
            r.price1Month = updatedFields.price1Month
          }
          if (updatedFields.price3Months) r.price3Months = updatedFields.price3Months
          if (updatedFields.price6Months) r.price6Months = updatedFields.price6Months
          if (updatedFields.price12Months) r.price12Months = updatedFields.price12Months
          if (updatedFields.size) r.size = updatedFields.size
        }
      })
      saveAll()
    }
  }

  const updateRental = (id: string, updatedData: Partial<RentalData>) => {
    const item = rentals.value.find(r => r.id === id)
    if (item) {
      Object.assign(item, updatedData)
      saveAll()
    }
  }

  const isRoomBookedByOthers = (roomId: string, currentRentalId?: string, currentEndDate?: string): boolean => {
    if (!roomId || !currentEndDate) return false
    return rentals.value.some(r => 
      r.roomId === roomId && 
      r.id !== currentRentalId && 
      r.status !== 'cancelled' && 
      new Date(r.startDate) >= new Date(currentEndDate)
    )
  }

  const isRoomAvailableForDates = (roomId: string, startDateStr: string, endDateStr?: string): boolean => {
    if (!roomId || !startDateStr) return false
    const room = getRoomById(roomId)
    if (!room) return false

    const newStart = new Date(startDateStr)
    newStart.setHours(0, 0, 0, 0)
    if (isNaN(newStart.getTime())) return false

    let newEnd: Date | null = null
    if (endDateStr) {
      newEnd = new Date(endDateStr)
      newEnd.setHours(23, 59, 59, 999)
    }

    // Ambil semua rental valid untuk kamar ini
    const roomRentals = rentals.value.filter(r => r.roomId === roomId && r.status !== 'cancelled')

    // Jika kamar tidak memiliki kontrak sama sekali, periksa status fisik kamar
    if (roomRentals.length === 0) {
      return room.status === 'available'
    }

    // Periksa apakah ada tabrakan dengan salah satu rental
    for (const rent of roomRentals) {
      const rStart = new Date(rent.startDate)
      rStart.setHours(0, 0, 0, 0)
      const rEnd = new Date(rent.endDate)
      rEnd.setHours(23, 59, 59, 999)

      // Jika penyewa lama memilih tidak perpanjang (not_extend), dia menempati s.d. rEnd
      // Kamar bisa diisi mulai hari setelah rEnd (newStart > rEnd)
      if (rent.extensionIntent === 'not_extend') {
        if (newStart <= rEnd) {
          return false
        }
      } else {
        // Jika rent aktif dan belum/akan perpanjang (pending atau extend),
        // kamar tidak bisa diisi selama periode [rStart, rEnd]
        if (newEnd) {
          if (newStart <= rEnd && newEnd >= rStart) {
            return false
          }
        } else {
          if (newStart <= rEnd) {
            return false
          }
        }
      }

      // Periksa juga tabrakan jika ada rental masa depan lain
      if (newEnd) {
        if (newStart <= rEnd && newEnd >= rStart) {
          return false
        }
      }
    }

    return true
  }

  const setExtensionIntent = (rentalId: string, intent: 'extend' | 'not_extend' | 'pending') => {
    const item = rentals.value.find(r => r.id === rentalId)
    if (item) {
      if (item.extensionIntent === 'not_extend' && intent !== 'not_extend') {
        const isBooked = isRoomBookedByOthers(item.roomId, item.id, item.endDate)
        if (isBooked) {
          alert('Maaf, kamar ini sudah direservasi oleh calon penyewa baru untuk periode berikutnya sehingga perpanjangan sewa tidak dapat dilakukan.')
          return false
        }
      }
      item.extensionIntent = intent
      saveAll()
      return true
    }
    return false
  }

  const getRoomAvailabilityInfo = (roomId: string) => {
    const rent = getActiveRentalByRoomId(roomId)
    if (!rent) {
      // Cek apakah ada kontrak sewa masa depan yang sudah membooking kamar ini
      const futureRent = rentals.value.find(r => r.roomId === roomId && r.status !== 'cancelled' && new Date(r.startDate) > new Date())
      if (futureRent) {
        return {
          status: 'occupied' as const,
          label: 'Sudah Direservasi',
          isUpcoming: false,
          availableFrom: null as string | null
        }
      }
      return {
        status: 'available' as const,
        label: 'Tersedia',
        isUpcoming: false,
        availableFrom: null as string | null
      }
    }
    if (rent.extensionIntent === 'not_extend') {
      const isBooked = isRoomBookedByOthers(roomId, rent.id, rent.endDate)
      if (isBooked) {
        return {
          status: 'occupied' as const,
          label: 'Sudah Direservasi',
          isUpcoming: false,
          availableFrom: null as string | null
        }
      }
      return {
        status: 'upcoming_available' as const,
        label: `Tersedia Mulai ${rent.endDate}`,
        isUpcoming: true,
        availableFrom: rent.endDate,
        tenantEndDate: rent.endDate
      }
    }
    return {
      status: 'occupied' as const,
      label: 'Terisi',
      isUpcoming: false,
      availableFrom: null as string | null
    }
  }

  return {
    rooms,
    roomTypes,
    complaints,
    payments,
    cmsSettings,
    facilities,
    nearbyPlacesData,
    testimonials,
    galleryData,
    faqs,
    buildings,
    rentals,
    roomTransfers,
    getBuildingById,
    getBuildingName,
    getRoomById,
    addComplaint,
    updateComplaintResponse,
    addPayment,
    updatePaymentStatus,
    getPaymentsByMemberId,
    getPaymentsByRentalId,
    getRentalByPayment,
    getPaymentAmount,
    getPaymentDurationMonths,
    addRoom,
    updateRoom,
    deleteRoom,
    updateCmsSettings,
    bookRoom,
    transferRoom,
    createRoomTransferRequest,
    cancelRoomTransferRequest,
    approveRoomTransferRequest,
    rejectRoomTransferRequest,
    getRoomTransferRequestsByMemberId,
    getActivePendingTransferRequest,
    addRental,
    getRentalsByMemberId,
    getActiveRentalByMemberId,
    getActiveRentalByRoomId,
    getTenantStayStatus,
    updateRental,
    updateRoomType,
    isRoomBookedByOthers,
    isRoomAvailableForDates,
    setExtensionIntent,
    getRoomAvailabilityInfo,
    getRentalContractStatus,
    resetDataToJSON
  }
}
