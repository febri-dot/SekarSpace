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

export interface RoomTypeData {
  typeId: 'km-luar' | 'km-dalam'
  typeName: string
  tag?: string
  badge: string
  desc: string
  size: string
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
  memberId: string
  period: string
  amount: number
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

  const typeMeta = (defaultRoomTypes as RoomTypeData[]).find(t => t.typeId === room?.typeId)

  const p1 = room.price1Month ?? room.price ?? (typeMeta as any)?.price1Month ?? (typeMeta as any)?.price ?? (room.typeId === 'km-dalam' ? 850000 : 600000)
  const p3 = room.price3Months ?? (typeMeta as any)?.price3Months ?? (room.typeId === 'km-dalam' ? 2000000 : 1800000)
  const p6 = room.price6Months ?? (typeMeta as any)?.price6Months ?? (room.typeId === 'km-dalam' ? 4000000 : 3500000)
  const p12 = room.price12Months ?? (typeMeta as any)?.price12Months ?? (room.typeId === 'km-dalam' ? 8000000 : 7000000)

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

const STORAGE_ROOMS = 'sekar_space_rooms_v10'
const STORAGE_ROOM_TYPES = 'sekar_space_room_types_v1'
const STORAGE_COMPLAINTS = 'sekar_space_complaints_v6'
const STORAGE_PAYMENTS = 'sekar_space_payments_v6'
const STORAGE_CMS = 'sekar_space_cms_v5'
const STORAGE_FACILITIES = 'sekar_space_facilities_v1'
const STORAGE_NEARBY = 'sekar_space_nearby_v4'
const STORAGE_TESTIMONIALS = 'sekar_space_testimonials_v3'
const STORAGE_GALLERY = 'sekar_space_gallery_v1'
const STORAGE_FAQS = 'sekar_space_faqs_v1'
const STORAGE_BUILDINGS = 'sekar_space_buildings_v2'

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
    saveAll()
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
    getBuildingById,
    getBuildingName,
    getRoomById,
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
