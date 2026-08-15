<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import UserSidebar from '../../components/layout/UserSidebar.vue'
import { RouterLink } from 'vue-router'
import { useAuth } from '../../composables/useAuth'
import { useDataStore } from '../../composables/useDataStore'

const { currentUser } = useAuth()
const {
  cmsSettings,
  complaints,
  payments,
  rooms,
  getRoomById,
  getBuildingName,
  getActiveRentalByMemberId,
  getRentalsByMemberId,
  getPaymentsByMemberId,
  isRoomBookedByOthers,
  getTenantStayStatus,
  setExtensionIntent,
  createRoomTransferRequest,
  cancelRoomTransferRequest,
  getActivePendingTransferRequest
} = useDataStore()

const stayStatus = computed(() => {
  if (!currentUser.value?.id) return { hasActiveStay: false, isUpcomingOnly: false, upcomingRental: null }
  return getTenantStayStatus(currentUser.value.id)
})

const isUpcomingOnly = computed(() => stayStatus.value.isUpcomingOnly)
const upcomingRental = computed(() => stayStatus.value.upcomingRental)

const currentRental = computed(() => {
  if (!currentUser.value?.id) return undefined
  if (isUpcomingOnly.value && upcomingRental.value) return upcomingRental.value
  return getActiveRentalByMemberId(currentUser.value.id)
})

const handleChooseIntent = (intent: 'extend' | 'not_extend' | 'pending') => {
  if (currentRental.value) {
    setExtensionIntent(currentRental.value.id, intent)
  }
}

const currentRoom = computed(() => {
  return currentRental.value ? getRoomById(currentRental.value.roomId) : undefined
})

const isRoomAlreadyBooked = computed(() => {
  if (!currentRental.value?.roomId || !currentRental.value?.endDate) return false
  return isRoomBookedByOthers(currentRental.value.roomId, currentRental.value.id, currentRental.value.endDate)
})

// Logika Pindah Kamar (Pengajuan ke Pemilik Kost, Tipe Sama, Rp 0)
const isTransferModalOpen = ref(false)
const selectedTargetRoomId = ref('')
const transferReason = ref('')
const transferNotice = ref<{ type: 'success' | 'error' | ''; text: string }>({ type: '', text: '' })

const activePendingTransfer = computed(() => {
  if (!currentUser.value?.id) return undefined
  return getActivePendingTransferRequest(currentUser.value.id)
})

const canRequestRoomTransfer = computed(() => {
  if (isUpcomingOnly.value) return false
  if (currentRental.value?.extensionIntent === 'not_extend') return false
  return currentRental.value?.status === 'active'
})

const sameTypeAvailableRooms = computed(() => {
  if (!currentRoom.value) return []
  return rooms.value.filter(r => 
    r.typeId === currentRoom.value?.typeId && 
    r.id !== currentRoom.value?.id && 
    r.status === 'available'
  )
})

const openTransferModal = () => {
  isTransferModalOpen.value = true
  transferNotice.value = { type: '', text: '' }
  selectedTargetRoomId.value = sameTypeAvailableRooms.value[0]?.id || ''
  transferReason.value = ''
}

const closeTransferModal = () => {
  isTransferModalOpen.value = false
}

const handleExecuteTransfer = () => {
  if (!currentUser.value?.id || !currentRental.value?.id || !currentRoom.value?.id || !selectedTargetRoomId.value) {
    alert('Mohon pilih kamar tujuan pindah.')
    return
  }

  const res = createRoomTransferRequest({
    memberId: currentUser.value.id,
    rentalId: currentRental.value.id,
    currentRoomId: currentRoom.value.id,
    targetRoomId: selectedTargetRoomId.value,
    reason: transferReason.value
  })

  if (res.success) {
    transferNotice.value = { type: 'success', text: res.message }
    setTimeout(() => {
      closeTransferModal()
    }, 2500)
  } else {
    transferNotice.value = { type: 'error', text: res.message }
  }
}

const handleCancelTransfer = () => {
  if (!activePendingTransfer.value) return
  if (confirm('Batalkan pengajuan pindah kamar Anda?')) {
    const res = cancelRoomTransferRequest(activePendingTransfer.value.id)
    if (res.success) {
      transferNotice.value = { type: 'success', text: res.message }
      setTimeout(() => {
        closeTransferModal()
      }, 1500)
    }
  }
}

const userName = computed(() => currentUser.value?.name || '')
const roomNumber = computed(() => currentRoom.value ? `Kamar ${currentRoom.value.number}` : '')
const roomType = computed(() => currentRoom.value?.typeName || '')
const building = computed(() => currentRoom.value ? getBuildingName(currentRoom.value.buildingId) : '')
const monthlyRent = computed(() => currentRoom.value?.price1Month || currentRoom.value?.price || 0)

// Ambil kontrak sewa paling akhir (termasuk perpanjangan yang sudah dibayar lunas / terdaftar)
const latestActiveRental = computed(() => {
  if (!currentUser.value?.id) return undefined
  const memberRents = getRentalsByMemberId(currentUser.value.id).filter(r => r.status !== 'cancelled')
  if (memberRents.length === 0) return undefined
  return memberRents.slice().sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())[0]
})

// Jika perpanjangan sewa sudah dibayar/terdaftar, countdown timer menghitung s.d. akhir periode perpanjangan!
const targetDateStr = computed(() => {
  if (isUpcomingOnly.value && upcomingRental.value) {
    return upcomingRental.value.startDate
  }
  if (hasPaidExtension.value && latestActiveRental.value) {
    return latestActiveRental.value.endDate
  }
  return currentRental.value?.endDate || ''
})

const formatDateIndo = (dateStr?: string) => {
  if (!dateStr) return '-'
  const parts = dateStr.split('-')
  if (parts.length !== 3) return dateStr
  const [yearStr, monthStr, dayStr] = parts
  if (!yearStr || !monthStr || !dayStr) return dateStr
  const monthsIndo = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des']
  const day = parseInt(dayStr, 10)
  const monthIdx = parseInt(monthStr, 10) - 1
  return `${day} ${monthsIndo[monthIdx] || ''} ${yearStr}`
}

const targetDateFormatted = computed(() => {
  return formatDateIndo(targetDateStr.value)
})

const paymentDueDateStr = computed(() => {
  if (!currentRental.value?.endDate) return 'H-1 Selesai Sewa'
  const d = new Date(currentRental.value.endDate)
  if (isNaN(d.getTime())) return currentRental.value.endDate
  d.setDate(d.getDate() - 1)
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
})
const daysLeft = ref(0)
const hoursLeft = ref(0)
const minutesLeft = ref(0)
const secondsLeft = ref(0)
let timer: any = null

const updateCountdown = () => {
  const target = new Date(`${targetDateStr.value}T23:59:59`).getTime()
  const now = new Date().getTime()
  const distance = target - now

  if (distance < 0) {
    daysLeft.value = 0
    hoursLeft.value = 0
    minutesLeft.value = 0
    secondsLeft.value = 0
    return
  }

  daysLeft.value = Math.floor(distance / (1000 * 60 * 60 * 24))
  hoursLeft.value = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  minutesLeft.value = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
  secondsLeft.value = Math.floor((distance % (1000 * 60)) / 1000)
}

const currentDateFormatted = computed(() => {
  const now = new Date()
  return now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
})

// User Complaints & Payments
const myComplaints = computed(() => {
  const memberId = currentUser.value?.id || 'MBR-01'
  return complaints.value.filter(c => c.memberId === memberId)
})

const activeComplaintsCount = computed(() => {
  return myComplaints.value.filter(c => c.status !== 'resolved').length
})

const myPayments = computed(() => {
  if (!currentUser.value?.id) return []
  return getPaymentsByMemberId(currentUser.value.id)
})

// Cek apakah perpanjangan sewa sudah lunas / kontrak perpanjangan sudah terdaftar aktif
const hasPaidExtension = computed(() => {
  if (!currentRental.value || !currentUser.value?.id) return false
  const memberRents = getRentalsByMemberId(currentUser.value.id)
  
  // 1. Cek apakah ada kontrak rental lanjutan (startDate >= currentRental.endDate)
  const hasFutureRental = memberRents.some(r => 
    r.id !== currentRental.value?.id && 
    new Date(r.startDate) >= new Date(currentRental.value!.endDate) && 
    r.status !== 'cancelled'
  )
  if (hasFutureRental) return true

  // 2. Atau ada transaksi pembayaran berstatus 'paid' untuk perpanjangan sewa
  const userPaidPayments = myPayments.value.filter(p => p.status === 'paid')
  return userPaidPayments.some(p => p.period.toLowerCase().includes('perpanjang'))
})

const isHMinus1Month = computed(() => {
  if (isUpcomingOnly.value) return false
  // Jika perpanjangan sudah lunas/terdaftar, banner urgensi perpanjangan sewa tidak akan muncul
  if (hasPaidExtension.value) return false
  return daysLeft.value <= 31
})

const formatRupiah = (val: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)
}

const waLink = computed(() => {
  const phone = cmsSettings.value.contactPhone ? cmsSettings.value.contactPhone.replace(/[^0-9]/g, '') : '62895378020456'
  return `https://wa.me/${phone}`
})

onMounted(() => {
  updateCountdown()
  timer = setInterval(updateCountdown, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <div class="dashboard-page">
    <UserSidebar />

    <main class="main-content">
      <!-- HEADER -->
      <header class="top-header">
        <div class="header-greeting">
          <h1>Selamat Datang, {{ userName }}! 👋</h1>
          <p>Berikut ringkasan status hunian & tagihan kost Anda</p>
        </div>
        <div class="header-date">
          <i class='bx bx-calendar'></i>
          <span>{{ currentDateFormatted }}</span>
        </div>
      </header>

      <!-- PAGE CONTENT -->
      <div class="page-body container-fluid">
        <!-- H-1 MONTH INTERACTIVE RENEWAL INQUIRY BANNER -->
        <div v-if="isHMinus1Month" class="bill-urgency-banner" :class="currentRental?.extensionIntent">
          <div class="urgency-icon">
            <i v-if="currentRental?.extensionIntent === 'not_extend'" class='bx bx-calendar-x' style="color: #D97706;"></i>
            <i v-else-if="currentRental?.extensionIntent === 'extend'" class='bx bx-check-shield' style="color: #16A34A;"></i>
            <i v-else class='bx bxs-bell-ring bx-tada'></i>
          </div>
          <div class="urgency-content">
            <template v-if="currentRental?.extensionIntent === 'not_extend'">
              <template v-if="isRoomAlreadyBooked">
                <h3>🔒 Kamar Telah Direservasi Calon Penyewa Baru (Checkout {{ targetDateFormatted }})</h3>
                <p>Kamar <strong>{{ roomNumber }}</strong> Anda telah direservasi oleh calon penyewa baru untuk periode mulai <strong>{{ targetDateFormatted }}</strong>. Sesuai konfirmasi sebelumnya, masa sewa Anda berakhir pada tanggal tersebut dan perpanjangan sewa tidak dapat dilakukan lagi.</p>
              </template>
              <template v-else>
                <h3>🗓️ Konfirmasi Selesai Sewa: Checkout {{ targetDateFormatted }}</h3>
                <p>Terima kasih telah memberitahukan kami. Kamar <strong>{{ roomNumber }}</strong> Anda dijadwalkan selesai sewa pada <strong>{{ targetDateFormatted }}</strong> dan dibuka untuk reservasi calon penyewa baru mulai tanggal tersebut.</p>
              </template>
            </template>
            <template v-else-if="currentRental?.extensionIntent === 'extend'">
              <h3>🎉 Konfirmasi Perpanjangan Sewa Diproses</h3>
              <p>Terima kasih telah memilih lanjut tinggal di Sekar Space! Silakan selesaikan pembayaran tagihan perpanjangan sewa sebesar <strong>{{ formatRupiah(monthlyRent) }}</strong> agar kontrak sewa Anda otomatis diperpanjang.</p>
            </template>
            <template v-else>
              <h3>⚠️ Konfirmasi Rencana Perpanjangan Sewa (H-{{ daysLeft }} Hari)</h3>
              <p>Masa sewa {{ roomNumber }} Anda akan berakhir pada <strong>{{ targetDateFormatted }}</strong> (Sisa {{ daysLeft }} hari). Apakah Anda berencana untuk memperpanjang sewa kost di Sekar Space?</p>
            </template>
          </div>

          <div class="urgency-action-wrap">
            <template v-if="currentRental?.extensionIntent === 'not_extend'">
              <button v-if="!isRoomAlreadyBooked" class="btn btn-ghost btn-sm" @click="handleChooseIntent('pending')">
                <i class='bx bx-undo'></i> Ubah Keputusan
              </button>
              <span v-else class="locked-pill">
                <i class='bx bx-lock-alt'></i> Sudah Direservasi Orang Lain
              </span>
              <a :href="waLink" target="_blank" rel="noopener" class="btn btn-outline-wa btn-sm">
                <i class='bx bxl-whatsapp'></i> Hubungi Pengelola
              </a>
            </template>
            <template v-else-if="currentRental?.extensionIntent === 'extend'">
              <RouterLink to="/user/payments" class="btn-pay-now">
                <i class='bx bxs-wallet'></i> Bayar Tagihan Sekarang
              </RouterLink>
              <button class="btn btn-ghost btn-sm" @click="handleChooseIntent('pending')">
                <i class='bx bx-undo'></i> Ubah
              </button>
            </template>
            <template v-else>
              <button class="btn-intent-extend" @click="handleChooseIntent('extend')">
                <i class='bx bx-check-circle'></i> Ya, Perpanjang Sewa
              </button>
              <button class="btn-intent-not-extend" @click="handleChooseIntent('not_extend')">
                <i class='bx bx-log-out-circle'></i> Tidak Perpanjang
              </button>
            </template>
          </div>
        </div>

        <!-- COUNTDOWN BANNER -->
        <section class="countdown-card">
          <div class="countdown-header">
            <div>
              <h2 v-if="isUpcomingOnly"><i class='bx bx-time-five'></i> Masa Tunggu Masuk Kost</h2>
              <h2 v-else><i class='bx bx-time-five'></i> Masa Sewa Kamar Anda</h2>
              <p v-if="isUpcomingOnly">
                Sisa waktu menuju hari pertama sewa {{ roomNumber }} ({{ roomType }}) (Mulai <strong>{{ targetDateFormatted }}</strong>)
              </p>
              <p v-else-if="hasPaidExtension">
                Sisa waktu sewa {{ roomNumber }} ({{ roomType }}) aktif hingga perpanjangan selesai (s.d. <strong>{{ targetDateFormatted }}</strong>)
              </p>
              <p v-else>
                Sisa waktu sewa {{ roomNumber }} ({{ roomType }}) sebelum perpanjangan (s.d. <strong>{{ targetDateFormatted }}</strong>)
              </p>
            </div>
            <span v-if="isUpcomingOnly" class="status-badge badge-upcoming"><i class='bx bx-calendar-event'></i> Akan Datang</span>
            <span v-else class="status-badge badge-active"><i class='bx bx-check-circle'></i> {{ hasPaidExtension ? 'Perpanjangan Aktif' : 'Aktif' }}</span>
          </div>

          <div class="countdown-grid">
            <div class="time-box">
              <span class="time-value">{{ daysLeft }}</span>
              <span class="time-label">Hari</span>
            </div>
            <div class="time-separator">:</div>
            <div class="time-box">
              <span class="time-value">{{ hoursLeft < 10 ? '0' + hoursLeft : hoursLeft }}</span>
              <span class="time-label">Jam</span>
            </div>
            <div class="time-separator">:</div>
            <div class="time-box">
              <span class="time-value">{{ minutesLeft < 10 ? '0' + minutesLeft : minutesLeft }}</span>
              <span class="time-label">Menit</span>
            </div>
            <div class="time-separator">:</div>
            <div class="time-box">
              <span class="time-value">{{ secondsLeft < 10 ? '0' + secondsLeft : secondsLeft }}</span>
              <span class="time-label">Detik</span>
            </div>
          </div>
        </section>

        <!-- DASHBOARD METRICS GRID -->
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-icon icon-primary"><i class='bx bxs-wallet'></i></div>
            <div class="metric-info">
              <span v-if="isUpcomingOnly">Status Sewa Awal</span>
              <span v-else>Tagihan Sewa Bulanan</span>
              <h3>{{ formatRupiah(monthlyRent) }}</h3>
              <span v-if="isUpcomingOnly" class="metric-sub sub-success">
                <i class='bx bx-check-double'></i> Lunas (Mulai {{ targetDateFormatted }})
              </span>
              <span v-else-if="currentRental?.extensionIntent === 'not_extend'" class="metric-sub sub-not-extend">
                <i class='bx bx-calendar-x'></i> Selesai Sewa (Checkout {{ targetDateFormatted }})
              </span>
              <span v-else-if="!hasPaidExtension" class="metric-sub sub-warning">Batas Bayar: {{ paymentDueDateStr }}</span>
              <span v-else class="metric-sub sub-success"><i class='bx bx-check-double'></i> Lunas s.d. {{ targetDateFormatted }}</span>
            </div>
            <RouterLink to="/user/payments" class="metric-action btn btn-ghost">
              {{ isUpcomingOnly ? 'Riwayat Bayar' : (currentRental?.extensionIntent === 'not_extend' ? 'Lihat Status' : (!hasPaidExtension ? 'Bayar Sekarang' : 'Riwayat Bayar')) }}
            </RouterLink>
          </div>

          <div class="metric-card">
            <div class="metric-icon icon-warning"><i class='bx bxs-message-square-error'></i></div>
            <div class="metric-info">
              <span>Keluhan Aktif</span>
              <h3>{{ activeComplaintsCount }} Pengaduan</h3>
              <span class="metric-sub sub-info">Total {{ myComplaints.length }} Pengaduan diajukan</span>
            </div>
            <RouterLink to="/user/complaints" class="metric-action btn btn-ghost">Lihat Status</RouterLink>
          </div>

          <div class="metric-card">
            <div class="metric-icon icon-success"><i class='bx bxs-home-heart'></i></div>
            <div class="metric-info">
              <span>Informasi Kamar</span>
              <h3>{{ roomNumber }}</h3>
              <span v-if="activePendingTransfer" class="metric-sub sub-warning">
                <i class='bx bx-time-five'></i> Menunggu Persetujuan Pindah (Ke Kamar {{ getRoomById(activePendingTransfer.targetRoomId)?.number }})
              </span>
              <span v-else class="metric-sub">{{ building }} · {{ roomType }}</span>
            </div>
            <button 
              v-if="activePendingTransfer" 
              class="metric-action btn btn-ghost" 
              @click="openTransferModal"
            >
              <i class='bx bx-time-five'></i> Status Pengajuan
            </button>
            <button 
              v-else-if="canRequestRoomTransfer" 
              class="metric-action btn btn-ghost" 
              @click="openTransferModal"
            >
              <i class='bx bx-transfer-alt'></i> Pindah Kamar
            </button>
            <button 
              v-else-if="currentRental?.extensionIntent === 'not_extend'"
              class="metric-action btn btn-ghost disabled-transfer" 
              disabled
              title="Pindah kamar tidak tersedia bagi penyewa yang memilih tidak melanjutkan sewa"
            >
              <i class='bx bx-lock-alt'></i> Pindah Kamar (Terkunci)
            </button>
            <RouterLink v-else to="/rooms" class="metric-action btn btn-ghost">
              Lihat Kamar
            </RouterLink>
          </div>
        </div>

        <!-- TWO COLUMN SECTION -->
        <div class="dashboard-columns">
          <!-- ANNOUNCEMENTS & RULES -->
          <div class="dashboard-box">
            <div class="box-header">
              <h2><i class='bx bxs-megaphone'></i> Pengumuman Kost</h2>
            </div>
            <div class="announcement-list">
              <div class="announcement-item">
                <div class="announcement-date">Pengumuman Terkini</div>
                <h4>{{ cmsSettings.heroBadgeText || 'Pengumuman Kost Muslimah Sekar Wangi' }}</h4>
                <p>{{ cmsSettings.announcementBarText || 'Mohon selalu menjaga kebersihan dan ketertiban bersama.' }}</p>
              </div>
            </div>
          </div>

          <!-- QUICK LINKS / CONTACT MANAGER -->
          <div class="dashboard-box">
            <div class="box-header">
              <h2><i class='bx bxs-user-voice'></i> Bantuan & Pengelola</h2>
            </div>
            <div class="manager-card">
              <div class="manager-info">
                <div class="manager-avatar">SW</div>
                <div class="manager-text">
                  <h4>Pengelola Sekar Space</h4>
                  <span>{{ cmsSettings.contactPhone || '+62 895-3780-20456' }}</span>
                </div>
              </div>
              <p class="manager-desc">Memiliki pertanyaan seputar hunian, tagihan sewa, atau pengaduan fasilitas?</p>
              <a :href="waLink" target="_blank" rel="noopener" class="btn btn-primary wa-btn">
                <i class='bx bxl-whatsapp'></i> Chat WhatsApp Pengelola
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- MODAL PINDAH KAMAR -->
    <div v-if="isTransferModalOpen" class="modal-backdrop" @click.self="closeTransferModal">
      <div class="modal-box transfer-modal-box">
        <button class="modal-close" @click="closeTransferModal"><i class='bx bx-x'></i></button>

        <div class="transfer-modal-header">
          <div class="transfer-icon-badge">
            <i class='bx bx-transfer-alt'></i>
          </div>
          <h3>{{ activePendingTransfer ? 'Status Pengajuan Pindah Kamar' : 'Formulir Pindah Kamar' }}</h3>
          <p>{{ activePendingTransfer ? 'Permohonan Anda sedang dalam proses peninjauan pemilik kost' : 'Pilih unit kamar kosong lain dengan tipe dan tarif sewa yang sama' }}</p>
        </div>

        <div v-if="transferNotice.text" class="alert-box" :class="transferNotice.type">
          <i :class="transferNotice.type === 'success' ? 'bx bx-check-circle' : 'bx bx-error-circle'"></i>
          {{ transferNotice.text }}
        </div>

        <!-- JIKA SUDAH ADA PENGAJUAN PENDING -->
        <div v-if="activePendingTransfer" class="pending-transfer-card">
          <div class="pending-badge-header">
            <span class="badge-pending"><i class='bx bx-time-five'></i> Menunggu Persetujuan Pemilik Kost</span>
            <span class="pending-date">Diajukan: {{ formatDateIndo(activePendingTransfer.requestDate) }}</span>
          </div>

          <div class="transfer-flow-row">
            <div class="flow-card">
              <span class="flow-tag">Kamar Saat Ini</span>
              <h4>Kamar {{ getRoomById(activePendingTransfer.currentRoomId)?.number }}</h4>
              <p>{{ getRoomById(activePendingTransfer.currentRoomId)?.typeName }}</p>
            </div>
            <div class="flow-arrow-icon"><i class='bx bx-right-arrow-alt'></i></div>
            <div class="flow-card target">
              <span class="flow-tag">Kamar Tujuan</span>
              <h4>Kamar {{ getRoomById(activePendingTransfer.targetRoomId)?.number }}</h4>
              <p>{{ getRoomById(activePendingTransfer.targetRoomId)?.typeName }}</p>
            </div>
          </div>

          <div class="pending-meta-list">
            <div class="meta-item">
              <span>Alasan Pindah:</span>
              <strong>{{ activePendingTransfer.reason || 'Tidak ada alasan khusus' }}</strong>
            </div>
            <div class="meta-item">
              <span>Biaya Pindah:</span>
              <strong class="text-free">Rp 0 (Gratis)</strong>
            </div>
          </div>

          <div class="pending-actions-wrap">
            <button type="button" class="btn btn-outline-danger btn-sm" @click="handleCancelTransfer">
              <i class='bx bx-trash'></i> Batalkan Pengajuan
            </button>
            <button type="button" class="btn btn-outline btn-sm" @click="closeTransferModal">Tutup</button>
          </div>
        </div>

        <!-- FORMULIR PENGAJUAN BARU -->
        <div v-else class="transfer-form-body">
          <!-- CURRENT ROOM INFO BOX -->
          <div class="current-room-box">
            <div>
              <span class="box-tag">Kamar Saat Ini</span>
              <h4>Kamar {{ currentRoom?.number }}</h4>
              <p>{{ building }} · {{ roomType }}</p>
            </div>
            <span class="badge-free"><i class='bx bx-badge-check'></i> Bebas Biaya Pindah</span>
          </div>

          <div v-if="sameTypeAvailableRooms.length === 0" class="no-room-notice">
            <i class='bx bx-info-circle'></i>
            <div>
              <strong>Belum Ada Kamar Kosong yang Setipe</strong>
              <p>Saat ini seluruh unit kamar bertipe <strong>{{ roomType }}</strong> sedang terisi. Anda dapat menghubungi pengelola untuk ketersediaan kamar mendatang.</p>
            </div>
          </div>

          <form v-else @submit.prevent="handleExecuteTransfer" class="transfer-form">
            <div class="form-group">
              <label>Pilih Kamar Tujuan <span class="required-star">*</span></label>
              <select v-model="selectedTargetRoomId" class="form-control" required>
                <option value="" disabled>-- Pilih Kamar Tujuan --</option>
                <option v-for="rm in sameTypeAvailableRooms" :key="rm.id" :value="rm.id">
                  Kamar {{ rm.number }} — {{ getBuildingName(rm.buildingId) }}, Lantai {{ rm.floor }}
                </option>
              </select>
              <small class="help-text">Menampilkan unit kamar kosong dengan tipe & tarif sewa yang sama.</small>
            </div>

            <div class="form-group">
              <label>Alasan Pindah Kamar (Opsional)</label>
              <textarea 
                v-model="transferReason" 
                rows="2" 
                class="form-control" 
                placeholder="Contoh: Ingin pindah ke lantai bawah agar dekat area parkir..."
              ></textarea>
            </div>

            <div class="transfer-policy-box">
              <i class='bx bx-info-circle'></i>
              <span>Pengajuan ini akan dikonfirmasi oleh pemilik kost terlebih dahulu sebelum kamar resmi dialihkan di sistem.</span>
            </div>

            <div class="transfer-modal-actions">
              <button type="button" class="btn btn-outline" @click="closeTransferModal">Batal</button>
              <button type="submit" class="btn btn-primary">
                <i class='bx bx-send'></i> Kirim Pengajuan ke Pengelola
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard-page {
  display: flex;
  min-height: 100vh;
  background: var(--off-white);
}

.main-content {
  flex: 1;
  margin-left: 260px;
  padding: 32px;
  min-width: 0;
}

.top-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 28px;
  gap: 16px;
  flex-wrap: wrap;
}

.header-greeting h1 {
  font-size: 1.75rem;
  color: var(--dark);
  margin-bottom: 4px;
  font-weight: 700;
}

.header-greeting p {
  color: var(--text-muted);
  font-size: 0.9rem;
}

.header-date {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--white);
  padding: 8px 16px;
  border-radius: var(--radius-full);
  border: 1px solid var(--border);
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--primary);
  box-shadow: var(--shadow-sm);
}

/* BILL URGENCY BANNER */
.bill-urgency-banner {
  background: #FFFBEB;
  border: 1px solid #FCD34D;
  border-radius: var(--radius-xl);
  padding: 20px 24px;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 4px 15px rgba(245, 158, 11, 0.12);
  flex-wrap: wrap;
}

.bill-urgency-banner.not_extend {
  background: #FFF7ED;
  border-color: #FDBA74;
}

.bill-urgency-banner.extend {
  background: #F0FDF4;
  border-color: #86EFAC;
}

.urgency-icon {
  font-size: 2.4rem;
  color: #D97706;
  display: flex;
  align-items: center;
  justify-content: center;
}

.urgency-content {
  flex: 1;
  min-width: 260px;
}

.urgency-content h3 {
  font-size: 1.08rem;
  color: #92400E;
  margin-bottom: 4px;
  font-weight: 700;
}

.bill-urgency-banner.extend .urgency-content h3 {
  color: #166534;
}

.bill-urgency-banner.not_extend .urgency-content h3 {
  color: #9A3412;
}

.urgency-content p {
  font-size: 0.88rem;
  color: #78350F;
  line-height: 1.5;
}

.bill-urgency-banner.extend .urgency-content p {
  color: #15803D;
}

.bill-urgency-banner.not_extend .urgency-content p {
  color: #C2410C;
}

.urgency-action-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.btn-intent-extend {
  background: #16A34A;
  color: #fff;
  font-weight: 700;
  padding: 9px 16px;
  border-radius: var(--radius-md);
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  transition: all 0.2s ease;
}

.btn-intent-extend:hover {
  background: #15803D;
  transform: translateY(-1px);
}

.btn-intent-not-extend {
  background: var(--white);
  color: #DC2626;
  border: 1px solid #FCA5A5;
  font-weight: 600;
  padding: 9px 16px;
  border-radius: var(--radius-md);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  transition: all 0.2s ease;
}

.btn-intent-not-extend:hover {
  background: #FEF2F2;
  border-color: #DC2626;
}

.btn-pay-now {
  background: #16A34A;
  color: #fff;
  font-weight: 700;
  padding: 9px 16px;
  border-radius: var(--radius-md);
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.btn-pay-now:hover {
  background: #15803D;
  transform: translateY(-1px);
}

.locked-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #FEE2E2;
  color: #DC2626;
  font-size: 0.78rem;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  border: 1px solid #FECACA;
}

.btn-outline-wa {
  background: #25D366;
  color: #fff !important;
  font-weight: 600;
  padding: 8px 14px;
  border-radius: var(--radius-md);
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.82rem;
}

/* COUNTDOWN CARD */
.countdown-card {
  background: linear-gradient(135deg, var(--dark-soft) 0%, var(--primary) 100%);
  color: var(--white);
  border-radius: var(--radius-xl);
  padding: 28px 32px;
  margin-bottom: 28px;
  box-shadow: var(--shadow-lg);
}

.countdown-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  gap: 16px;
  flex-wrap: wrap;
}

.countdown-header h2 {
  color: var(--white);
  font-size: 1.3rem;
  margin-bottom: 4px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
}

.countdown-header p {
  color: var(--secondary-light);
  font-size: 0.88rem;
}

.status-badge {
  padding: 6px 14px;
  border-radius: var(--radius-full);
  font-weight: 700;
  font-size: 0.8rem;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.badge-active {
  background: rgba(34, 197, 94, 0.2);
  color: #86EFAC;
  border: 1px solid rgba(34, 197, 94, 0.4);
}

.badge-upcoming {
  background: rgba(234, 179, 8, 0.2);
  color: #FEF08A;
  border: 1px solid rgba(234, 179, 8, 0.4);
}

.countdown-grid {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
}

.time-box {
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(8px);
  padding: 14px 20px;
  border-radius: var(--radius-lg);
  text-align: center;
  min-width: 84px;
  border: 1px solid rgba(255, 255, 255, 0.18);
}

.time-value {
  display: block;
  font-family: var(--font-heading);
  font-size: 2rem;
  font-weight: 700;
  line-height: 1;
}

.time-label {
  font-size: 0.72rem;
  color: var(--secondary-light);
  text-transform: uppercase;
  margin-top: 4px;
  letter-spacing: 0.5px;
}

.time-separator {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--secondary);
}

/* METRICS GRID */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 28px;
}

.metric-card {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 22px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: all var(--transition-smooth);
  box-shadow: var(--shadow-sm);
}

.metric-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-md);
}

.metric-icon {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  margin-bottom: 14px;
}

.icon-primary { background: var(--tertiary); color: var(--primary); }
.icon-warning { background: var(--warning-bg); color: var(--warning); }
.icon-success { background: var(--success-bg); color: var(--success); }

.metric-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.metric-info span:first-child {
  font-size: 0.82rem;
  color: var(--text-muted);
  display: block;
  font-weight: 500;
}

.metric-info h3 {
  font-size: 1.4rem;
  color: var(--dark);
  margin: 4px 0 6px;
  font-weight: 700;
}

.metric-sub {
  font-size: 0.8rem !important;
  font-weight: 500;
  margin-top: auto;
}

.sub-warning { color: var(--warning) !important; font-weight: 600; }
.sub-info { color: var(--info) !important; }
.sub-not-extend {
  color: #D97706 !important;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-weight: 600;
}
.sub-success { 
  color: #16A34A !important; 
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-weight: 600;
}

.metric-action {
  margin-top: 18px;
  padding: 8px 14px;
  font-size: 0.82rem;
  font-weight: 600;
  width: 100%;
  text-align: center;
  justify-content: center;
}

/* DASHBOARD COLUMNS */
.dashboard-columns {
  display: grid;
  grid-template-columns: 3fr 2fr;
  gap: 20px;
}

.dashboard-box {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 22px;
  box-shadow: var(--shadow-sm);
}

.box-header h2 {
  font-size: 1.1rem;
  color: var(--dark);
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
}

.announcement-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.announcement-item {
  padding-bottom: 14px;
  border-bottom: 1px solid var(--border);
}

.announcement-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.announcement-date {
  font-size: 0.75rem;
  color: var(--primary);
  font-weight: 700;
  margin-bottom: 4px;
}

.announcement-item h4 {
  font-size: 0.95rem;
  color: var(--dark);
  margin-bottom: 4px;
  font-weight: 600;
}

.announcement-item p {
  font-size: 0.85rem;
  color: var(--text-muted);
  line-height: 1.5;
}

.manager-card {
  background: var(--off-white);
  padding: 16px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
}

.manager-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.manager-avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: var(--primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.95rem;
  flex-shrink: 0;
}

.manager-text h4 {
  font-size: 0.92rem;
  color: var(--dark);
  margin-bottom: 2px;
}

.manager-text span {
  font-size: 0.78rem;
  color: var(--text-muted);
}

.manager-desc {
  font-size: 0.84rem;
  color: var(--text-muted);
  margin-bottom: 14px;
  line-height: 1.45;
}

.wa-btn {
  width: 100%;
  font-size: 0.85rem;
  background: #25D366;
  border: none;
  justify-content: center;
  font-weight: 600;
}

.wa-btn:hover {
  background: #20b858;
}

/* TRANSFER MODAL */
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
  max-width: 480px;
  width: 100%;
  padding: 28px;
  position: relative;
  box-shadow: var(--shadow-lg);
}

.modal-close {
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-muted);
  transition: color 0.2s ease;
}

.modal-close:hover {
  color: var(--dark);
}

.transfer-modal-box {
  max-width: 500px;
}

.transfer-modal-header {
  text-align: center;
  margin-bottom: 20px;
}

.transfer-icon-badge {
  width: 52px;
  height: 52px;
  background: var(--tertiary);
  color: var(--primary);
  border-radius: var(--radius-full);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  margin-bottom: 10px;
}

.transfer-modal-header h3 {
  font-size: 1.25rem;
  color: var(--dark);
  margin-bottom: 4px;
  font-weight: 700;
}

.transfer-modal-header p {
  color: var(--text-muted);
  font-size: 0.85rem;
}

.current-room-box {
  background: var(--off-white);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 14px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.current-room-box .box-tag {
  font-size: 0.72rem;
  color: var(--text-muted);
  text-transform: uppercase;
  font-weight: 700;
}

.current-room-box h4 {
  font-size: 0.98rem;
  color: var(--primary);
  margin: 2px 0;
  font-weight: 700;
}

.current-room-box p {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.badge-free {
  background: #DCFCE7;
  color: #16A34A;
  font-weight: 700;
  font-size: 0.78rem;
  padding: 4px 10px;
  border-radius: var(--radius-full);
}

.no-room-notice {
  background: #FFFBEB;
  border: 1px solid #FDE68A;
  border-radius: var(--radius-md);
  padding: 16px;
  display: flex;
  gap: 12px;
  align-items: flex-start;
  color: #92400E;
  font-size: 0.85rem;
}

.no-room-notice i {
  font-size: 1.5rem;
  color: #D97706;
  flex-shrink: 0;
}

.transfer-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.transfer-form .form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
}

.transfer-form label {
  font-size: 0.86rem;
  font-weight: 600;
  color: var(--dark);
  display: block;
  margin-bottom: 2px;
}

.transfer-form .form-control {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #CBD5E1;
  border-radius: var(--radius-md);
  font-family: inherit;
  font-size: 0.88rem;
  background: var(--white);
  color: var(--dark);
  outline: none;
  box-sizing: border-box;
  display: block;
  transition: all 0.2s ease;
}

.transfer-form .form-control:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.12);
}

.transfer-form select.form-control {
  height: 42px;
  cursor: pointer;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 16px;
  padding-right: 36px;
  appearance: none;
}

.transfer-form textarea.form-control {
  resize: vertical;
  min-height: 72px;
  line-height: 1.45;
}

.required-star {
  color: #DC2626;
  font-weight: bold;
}

.help-text {
  font-size: 0.76rem;
  color: var(--text-muted);
  display: block;
  margin-top: 2px;
}

.transfer-policy-box {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  font-size: 0.8rem;
  color: #475569;
  line-height: 1.45;
  background: #F8FAFC;
  padding: 12px 14px;
  border-radius: var(--radius-md);
  border: 1px solid #E2E8F0;
}

.transfer-policy-box i {
  font-size: 1.2rem;
  color: var(--primary);
  flex-shrink: 0;
  margin-top: 1px;
}

.transfer-modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 8px;
}

.disabled-transfer {
  opacity: 0.6;
  cursor: not-allowed !important;
  color: #94A3B8 !important;
}

.alert-box {
  padding: 12px 16px;
  border-radius: var(--radius-md);
  font-size: 0.88rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.alert-box.success {
  background: #DCFCE7;
  color: #16A34A;
}

.alert-box.error {
  background: #FEE2E2;
  color: #DC2626;
}

/* PENDING TRANSFER CARD */
.pending-transfer-card {
  background: var(--off-white);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.pending-badge-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.pending-date {
  font-size: 0.78rem;
  color: var(--text-muted);
}

.transfer-flow-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--white);
  padding: 16px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  gap: 12px;
}

.flow-card {
  flex: 1;
}

.flow-tag {
  font-size: 0.72rem;
  color: var(--text-muted);
  text-transform: uppercase;
  font-weight: 700;
  display: block;
}

.flow-card h4 {
  font-size: 1.1rem;
  color: var(--dark);
  margin: 2px 0;
  font-weight: 700;
}

.flow-card.target h4 {
  color: var(--primary);
}

.flow-card p {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.flow-arrow-icon {
  font-size: 1.8rem;
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.pending-meta-list {
  background: var(--white);
  padding: 14px 16px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 0.85rem;
}

.meta-item {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

.meta-item span {
  color: var(--text-muted);
}

.text-free {
  color: #16A34A;
}

.pending-actions-wrap {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn-outline-danger {
  background: transparent;
  border: 1px solid #EF4444;
  color: #EF4444;
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.btn-outline-danger:hover {
  background: #EF4444;
  color: white;
}

@media (max-width: 992px) {
  .main-content {
    margin-left: 0;
    padding: 20px;
  }
  .metrics-grid {
    grid-template-columns: 1fr;
  }
  .dashboard-columns {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .main-content {
    padding: 16px;
  }
  .top-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 20px;
  }
  .header-greeting h1 {
    font-size: 1.4rem;
  }
  .countdown-card {
    padding: 20px 16px;
    margin-bottom: 20px;
  }
  .countdown-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  .countdown-header h2 {
    font-size: 1.15rem;
  }
  .countdown-grid {
    gap: 6px;
  }
  .time-box {
    min-width: 55px;
    padding: 10px 6px;
  }
  .time-value {
    font-size: 1.3rem;
  }
  .time-separator {
    font-size: 1.2rem;
  }
  .dashboard-box {
    padding: 16px;
  }
}

@media (max-width: 480px) {
  .countdown-grid {
    justify-content: space-between;
    width: 100%;
  }
  .time-box {
    flex: 1;
    min-width: 0;
    padding: 8px 4px;
  }
  .time-value {
    font-size: 1.1rem;
  }
  .time-label {
    font-size: 0.65rem;
  }
  .time-separator {
    display: none;
  }
}
</style>
