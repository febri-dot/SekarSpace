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
  status: 'paid' | 'pending' | 'rejected'
}

const STORAGE_ROOMS = 'sekar_space_rooms_v2'
const STORAGE_COMPLAINTS = 'sekar_space_complaints_v2'
const STORAGE_PAYMENTS = 'sekar_space_payments_v2'

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
    saveAll()
  }

  return {
    rooms,
    complaints,
    payments,
    addComplaint,
    updateComplaintResponse,
    addPayment,
    bookRoom,
    resetDataToJSON
  }
}
