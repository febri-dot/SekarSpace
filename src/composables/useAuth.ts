import { ref, computed } from 'vue'
import defaultUsersData from '../data/users.json'

export interface User {
  id: string
  username: string
  name: string
  email: string
  role: 'admin' | 'member'
  nik?: string
  address?: string
  phone?: string
  birthDate?: string
  parentPhone?: string
  roomId?: string
  startDate?: string
  endDate?: string
  status?: 'aktif' | 'hampir-habis' | 'non-aktif'
  monthlyRent?: number
  password?: string
}

const STORAGE_USERS_KEY = 'sekar_space_users_v6'
const STORAGE_CURRENT_USER_KEY = 'sekar_space_current_user_v6'

// Load users from localStorage or JSON file data
const loadUsers = (): User[] => {
  const saved = localStorage.getItem(STORAGE_USERS_KEY)
  if (saved) {
    try {
      return JSON.parse(saved)
    } catch (e) {
      console.error('Failed to parse saved users', e)
    }
  }
  const initial = defaultUsersData as User[]
  localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(initial))
  return initial
}

// Load current logged in user
const loadCurrentUser = (): User | null => {
  const saved = localStorage.getItem(STORAGE_CURRENT_USER_KEY)
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      if (parsed) return parsed
    } catch (e) {
      console.error('Failed to parse saved current user', e)
    }
  }
  const defaultMember = (defaultUsersData as User[]).find(u => u.role === 'member') || (defaultUsersData[0] as User)
  return defaultMember
}

const users = ref<User[]>(loadUsers())
const currentUser = ref<User | null>(loadCurrentUser())

// Physical disk write + localStorage backup
const saveUsers = async () => {
  localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users.value))
  try {
    await fetch('/api/save-json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: 'users', data: users.value })
    })
  } catch (e) {
    console.warn('Vite save-json API unavailable (production fallback to localStorage)', e)
  }
}

const saveCurrentUser = () => {
  if (currentUser.value) {
    localStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(currentUser.value))
  } else {
    localStorage.removeItem(STORAGE_CURRENT_USER_KEY)
  }
}

export function useAuth() {
  const isLoggedIn = computed(() => !!currentUser.value)
  const isAdmin = computed(() => currentUser.value?.role === 'admin')
  const isMember = computed(() => currentUser.value?.role === 'member')
  const tenants = computed(() => users.value.filter(u => u.role === 'member'))

  const login = (usernameInput: string, passwordInput: string): { success: boolean; message: string; user?: User } => {
    const cleanUser = usernameInput.trim().toLowerCase()
    const found = users.value.find(u => u.username.toLowerCase() === cleanUser && u.password === passwordInput)

    if (found) {
      currentUser.value = found
      saveCurrentUser()
      return { success: true, message: 'Login berhasil!', user: found }
    }
    return { success: false, message: 'Username atau password yang Anda masukkan salah.' }
  }

  const logout = () => {
    currentUser.value = null
    saveCurrentUser()
  }

  const addMember = (newMemberData: Omit<User, 'id' | 'role'>): User => {
    const id = `MBR-0${users.value.filter(u => u.role === 'member').length + 1}`
    const member: User = {
      ...newMemberData,
      id,
      role: 'member',
      status: newMemberData.status || 'aktif'
    }
    users.value.push(member)
    saveUsers()
    return member
  }

  const updateMember = (id: string, updatedFields: Partial<User>) => {
    const targetUser = users.value.find(u => u.id === id || u.username === id)
    if (targetUser) {
      Object.assign(targetUser, updatedFields)
      if (currentUser.value && currentUser.value.id === targetUser.id) {
        Object.assign(currentUser.value, updatedFields)
        saveCurrentUser()
      }
      saveUsers()
    }
  }

  const deleteMember = (id: string) => {
    const idx = users.value.findIndex(u => u.id === id || u.username === id)
    if (idx !== -1) {
      users.value.splice(idx, 1)
      saveUsers()
    }
  }

  const getTenantById = (id: string | number): User | undefined => {
    return users.value.find(u => u.id === String(id) || u.username === String(id) || u.id.endsWith(String(id)))
  }

  const resetUsersToJSON = () => {
    users.value = defaultUsersData as User[]
    saveUsers()
  }

  return {
    currentUser,
    isLoggedIn,
    isAdmin,
    isMember,
    tenants,
    users,
    login,
    logout,
    addMember,
    updateMember,
    deleteMember,
    getTenantById,
    resetUsersToJSON
  }
}
