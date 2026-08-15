<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import AdminSidebar from '../../components/layout/AdminSidebar.vue'
import { useDataStore, getRoomPriceByDuration, calculateRoomPrice, type PaymentData } from '../../composables/useDataStore'
import { useAuth, type User } from '../../composables/useAuth'

const { payments, addPayment, updatePaymentStatus, rooms, rentals, getRoomById, getBuildingName, updateRoom, getActiveRentalByMemberId, getRentalsByMemberId, getPaymentsByRentalId, getRentalByPayment, getPaymentAmount, updateRental, addRental } = useDataStore()
const { tenants, getTenantById, updateMember } = useAuth()

const getTenantByPayment = (pay: PaymentData) => {
  const rent = rentals.value.find(r => r.id === pay.rentalId)
  if (rent) return getTenantById(rent.memberId)
  return undefined
}

const getTenantName = (pay: PaymentData | string) => {
  if (typeof pay === 'object') {
    const t = getTenantByPayment(pay)
    return t ? t.name : 'Penyewa'
  }
  const tenant = getTenantById(pay)
  return tenant ? tenant.name : 'Penyewa'
}

const getTenantUsername = (pay: PaymentData | string) => {
  if (typeof pay === 'object') {
    const t = getTenantByPayment(pay)
    return t ? `@${t.username}` : ''
  }
  const tenant = getTenantById(pay)
  return tenant ? `@${tenant.username}` : ''
}

const formatWaPhone = (phone?: string) => {
  if (!phone) return '62895378020456'
  let clean = phone.replace(/[^0-9]/g, '')
  if (!clean) return '62895378020456'
  if (clean.startsWith('0')) {
    clean = '62' + clean.slice(1)
  } else if (!clean.startsWith('62')) {
    clean = '62' + clean
  }
  return clean
}

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

const activeTab = ref<'all' | 'pending' | 'paid' | 'rejected' | 'expiring'>('all')
const searchQuery = ref('')
const isInvoiceModalOpen = ref(false)
const isProofModalOpen = ref(false)
const selectedPaymentProof = ref<PaymentData | null>(null)
const noticeMessage = ref('')

const openProofModal = (pay: PaymentData) => {
  selectedPaymentProof.value = pay
  isProofModalOpen.value = true
}

const closeProofModal = () => {
  isProofModalOpen.value = false
  selectedPaymentProof.value = null
}

const getPaymentTenantRoom = (pay: PaymentData | string) => {
  const rentId = typeof pay === 'object' ? pay.rentalId : null
  const rent = rentId ? rentals.value.find(r => r.id === rentId) : (typeof pay === 'string' ? getActiveRentalByMemberId(pay) : null)
  const rm = rent ? getRoomById(rent.roomId) : null
  if (!rm) return 'Kamar Kost'
  return `Kamar ${rm.number} (${getBuildingName(rm.buildingId)})`
}

// Computed list of expiring tenants (H-30 days or less, yang belum lunas perpanjang)
const expiringTenants = computed(() => {
  const now = new Date()
  return tenants.value.map(t => {
    const rent = getActiveRentalByMemberId(t.id)
    let daysLeft = 999
    if (rent && rent.endDate) {
      const end = new Date(rent.endDate)
      if (!isNaN(end.getTime())) {
        const diffTime = end.getTime() - now.getTime()
        daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      }
    }

    // Cek apakah penyewa ini sudah punya kontrak perpanjangan di masa depan yang sudah dibayar lunas
    const memberRents = getRentalsByMemberId(t.id)
    const hasPaidFutureRental = memberRents.some(r => {
      if (r.id === rent?.id) return false
      const isFuture = rent?.endDate ? new Date(r.startDate) >= new Date(rent.endDate) : false
      if (!isFuture || r.status === 'cancelled') return false
      const rPayments = getPaymentsByRentalId(r.id)
      return rPayments.some(p => p.status === 'paid') || r.status === 'active'
    })

    const rm = rent?.roomId ? getRoomById(rent.roomId) : null
    return {
      ...t,
      endDate: rent?.endDate || '',
      daysLeft,
      hasPaidFutureRental,
      room: rm,
      roomNum: rm ? `Kamar ${rm.number}` : 'Kamar A13',
      bldName: rm ? getBuildingName(rm.buildingId) : 'Gedung A',
      typeId: rm?.typeId || 'km-luar'
    }
  }).filter(t => t.daysLeft <= 30 && !t.hasPaidFutureRental)
})

// Form Kirim Tagihan Baru
const formInvoice = ref({
  memberId: tenants.value[0]?.id || 'MBR-01',
  dueDate: '',
  notes: ''
})

const selectedInvoiceRental = computed(() => {
  return getActiveRentalByMemberId(formInvoice.value.memberId)
})

const selectedInvoiceRoom = computed(() => {
  return selectedInvoiceRental.value?.roomId ? getRoomById(selectedInvoiceRental.value.roomId) : null
})

const selectedInvoiceBuildingName = computed(() => {
  return selectedInvoiceRoom.value ? getBuildingName(selectedInvoiceRoom.value.buildingId) : 'Gedung A'
})

const invoiceRoomPrices = computed(() => {
  const rm = selectedInvoiceRoom.value
  return {
    p1: formatRupiah(getRoomPriceByDuration(rm, 1)),
    p3: formatRupiah(getRoomPriceByDuration(rm, 3)),
    p6: formatRupiah(getRoomPriceByDuration(rm, 6)),
    p12: formatRupiah(getRoomPriceByDuration(rm, 12))
  }
})

const updateInvoiceDueDate = () => {
  const rent = selectedInvoiceRental.value
  if (rent?.endDate) {
    formInvoice.value.dueDate = formatDateIndo(rent.endDate)
  } else {
    formInvoice.value.dueDate = 'Sesuai Akhir Masa Sewa'
  }
}

watch(() => formInvoice.value.memberId, () => {
  updateInvoiceDueDate()
})

const filteredPayments = computed(() => {
  let list = payments.value
  if (activeTab.value !== 'all' && activeTab.value !== 'expiring') {
    list = list.filter(p => p.status === activeTab.value)
  }
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(p => getTenantName(p).toLowerCase().includes(q) || p.period.toLowerCase().includes(q))
  }
  return list
})

const openInvoiceModal = (targetMemberId?: string) => {
  if (targetMemberId) {
    formInvoice.value.memberId = targetMemberId
  }
  updateInvoiceDueDate()
  formInvoice.value.notes = ''
  isInvoiceModalOpen.value = true
}

const closeInvoiceModal = () => {
  isInvoiceModalOpen.value = false
}

// H-1 Month Reminder: Sends WhatsApp inquiry with room's custom duration prices
const sendHMinus1MonthReminder = (t: any) => {
  const phone = formatWaPhone(t.phone)
  const rm = t.room ? t.room : (t.roomId ? getRoomById(t.roomId) : null)

  const p1 = formatRupiah(getRoomPriceByDuration(rm, 1))
  const p3 = formatRupiah(getRoomPriceByDuration(rm, 3))
  const p6 = formatRupiah(getRoomPriceByDuration(rm, 6))
  const p12 = formatRupiah(getRoomPriceByDuration(rm, 12))

  const text = `Halo Kak ${t.name}, 👋

Mengingatkan bahwa masa sewa ${t.roomNum} (${t.bldName}) Kakak akan berakhir pada ${t.endDate || '01 September 2026'} (Sisa ${t.daysLeft} Hari).

Apakah Kakak berencana untuk memperpanjang sewa kost di Sekar Space?

📌 Berikut rincian opsi paket sewa jika ingin lanjut:
• 1 Bulan: ${p1}
• 3 Bulan: ${p3}
• 6 Bulan: ${p6}
• 12 Bulan: ${p12}

Mohon beri tahu kami paket durasi mana yang ingin Kakak ambil agar kami dapat menerbitkan tagihan resmi. Terima kasih! 🙏`

  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank')
}

// Action: Submit Invoice and Send WhatsApp
const handleSendInvoice = () => {
  if (!formInvoice.value.memberId) {
    alert('Mohon pilih penyewa.')
    return
  }

  const tenant = getTenantById(formInvoice.value.memberId)
  const rent = selectedInvoiceRental.value
  const rm = selectedInvoiceRoom.value
  const tenantPhone = formatWaPhone(tenant?.phone)
  const tenantName = tenant?.name || 'Penyewa'
  const roomNum = rm ? `Kamar ${rm.number}` : 'Kamar Kost'
  const bldName = selectedInvoiceBuildingName.value
  const dueDateStr = formInvoice.value.dueDate || (rent?.endDate ? formatDateIndo(rent.endDate) : 'Jatuh Tempo')
  const { p1, p3, p6, p12 } = invoiceRoomPrices.value

  const notesSection = formInvoice.value.notes?.trim() ? `\n📝 Catatan Pengelola:\n${formInvoice.value.notes.trim()}\n` : ''

  const waText = `Halo Kak ${tenantName}, 👋

Mengingatkan bahwa masa sewa ${roomNum} (${bldName}) Kakak akan berakhir pada ${dueDateStr}.

📌 Berikut rincian tarif perpanjangan sewa:
• Paket 1 Bulan: ${p1}
• Paket 3 Bulan: ${p3}
• Paket 6 Bulan: ${p6}
• Paket 12 Bulan: ${p12}
${notesSection}
Silakan konfirmasi paket durasi yang ingin Kakak ambil atau lakukan konfirmasi langsung melalui Portal Penyewa Sekar Space. Terima kasih! 🙏`

  const waUrl = `https://wa.me/${tenantPhone}?text=${encodeURIComponent(waText)}`
  window.open(waUrl, '_blank')

  noticeMessage.value = `Pemberitahuan tagihan sewa ke ${tenantName} telah dibuka di WhatsApp!`
  closeInvoiceModal()
  setTimeout(() => {
    noticeMessage.value = ''
  }, 5000)
}

// Action: Confirm Payment & CREATE NEW EXTENSION RENTAL ROW
const handleConfirmPayment = (pay: PaymentData) => {
  updatePaymentStatus(pay.id, 'paid', 'Pembayaran telah diverifikasi & dikonfirmasi LUNAS oleh admin.')

  const currentRent = rentals.value.find(r => r.id === pay.rentalId)
  const tenant = currentRent ? getTenantById(currentRent.memberId) : null

  if (tenant && currentRent) {
    const duration = pay.durationMonths || 1
    const startDate = currentRent.endDate || new Date().toISOString().substring(0, 10)
    
    // Hitung tanggal akhir sewa perpanjangan baru
    const end = new Date(startDate)
    end.setMonth(end.getMonth() + duration)
    const newEndDate = end.toISOString().substring(0, 10)

    // Tambahkan baris perpanjangan sewa baru (History booking tersimpan rapi)
    const newRent = addRental({
      memberId: tenant.id,
      roomId: currentRent.roomId,
      startDate: startDate,
      endDate: newEndDate,
      durationMonths: duration,
      basePrice: getPaymentAmount(pay),
      addonPrice: 0,
      totalAmount: getPaymentAmount(pay),
      addons: currentRent.addons || [],
      status: 'active'
    })
    
    pay.rentalId = newRent.id

    if (currentRent.roomId) {
      updateRoom(currentRent.roomId, { status: 'occupied' })
    }

    noticeMessage.value = `Pembayaran LUNAS! Kontrak perpanjangan sewa ${tenant.name} baru (+${duration} bulan s.d. ${newEndDate}) berhasil ditambahkan ke riwayat sewa.`
  } else {
    noticeMessage.value = `Pembayaran ${pay.period} telah dikonfirmasi LUNAS!`
  }

  setTimeout(() => {
    noticeMessage.value = ''
  }, 5000)
}

const handleRejectPayment = (pay: PaymentData) => {
  const reason = prompt('Alasan penolakan konfirmasi pembayaran:', 'Bukti transfer tidak terbaca / nominal belum masuk.')
  if (reason !== null) {
    updatePaymentStatus(pay.id, 'rejected', reason)
    noticeMessage.value = `Pembayaran ${pay.period} oleh ${getTenantName(pay)} telah ditolak.`
    setTimeout(() => {
      noticeMessage.value = ''
    }, 4000)
  }
}

const getWaBillLink = (pay: PaymentData) => {
  const tenant = getTenantByPayment(pay)
  const phone = formatWaPhone(tenant?.phone)
  const name = tenant?.name || 'Penyewa'
  const rent = getRentalByPayment(pay)
  const rm = rent?.roomId ? getRoomById(rent.roomId) : null
  const bldName = rm ? getBuildingName(rm.buildingId) : 'Kost Sekar Space'
  const roomNum = rm ? `Kamar ${rm.number}` : ''
  const dueDateStr = rent?.endDate ? formatDateIndo(rent.endDate) : (pay.dueDate || 'Jatuh Tempo')

  const p1 = formatRupiah(getRoomPriceByDuration(rm, 1))
  const p3 = formatRupiah(getRoomPriceByDuration(rm, 3))
  const p6 = formatRupiah(getRoomPriceByDuration(rm, 6))
  const p12 = formatRupiah(getRoomPriceByDuration(rm, 12))

  const text = `Halo Kak ${name}, 👋

Mengingatkan bahwa masa sewa ${roomNum ? roomNum + ' (' + bldName + ')' : 'Kost Sekar Space'} Anda akan berakhir pada ${dueDateStr}.

📌 Rincian Pilihan Paket Sewa:
• Paket 1 Bulan: ${p1}
• Paket 3 Bulan: ${p3}
• Paket 6 Bulan: ${p6}
• Paket 12 Bulan: ${p12}

Silakan konfirmasi pilihan paket sewa Anda melalui Portal Penyewa Sekar Space. Terima kasih! 🙏`

  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
}

const formatRupiah = (val: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)
}
</script>

<template>
  <div class="admin-page">
    <AdminSidebar />

    <main class="admin-main">
      <header class="admin-header">
        <div>
          <span class="header-tag">Financials Console</span>
          <h1>Kelola <span class="text-gradient">Tagihan & Konfirmasi Pembayaran</span></h1>
          <p>Kirimkan tagihan sewa bulanan via WhatsApp dan verifikasi bukti bayar dari para penyewa kost.</p>
        </div>
        <button class="btn btn-primary" @click="() => openInvoiceModal()">
          <i class='bx bx-paper-plane'></i> Terbitkan Tagihan Baru
        </button>
      </header>

      <!-- NOTICE ALERT -->
      <div v-if="noticeMessage" class="notice-alert">
        <i class='bx bx-check-circle'></i> {{ noticeMessage }}
      </div>

      <!-- FILTER TABS & SEARCH BAR -->
      <div class="control-bar">
        <div class="filter-tabs">
          <button 
            class="tab-pill" 
            :class="{ active: activeTab === 'all' }"
            @click="activeTab = 'all'"
          >
            Semua Transaksi ({{ payments.length }})
          </button>
          <button 
            class="tab-pill" 
            :class="{ active: activeTab === 'pending' }"
            @click="activeTab = 'pending'"
          >
            Perlu Konfirmasi ({{ payments.filter(p => p.status === 'pending').length }})
          </button>
          <button 
            class="tab-pill" 
            :class="{ active: activeTab === 'paid' }"
            @click="activeTab = 'paid'"
          >
            Lunas ({{ payments.filter(p => p.status === 'paid').length }})
          </button>
          <button 
            class="tab-pill" 
            :class="{ active: activeTab === 'rejected' }"
            @click="activeTab = 'rejected'"
          >
            Ditolak ({{ payments.filter(p => p.status === 'rejected').length }})
          </button>
          <button 
            class="tab-pill tab-expiring" 
            :class="{ active: activeTab === 'expiring' }"
            @click="activeTab = 'expiring'"
          >
            ⚠️ Hampir Habis Sewa ({{ expiringTenants.length }})
          </button>
        </div>

        <div class="search-box">
          <i class='bx bx-search'></i>
          <input 
            type="text" 
            v-model="searchQuery" 
            placeholder="Cari nama penyewa atau bulan..."
          />
        </div>
      </div>

      <!-- TABLE CONTAINER -->
      <div class="admin-card">
        <!-- EXPIRING TENANTS VIEW TABLE -->
        <div v-if="activeTab === 'expiring'" class="table-wrapper">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Penyewa</th>
                <th>Kamar & Gedung</th>
                <th>Jatuh Tempo Sewa</th>
                <th>Sisa Waktu</th>
                <th>Aksi Admin</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="t in expiringTenants" :key="t.id">
                <td>
                  <strong>{{ t.name }}</strong>
                  <div class="text-xs text-muted"><i class='bx bxl-whatsapp'></i> {{ t.phone }}</div>
                </td>
                <td>
                  <span class="chip-room">{{ t.roomNum }}</span>
                  <div class="text-xs text-muted">{{ t.bldName }}</div>
                </td>
                <td>{{ t.endDate || '01 Sep 2026' }}</td>
                <td>
                  <span class="status-pill" :class="t.daysLeft <= 7 ? 'rejected' : 'pending'">
                    <i class='bx bx-time'></i> Sisa {{ t.daysLeft }} Hari ({{ t.daysLeft <= 7 ? 'H-Seminggu' : 'H-1 Bulan' }})
                  </span>
                </td>
                <td>
                  <div class="action-buttons">
                    <!-- H-1 Month Reminder button (Inquiry option list) -->
                    <button class="btn-action btn-wa-send" @click="sendHMinus1MonthReminder(t)" title="Kirim Opsi Perpanjangan via WA">
                      <i class='bx bxl-whatsapp'></i> Kirim Reminder WA
                    </button>
                    <!-- Kirim Tagihan Sewa (Pre-fills invoice modal for this member) -->
                    <button class="btn-action btn-confirm" @click="() => openInvoiceModal(t.id)" title="Terbitkan Tagihan Sewa">
                      <i class='bx bx-paper-plane'></i> Kirim Tagihan
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="expiringTenants.length === 0">
                <td colspan="5" class="empty-cell">Tidak ada penyewa yang mendekati jatuh tempo sewa (H-30 Hari).</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- TRANSACTIONS VIEW TABLE (CONCISE & COMPACT) -->
        <div v-else class="table-wrapper">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Penyewa</th>
                <th>Rincian Tagihan & Tanggal</th>
                <th>Nominal</th>
                <th>Status</th>
                <th>Aksi Admin</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="pay in filteredPayments" :key="pay.id">
                <td>
                  <strong>{{ getTenantName(pay) }}</strong>
                  <div class="sub-tenant-info">{{ getTenantUsername(pay) }}</div>
                </td>
                <td>
                  <strong class="pay-period-title">{{ pay.period }}</strong>
                  <div class="pay-sub-meta">
                    <span><i class='bx bx-calendar'></i> {{ formatDateIndo(pay.date) }}</span>
                    <span v-if="pay.method">· {{ pay.method }}</span>
                  </div>
                </td>
                <td>
                  <strong class="price-amount">{{ formatRupiah(getPaymentAmount(pay)) }}</strong>
                </td>
                <td>
                  <span 
                    class="status-pill"
                    :class="pay.status"
                  >
                    {{ pay.status === 'paid' ? 'Lunas' : pay.status === 'pending' ? 'Verifikasi' : 'Ditolak' }}
                  </span>
                </td>
                <td>
                  <div class="action-buttons">
                    <!-- Tombol Lihat Bukti Transfer -->
                    <button class="btn-action btn-proof-view" @click="openProofModal(pay)" title="Lihat Bukti Transfer Pembayaran">
                      <i class='bx bx-receipt'></i> Bukti
                    </button>
                    <a :href="getWaBillLink(pay)" target="_blank" rel="noopener" class="btn-action btn-wa-send" title="Kirim Pesan Tagihan via WA">
                      <i class='bx bxl-whatsapp'></i> WA
                    </a>
                    <template v-if="pay.status === 'pending'">
                      <button class="btn-action btn-confirm" @click="handleConfirmPayment(pay)" title="Konfirmasi Pembayaran Lunas">
                        <i class='bx bx-check-circle'></i> Setujui
                      </button>
                      <button class="btn-action btn-reject" @click="handleRejectPayment(pay)" title="Tolak Pembayaran Ini">
                        <i class='bx bx-x-circle'></i> Tolak
                      </button>
                    </template>
                  </div>
                </td>
              </tr>
              <tr v-if="filteredPayments.length === 0">
                <td colspan="5" class="empty-cell">Tidak ada data transaksi pembayaran yang ditemukan.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>

    <!-- MODAL KIRIM TAGIHAN BARU -->
    <div v-if="isInvoiceModalOpen" class="modal-backdrop" @click.self="closeInvoiceModal">
      <div class="modal-box">
        <button class="modal-close" @click="closeInvoiceModal"><i class='bx bx-x'></i></button>

        <div class="modal-header">
          <h2><i class='bx bx-paper-plane'></i> Kirim Tagihan Sewa ke WhatsApp</h2>
          <p>Kirimkan rincian tarif perpanjangan sewa dan tanggal jatuh tempo langsung ke penyewa</p>
        </div>

        <form @submit.prevent="handleSendInvoice" class="invoice-form">
          <div class="form-group">
            <label>Pilih Penyewa</label>
            <select v-model="formInvoice.memberId" class="form-control" required>
              <option v-for="t in tenants" :key="t.id" :value="t.id">
                {{ t.name }} (@{{ t.username }})
              </option>
            </select>
          </div>

          <!-- INFO UNIT KAMAR & TANGGAL SELESAI -->
          <div class="invoice-tenant-summary" v-if="selectedInvoiceRoom">
            <div class="summary-item">
              <span class="summary-label">Kamar Ditempati</span>
              <strong>Kamar {{ selectedInvoiceRoom.number }} ({{ selectedInvoiceBuildingName }})</strong>
              <small>{{ selectedInvoiceRoom.typeName }}</small>
            </div>
            <div class="summary-item">
              <span class="summary-label">Akhir Masa Sewa</span>
              <strong class="text-danger">{{ selectedInvoiceRental?.endDate ? formatDateIndo(selectedInvoiceRental.endDate) : '-' }}</strong>
              <small>Status: {{ selectedInvoiceRental?.extensionIntent === 'extend' ? 'Lanjut Sewa' : selectedInvoiceRental?.extensionIntent === 'not_extend' ? 'Tidak Lanjut' : 'Menunggu Konfirmasi' }}</small>
            </div>
          </div>

          <div class="form-group">
            <label>Tenggat Jatuh Tempo</label>
            <input type="text" v-model="formInvoice.dueDate" class="form-control" placeholder="Contoh: 15 September 2026" required />
            <small class="text-muted">Secara otomatis menyesuaikan dengan tanggal berakhirnya sewa penyewa</small>
          </div>

          <!-- RINCIAN BIAYA KAMAR (OTOMATIS 1, 3, 6, 12 BULAN) -->
          <div class="form-group">
            <label>Rincian Tarif Sewa Kamar (Disertakan di Pesan WA)</label>
            <div class="pricing-grid-preview">
              <div class="price-pill-card">
                <span>1 Bulan</span>
                <strong>{{ invoiceRoomPrices.p1 }}</strong>
              </div>
              <div class="price-pill-card">
                <span>3 Bulan</span>
                <strong>{{ invoiceRoomPrices.p3 }}</strong>
              </div>
              <div class="price-pill-card">
                <span>6 Bulan</span>
                <strong>{{ invoiceRoomPrices.p6 }}</strong>
              </div>
              <div class="price-pill-card">
                <span>12 Bulan</span>
                <strong>{{ invoiceRoomPrices.p12 }}</strong>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label>Catatan Tambahan (Opsional)</label>
            <textarea v-model="formInvoice.notes" rows="2" class="form-control" placeholder="Tuliskan catatan tambahan jika ada..."></textarea>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-ghost" @click="closeInvoiceModal">Batal</button>
            <button type="submit" class="btn btn-primary btn-whatsapp-submit">
              <i class='bx bxl-whatsapp'></i> Buka WhatsApp & Kirim Pesan
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL LIHAT BUKTI PEMBAYARAN -->
    <div v-if="isProofModalOpen && selectedPaymentProof" class="modal-backdrop" @click.self="closeProofModal">
      <div class="modal-box proof-modal-box">
        <button class="modal-close" @click="closeProofModal"><i class='bx bx-x'></i></button>

        <div class="modal-header">
          <h2><i class='bx bx-receipt'></i> Bukti Transfer Pembayaran</h2>
          <p>Verifikasi rincian dan bukti transfer yang diunggah oleh penyewa</p>
        </div>

        <div class="proof-modal-body">
          <div class="proof-info-summary">
            <div class="proof-info-row">
              <span>Penyewa:</span>
              <strong>{{ getTenantName(selectedPaymentProof) }} ({{ getPaymentTenantRoom(selectedPaymentProof) }})</strong>
            </div>
            <div class="proof-info-row">
              <span>Rincian Tagihan:</span>
              <strong>{{ selectedPaymentProof.period }}</strong>
            </div>
            <div class="proof-info-row">
              <span>Metode & Tanggal:</span>
              <strong>{{ selectedPaymentProof.method || 'Transfer Bank' }} · {{ formatDateIndo(selectedPaymentProof.date) }}</strong>
            </div>
            <div class="proof-info-row">
              <span>Nominal Transfer:</span>
              <strong class="proof-price-highlight">{{ formatRupiah(getPaymentAmount(selectedPaymentProof)) }}</strong>
            </div>
            <div class="proof-info-row">
              <span>Status Pembayaran:</span>
              <span class="status-pill" :class="selectedPaymentProof.status">
                {{ selectedPaymentProof.status === 'paid' ? 'Lunas' : selectedPaymentProof.status === 'pending' ? 'Perlu Konfirmasi' : 'Ditolak' }}
              </span>
            </div>
          </div>

          <!-- TAMPILAN GAMBAR BUKTI ATAU STRUK DIGITAL -->
          <div class="proof-display-card">
            <div class="proof-card-label">
              <i class='bx bx-image'></i> Dokumen / Bukti Transfer:
            </div>
            
            <div v-if="selectedPaymentProof.proofImage" class="proof-image-wrapper">
              <img :src="selectedPaymentProof.proofImage" alt="Bukti Transfer" class="proof-img-preview" />
              <a :href="selectedPaymentProof.proofImage" target="_blank" rel="noopener" class="btn-open-image">
                <i class='bx bx-fullscreen'></i> Buka Gambar Ukuran Penuh
              </a>
            </div>

            <div v-else class="proof-mock-receipt">
              <div class="receipt-inner">
                <div class="receipt-header">
                  <i class='bx bxs-check-shield receipt-icon'></i>
                  <h4>Bukti Transfer Bank Terverifikasi</h4>
                  <span>Kost Muslimah Sekar Space</span>
                </div>
                <div class="receipt-divider"></div>
                <div class="receipt-rows">
                  <div><span>No. Referensi:</span> <code>{{ selectedPaymentProof.id }}</code></div>
                  <div><span>Metode:</span> <strong>{{ selectedPaymentProof.method || 'Bank BCA / Mandiri' }}</strong></div>
                  <div><span>Nominal:</span> <strong class="receipt-amt">{{ formatRupiah(getPaymentAmount(selectedPaymentProof)) }}</strong></div>
                  <div><span>Tanggal:</span> <span>{{ formatDateIndo(selectedPaymentProof.date) }}</span></div>
                  <div v-if="selectedPaymentProof.notes"><span>Catatan:</span> <em>"{{ selectedPaymentProof.notes }}"</em></div>
                </div>
                <div class="receipt-footer">
                  <small><i class='bx bx-lock-alt'></i> Transaksi tercatat aman di sistem database Sekar Space</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer proof-modal-footer">
          <template v-if="selectedPaymentProof.status === 'pending'">
            <button type="button" class="btn btn-danger-action" @click="() => { const p = selectedPaymentProof; closeProofModal(); if(p) handleRejectPayment(p); }">
              <i class='bx bx-x-circle'></i> Tolak Pembayaran
            </button>
            <button type="button" class="btn btn-primary" @click="() => { const p = selectedPaymentProof; closeProofModal(); if(p) handleConfirmPayment(p); }">
              <i class='bx bx-check-circle'></i> Setujui & Nyatakan LUNAS
            </button>
          </template>
          <a :href="getWaBillLink(selectedPaymentProof)" target="_blank" rel="noopener" class="btn btn-wa-modal">
            <i class='bx bxl-whatsapp'></i> Chat WA Penyewa
          </a>
          <button type="button" class="btn btn-ghost" @click="closeProofModal">Tutup</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-page {
  display: flex;
  min-height: 100vh;
  background: var(--off-white);
}

.admin-main {
  flex: 1;
  margin-left: 260px;
  padding: 32px;
  transition: margin var(--transition-smooth);
}

.admin-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 28px;
  flex-wrap: wrap;
  gap: 16px;
}

.header-tag {
  display: inline-block;
  padding: 4px 12px;
  background: var(--tertiary);
  color: var(--primary);
  font-size: 0.75rem;
  font-weight: 700;
  border-radius: var(--radius-full);
  margin-bottom: 6px;
}

.admin-header h1 {
  font-size: 1.8rem;
  color: var(--dark);
}

.admin-header p {
  color: var(--text-muted);
  font-size: 0.9rem;
}

.notice-alert {
  background: #DCFCE7;
  color: #15803D;
  padding: 12px 20px;
  border-radius: var(--radius-md);
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

/* FILTER BAR & CONTROL BAR */
.control-bar, .filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 16px;
}

.filter-tabs, .tab-group {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tab-pill, .tab-btn {
  padding: 8px 16px;
  border-radius: var(--radius-full);
  border: 1px solid var(--border);
  background: var(--white);
  color: var(--text-muted);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all var(--transition-fast);
}

.tab-pill:hover, .tab-pill.active, .tab-btn:hover, .tab-btn.active {
  background: var(--primary);
  color: var(--white);
  border-color: var(--primary);
}

.tab-pill.tab-expiring {
  background: #FFFBEB;
  color: #D97706;
  border: 1px solid #F59E0B;
}

.tab-pill.tab-expiring.active {
  background: #D97706;
  color: #ffffff;
  border-color: #D97706;
}

.tab-pill.pending.active, .tab-btn.pending.active {
  background: #B45309;
  border-color: #B45309;
}

.tab-pill.paid.active, .tab-btn.paid.active {
  background: #15803D;
  border-color: #15803D;
}

.tab-pill.rejected.active, .tab-btn.rejected.active {
  background: #B91C1C;
  border-color: #B91C1C;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
  padding: 8px 16px;
  width: 280px;
}

.search-box input {
  border: none;
  background: transparent;
  outline: none;
  font-size: 0.85rem;
  width: 100%;
}

.admin-card {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.table-wrapper {
  overflow-x: auto;
}

.admin-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.88rem;
}

.admin-table th {
  background: var(--off-white);
  color: var(--text-muted);
  font-weight: 700;
  font-size: 0.78rem;
  text-transform: uppercase;
  padding: 14px 16px;
  border-bottom: 2px solid var(--border);
  text-align: left;
}

.admin-table td {
  padding: 16px;
  border-bottom: 1px solid var(--border);
}

.period-pill {
  padding: 3px 10px;
  background: var(--tertiary-light);
  color: var(--primary);
  border-radius: var(--radius-full);
  font-weight: 600;
  font-size: 0.82rem;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.sub-tenant-info {
  font-family: monospace;
  font-size: 0.78rem;
  color: var(--primary);
  font-weight: 700;
}

.pay-period-title {
  font-size: 0.9rem;
  color: var(--dark);
  display: block;
}

.pay-sub-meta {
  font-size: 0.78rem;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 2px;
}

.price-amount {
  font-size: 0.95rem;
  color: var(--primary);
  font-weight: 800;
}

.status-pill {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: var(--radius-full);
}

.status-pill.pending {
  background: #FEF3C7;
  color: #B45309;
}

.status-pill.paid {
  background: #DCFCE7;
  color: #15803D;
}

.status-pill.rejected {
  background: #FEE2E2;
  color: #B91C1C;
}

.action-buttons {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  flex-wrap: nowrap;
}

.btn-action {
  padding: 7px 14px;
  border-radius: var(--radius-full);
  border: 1px solid transparent;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
  white-space: nowrap;
  line-height: 1;
  text-decoration: none;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.btn-action i {
  font-size: 1rem;
}

.btn-wa-send {
  background: linear-gradient(135deg, #25D366 0%, #10B981 100%);
  color: #ffffff !important;
  border: none;
  box-shadow: 0 2px 8px rgba(37, 211, 102, 0.25);
}

.btn-wa-send:hover {
  background: linear-gradient(135deg, #1EBE5D 0%, #059669 100%);
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(37, 211, 102, 0.4);
  color: #ffffff !important;
}

.btn-whatsapp-submit {
  background: #25D366;
  color: #ffffff;
  font-weight: 700;
  padding: 10px 20px;
  border-radius: var(--radius-md);
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 12px rgba(37, 211, 102, 0.3);
  transition: all 0.2s ease;
}

.btn-whatsapp-submit:hover {
  background: #1EBE5D;
  transform: translateY(-2px);
}

.btn-confirm {
  background: #ECFDF5;
  color: #047857;
  border: 1px solid #A7F3D0;
}

.btn-confirm:hover {
  background: #10B981;
  color: #ffffff;
  border-color: #10B981;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(16, 185, 129, 0.35);
}

.btn-reject {
  background: #FEF2F2;
  color: #DC2626;
  border: 1px solid #FCA5A5;
}

.btn-reject:hover {
  background: #EF4444;
  color: #ffffff;
  border-color: #EF4444;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(239, 68, 68, 0.35);
}

.empty-cell {
  text-align: center;
  padding: 36px;
  color: var(--text-muted);
}

/* MODAL STYLES */
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
  max-width: 580px;
  width: 100%;
  padding: 32px;
  position: relative;
  box-shadow: var(--shadow-xl);
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
  cursor: pointer;
}

.invoice-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 18px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.form-group label {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--dark);
  display: block;
  margin-bottom: 4px;
}

.form-control {
  width: 100%;
  padding: 10px 14px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  font-size: 0.9rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 10px;
}

.mobile-payment-admin-cards {
  display: none;
  flex-direction: column;
  gap: 12px;
}

.mobile-pay-admin-card {
  background: var(--off-white);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.card-details {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-top: 8px;
  border-top: 1px dashed var(--border);
  font-size: 0.85rem;
}

.card-details div {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-details span {
  color: var(--text-muted);
}

.full-w {
  width: 100%;
}

.btn-proof-view {
  background: #EFF6FF;
  color: #1D4ED8;
  border: 1px solid #BFDBFE;
}

.btn-proof-view:hover {
  background: #1D4ED8;
  color: #FFFFFF;
  border-color: #1D4ED8;
}

/* PROOF MODAL STYLES */
.proof-modal-box {
  max-width: 600px;
}

.proof-modal-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 14px;
}

.proof-info-summary {
  background: #FAFAFA;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 0.86rem;
}

.proof-info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.proof-info-row span {
  color: var(--text-muted);
}

.proof-price-highlight {
  font-size: 1.15rem;
  color: #541A1A;
  font-weight: 700;
}

.proof-display-card {
  border: 1.5px dashed var(--border);
  border-radius: var(--radius-md);
  padding: 14px;
  background: #FFFDF9;
}

.proof-card-label {
  font-size: 0.82rem;
  font-weight: 700;
  color: #541A1A;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.proof-image-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.proof-img-preview {
  max-width: 100%;
  max-height: 280px;
  object-fit: contain;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-sm);
}

.btn-open-image {
  font-size: 0.78rem;
  color: var(--primary);
  font-weight: 600;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  background: var(--tertiary-light);
}

.btn-open-image:hover {
  text-decoration: underline;
}

.proof-mock-receipt {
  background: #FFFFFF;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 16px;
  box-shadow: var(--shadow-sm);
}

.receipt-header {
  text-align: center;
  margin-bottom: 12px;
}

.receipt-icon {
  font-size: 2rem;
  color: #16A34A;
  margin-bottom: 4px;
}

.receipt-header h4 {
  font-size: 1rem;
  color: var(--dark);
  margin-bottom: 2px;
}

.receipt-header span {
  font-size: 0.76rem;
  color: var(--text-muted);
}

.receipt-divider {
  border-top: 1px dashed var(--border);
  margin: 10px 0;
}

.receipt-rows {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.82rem;
}

.receipt-rows div {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.receipt-rows span {
  color: var(--text-muted);
}

.receipt-amt {
  color: #16A34A;
  font-size: 1rem;
}

.receipt-footer {
  text-align: center;
  margin-top: 12px;
  padding-top: 8px;
  border-top: 1px dashed var(--border);
  color: var(--text-muted);
}

.proof-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 16px;
}

.btn-danger-action {
  background: #FEE2E2;
  color: #B91C1C;
  border: 1px solid #FECACA;
  padding: 8px 14px;
  border-radius: var(--radius-md);
  font-size: 0.84rem;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.btn-danger-action:hover {
  background: #DC2626;
  color: #FFFFFF;
}

.btn-wa-modal {
  background: #25D366;
  color: #FFFFFF !important;
  border-radius: var(--radius-md);
  padding: 8px 14px;
  font-size: 0.84rem;
  font-weight: 600;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.btn-wa-modal:hover {
  background: #1EBE5D;
}

.invoice-tenant-summary {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  background: var(--off-white);
  padding: 12px 14px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  margin-bottom: 6px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.summary-label {
  font-size: 0.74rem;
  color: var(--text-muted);
  font-weight: 600;
  text-transform: uppercase;
}

.summary-item strong {
  font-size: 0.88rem;
  color: var(--dark);
}

.summary-item small {
  font-size: 0.76rem;
  color: var(--text-muted);
}

.pricing-grid-preview {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.price-pill-card {
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: var(--radius-sm);
  padding: 8px 10px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.price-pill-card span {
  font-size: 0.72rem;
  color: var(--text-muted);
  font-weight: 600;
}

.price-pill-card strong {
  font-size: 0.84rem;
  color: var(--primary);
}

.btn-whatsapp-submit {
  background: #25D366;
  border-color: #25D366;
  color: white;
}

.btn-whatsapp-submit:hover {
  background: #1EBE5D;
  border-color: #1EBE5D;
}

@media (max-width: 992px) {
  .admin-main { margin-left: 0; padding: 20px; }
  .filter-bar { flex-direction: column; align-items: stretch; }
  .search-box { width: 100%; }
  .table-wrapper { display: none !important; }
  .mobile-payment-admin-cards { display: flex; }
}

@media (max-width: 768px) {
  .admin-main { padding: 16px; }
  .admin-header { flex-direction: column; align-items: flex-start; gap: 12px; margin-bottom: 20px; }
  .admin-header h1 { font-size: 1.4rem; }
  .admin-header button { width: 100%; justify-content: center; }
  .admin-card { padding: 16px; }
  .filter-pills { width: 100%; overflow-x: auto; flex-wrap: nowrap; padding-bottom: 4px; }
  .filter-pill { flex-shrink: 0; }
  .form-row { grid-template-columns: 1fr; gap: 12px; }
  .pricing-grid-preview { grid-template-columns: repeat(2, 1fr); }
  .modal-box { max-width: 92vw; max-height: 90vh; overflow-y: auto; padding: 24px 16px; }
  .modal-footer { flex-direction: column; }
  .modal-footer button { width: 100%; }
}

@media (max-width: 480px) {
  .admin-main { padding: 12px; }
  .admin-header h1 { font-size: 1.2rem; }
  .admin-header p { font-size: 0.78rem; }
  .admin-card { padding: 12px; border-radius: var(--radius-md); }
  .filter-pills { -webkit-overflow-scrolling: touch; }
  .filter-pill { font-size: 0.75rem; padding: 6px 10px; }
  .modal-box { max-width: 96vw; padding: 20px 12px; border-radius: var(--radius-lg); }
}
</style>
