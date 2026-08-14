<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import AdminSidebar from '../../components/layout/AdminSidebar.vue'
import { useDataStore, getRoomPriceByDuration, calculateRoomPrice, type PaymentData } from '../../composables/useDataStore'
import { useAuth, type User } from '../../composables/useAuth'

const { payments, addPayment, updatePaymentStatus, rooms, getRoomById, getBuildingName, updateRoom } = useDataStore()
const { tenants, getTenantById, updateMember } = useAuth()

const getTenantName = (memberId: string) => {
  const tenant = getTenantById(memberId)
  return tenant ? tenant.name : 'Penyewa'
}

const activeTab = ref<'all' | 'pending' | 'paid' | 'rejected' | 'expiring'>('all')
const searchQuery = ref('')
const isInvoiceModalOpen = ref(false)
const noticeMessage = ref('')

// Computed list of expiring tenants (H-30 days or less)
const expiringTenants = computed(() => {
  const now = new Date()
  return tenants.value.map(t => {
    let daysLeft = 30
    if (t.endDate) {
      const end = new Date(t.endDate)
      if (!isNaN(end.getTime())) {
        const diffTime = end.getTime() - now.getTime()
        daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      }
    }
    const rm = t.roomId ? getRoomById(t.roomId) : null
    return {
      ...t,
      daysLeft,
      room: rm,
      roomNum: rm ? `Kamar ${rm.number}` : 'Kamar A13',
      bldName: rm ? getBuildingName(rm.buildingId) : 'Gedung A',
      typeId: rm?.typeId || 'km-luar'
    }
  }).filter(t => t.status === 'hampir-habis' || t.daysLeft <= 30)
})

// Form Kirim Tagihan Baru
const formInvoice = ref({
  memberId: tenants.value[0]?.id || 'MBR-01',
  durationMonths: 1,
  period: 'Perpanjangan Sewa 1 Bulan',
  amount: 600000,
  method: 'Transfer Bank BCA / Mandiri',
  dueDate: '05 September 2026',
  notes: 'Tagihan perpanjangan sewa kost Sekar Space'
})

// Auto calculate price based on selected tenant room custom duration prices
const updateInvoiceAmount = () => {
  const t = getTenantById(formInvoice.value.memberId)
  const rm = t?.roomId ? getRoomById(t.roomId) : null
  const duration = Number(formInvoice.value.durationMonths) || 1
  
  formInvoice.value.amount = getRoomPriceByDuration(rm, duration)
  formInvoice.value.period = `Perpanjangan Sewa ${duration} Bulan`
}

watch(() => [formInvoice.value.memberId, formInvoice.value.durationMonths], () => {
  updateInvoiceAmount()
})

const filteredPayments = computed(() => {
  let list = payments.value
  if (activeTab.value !== 'all' && activeTab.value !== 'expiring') {
    list = list.filter(p => p.status === activeTab.value)
  }
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(p => getTenantName(p.memberId).toLowerCase().includes(q) || p.period.toLowerCase().includes(q))
  }
  return list
})

const openInvoiceModal = (targetMemberId?: string) => {
  if (targetMemberId) {
    formInvoice.value.memberId = targetMemberId
  }
  updateInvoiceAmount()
  isInvoiceModalOpen.value = true
}

const closeInvoiceModal = () => {
  isInvoiceModalOpen.value = false
}

// H-1 Month Reminder: Sends WhatsApp inquiry with room's custom duration prices
const sendHMinus1MonthReminder = (t: any) => {
  const phone = (t.phone || '081234567890').replace(/[^0-9]/g, '')
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
  if (!formInvoice.value.memberId || !formInvoice.value.amount) {
    alert('Mohon lengkapi penyewa dan nominal tagihan.')
    return
  }

  const tenant = getTenantById(formInvoice.value.memberId)
  const tenantPhone = (tenant?.phone || '081234567890').replace(/[^0-9]/g, '')
  const tenantName = tenant?.name || 'Penyewa'
  const duration = Number(formInvoice.value.durationMonths) || 1

  const created = addPayment({
    memberId: formInvoice.value.memberId,
    period: formInvoice.value.period,
    amount: Number(formInvoice.value.amount),
    method: formInvoice.value.method,
    date: new Date().toISOString().substring(0, 10),
    dueDate: formInvoice.value.dueDate,
    status: 'pending',
    notes: formInvoice.value.notes,
    durationMonths: duration
  })

  // Open WhatsApp directly to send bill to tenant
  const waText = `Halo Kak ${tenantName}, 👋

Berikut rincian tagihan sewa Kost Sekar Space Anda:
📌 Paket Sewa: ${created.period} (${duration} Bulan)
📌 Nominal Sewa: ${formatRupiah(created.amount)}
📌 Tenggat Jatuh Tempo: ${created.dueDate || '05 September 2026'}

Mohon lakukan pembayaran melalui rekening resmi Sekar Space:
• BCA: 1234 5678 90 (a.n. Sekar Space Kost)
• Mandiri: 9876 5432 10 (a.n. Sekar Space Kost)

Setelah transfer, mohon upload bukti pembayaran pada Portal Penyewa. Terima kasih! 🙏`

  const waUrl = `https://wa.me/${tenantPhone || '6281234567890'}?text=${encodeURIComponent(waText)}`
  window.open(waUrl, '_blank')

  noticeMessage.value = `Tagihan sewa ${created.period} berhasil terbit & pesan WhatsApp ke ${tenantName} telah terbuka!`
  closeInvoiceModal()
  setTimeout(() => {
    noticeMessage.value = ''
  }, 5000)
}

// Action: Confirm Payment & AUTOMATICALLY UPDATE TENANT LEASE!
const handleConfirmPayment = (pay: PaymentData) => {
  updatePaymentStatus(pay.id, 'paid', 'Pembayaran telah diverifikasi & dikonfirmasi LUNAS oleh admin.')

  const tenant = getTenantById(pay.memberId)
  if (tenant) {
    // Determine extension duration (from pay.durationMonths or inferred)
    const duration = pay.durationMonths || 1
    
    // Calculate new end date by adding duration months
    let currentEnd = tenant.endDate ? new Date(tenant.endDate) : new Date()
    if (isNaN(currentEnd.getTime())) currentEnd = new Date()
    
    currentEnd.setMonth(currentEnd.getMonth() + duration)
    const newEndDate = currentEnd.toISOString().substring(0, 10)

    // Automatically update tenant record
    updateMember(tenant.id, {
      endDate: newEndDate,
      status: 'aktif'
    })

    // Ensure room is occupied
    if (tenant.roomId) {
      updateRoom(tenant.roomId, { status: 'occupied' })
    }

    noticeMessage.value = `Pembayaran LUNAS! Data sewa ${tenant.name} otomatis diperpanjang +${duration} bulan hingga ${newEndDate}.`
  } else {
    noticeMessage.value = `Pembayaran ${pay.period} oleh ${getTenantName(pay.memberId)} telah dikonfirmasi LUNAS!`
  }

  setTimeout(() => {
    noticeMessage.value = ''
  }, 5000)
}

const handleRejectPayment = (pay: PaymentData) => {
  const reason = prompt('Alasan penolakan konfirmasi pembayaran:', 'Bukti transfer tidak terbaca / nominal belum masuk.')
  if (reason !== null) {
    updatePaymentStatus(pay.id, 'rejected', reason)
    noticeMessage.value = `Pembayaran ${pay.period} oleh ${getTenantName(pay.memberId)} telah ditolak.`
    setTimeout(() => {
      noticeMessage.value = ''
    }, 4000)
  }
}

const getWaBillLink = (pay: PaymentData) => {
  const tenant = getTenantById(pay.memberId)
  const phone = (tenant?.phone || '081234567890').replace(/[^0-9]/g, '')
  const name = tenant?.name || 'Penyewa'
  const text = `Halo Kak ${name}, 👋

Berikut rincian tagihan sewa Kost Sekar Space Anda:
📌 Periode: ${pay.period}
📌 Nominal Sewa: ${formatRupiah(pay.amount)}
📌 Batas Jatuh Tempo: ${pay.dueDate || '05 September 2026'}

Mohon lakukan pembayaran ke Rekening Resmi Sekar Space:
• BCA: 1234 5678 90 (a.n. Sekar Space Kost)
• Mandiri: 9876 5432 10 (a.n. Sekar Space Kost)

Setelah transfer, mohon upload bukti pembayaran di Portal Penyewa. Terima kasih! 🙏`

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

        <!-- TRANSACTIONS VIEW TABLE -->
        <div v-else class="table-wrapper">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Penyewa</th>
                <th>Periode Tagihan</th>
                <th>Nominal Sewa</th>
                <th>Metode Pembayaran</th>
                <th>Tanggal Upload</th>
                <th>Status</th>
                <th>Konfirmasi & Aksi Admin</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="pay in filteredPayments" :key="pay.id">
                <td>
                  <strong>{{ getTenantName(pay.memberId) }}</strong>
                </td>
                <td><span class="period-pill"><i class='bx bx-calendar'></i> {{ pay.period }}</span></td>
                <td><strong class="text-primary">{{ formatRupiah(pay.amount) }}</strong></td>
                <td>{{ pay.method }}</td>
                <td>{{ pay.date }}</td>
                <td>
                  <span 
                    class="status-pill"
                    :class="pay.status"
                  >
                    {{ pay.status === 'paid' ? 'Lunas' : pay.status === 'pending' ? 'Perlu Konfirmasi' : 'Ditolak' }}
                  </span>
                </td>
                <td>
                  <div class="action-buttons">
                    <a :href="getWaBillLink(pay)" target="_blank" rel="noopener" class="btn-action btn-wa-send" title="Kirim Tagihan via WA">
                      <i class='bx bxl-whatsapp'></i> Kirim WA
                    </a>
                    <template v-if="pay.status === 'pending'">
                      <button class="btn-action btn-confirm" @click="handleConfirmPayment(pay)" title="Konfirmasi Lunas">
                        <i class='bx bx-check'></i> Konfirmasi Lunas
                      </button>
                      <button class="btn-action btn-reject" @click="handleRejectPayment(pay)" title="Tolak Pembayaran">
                        <i class='bx bx-x'></i> Tolak
                      </button>
                    </template>
                  </div>
                </td>
              </tr>
              <tr v-if="filteredPayments.length === 0">
                <td colspan="7" class="empty-cell">Tidak ada data transaksi pembayaran yang ditemukan.</td>
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
          <h2><i class='bx bx-paper-plane'></i> Kirim Tagihan Sewa ke Penyewa</h2>
          <p>Pilih paket durasi dan terbitkan tagihan resmi ke WhatsApp penyewa</p>
        </div>

        <form @submit.prevent="handleSendInvoice" class="invoice-form">
          <div class="form-group">
            <label>Pilih Penyewa</label>
            <select v-model="formInvoice.memberId" class="form-control" @change="updateInvoiceAmount" required>
              <option v-for="t in tenants" :key="t.id" :value="t.id">
                {{ t.name }} (@{{ t.username }})
              </option>
            </select>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Paket Durasi Perpanjangan</label>
              <select v-model="formInvoice.durationMonths" class="form-control" @change="updateInvoiceAmount" required>
                <option :value="1">1 Bulan</option>
                <option :value="3">3 Bulan</option>
                <option :value="6">6 Bulan</option>
                <option :value="12">12 Bulan (1 Tahun)</option>
              </select>
            </div>

            <div class="form-group">
              <label>Nominal Tagihan Resmi (Rp)</label>
              <input type="number" v-model="formInvoice.amount" class="form-control" required readonly />
              <small class="text-muted">Harga otomatis dihitung sesuai tabel resmi</small>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Metode Pembayaran</label>
              <input type="text" v-model="formInvoice.method" placeholder="Transfer BCA / Mandiri" class="form-control" required />
            </div>

            <div class="form-group">
              <label>Tenggat Jatuh Tempo</label>
              <input type="text" v-model="formInvoice.dueDate" placeholder="05 September 2026" class="form-control" required />
            </div>
          </div>

          <div class="form-group">
            <label>Catatan Tagihan</label>
            <textarea v-model="formInvoice.notes" rows="2" class="form-control" placeholder="Tuliskan catatan tambahan..."></textarea>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-ghost" @click="closeInvoiceModal">Batal</button>
            <button type="submit" class="btn btn-whatsapp-submit">
              <i class='bx bxl-whatsapp'></i> Kirim Tagihan via WhatsApp
            </button>
          </div>
        </form>
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
  display: flex;
  gap: 6px;
  align-items: center;
}

.btn-action {
  padding: 6px 12px;
  border-radius: var(--radius-md);
  border: none;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: all var(--transition-fast);
}

.btn-wa-send {
  background: #25D366;
  color: #ffffff !important;
  text-decoration: none;
}

.btn-wa-send:hover {
  background: #1EBE5D;
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
  background: #DCFCE7;
  color: #15803D;
}

.btn-confirm:hover {
  background: #16A34A;
  color: white;
}

.btn-reject {
  background: #FEE2E2;
  color: #B91C1C;
}

.btn-reject:hover {
  background: #DC2626;
  color: white;
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

.flex-1 {
  flex: 1;
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
