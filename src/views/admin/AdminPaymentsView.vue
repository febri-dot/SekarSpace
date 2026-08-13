<script setup lang="ts">
import { ref, computed } from 'vue'
import AdminSidebar from '../../components/layout/AdminSidebar.vue'
import { useDataStore, type PaymentData } from '../../composables/useDataStore'
import { useAuth } from '../../composables/useAuth'

const { payments, addPayment, updatePaymentStatus } = useDataStore()
const { tenants } = useAuth()

const activeTab = ref<'all' | 'pending' | 'paid' | 'rejected'>('all')
const searchQuery = ref('')
const isInvoiceModalOpen = ref(false)
const noticeMessage = ref('')

// Form Kirim Tagihan Baru
const formInvoice = ref({
  tenantName: tenants.value[0]?.name || 'Keyla Asyfa Zahra',
  period: 'September 2026',
  amount: 950000,
  method: 'Transfer Bank BCA / Mandiri',
  dueDate: '05 September 2026',
  notes: 'Tagihan sewa bulanan rutin Kost Sekar Space'
})

const filteredPayments = computed(() => {
  let list = payments.value
  if (activeTab.value !== 'all') {
    list = list.filter(p => p.status === activeTab.value)
  }
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(p => p.tenantName.toLowerCase().includes(q) || p.period.toLowerCase().includes(q))
  }
  return list
})

const openInvoiceModal = () => {
  isInvoiceModalOpen.value = true
}

const closeInvoiceModal = () => {
  isInvoiceModalOpen.value = false
}

const handleSendInvoice = () => {
  if (!formInvoice.value.tenantName || !formInvoice.value.amount) {
    alert('Mohon lengkapi nama penyewa dan nominal tagihan.')
    return
  }

  const created = addPayment({
    tenantName: formInvoice.value.tenantName,
    period: formInvoice.value.period,
    amount: Number(formInvoice.value.amount),
    method: formInvoice.value.method,
    date: new Date().toISOString().substring(0, 10),
    dueDate: formInvoice.value.dueDate,
    status: 'pending',
    notes: formInvoice.value.notes
  })

  noticeMessage.value = `Tagihan sewa ${created.period} senilai ${formatRupiah(created.amount)} berhasil dikirimkan ke penyewa ${created.tenantName}!`
  closeInvoiceModal()
  setTimeout(() => {
    noticeMessage.value = ''
  }, 5000)
}

const handleConfirmPayment = (pay: PaymentData) => {
  updatePaymentStatus(pay.id, 'paid', 'Pembayaran telah diverifikasi & dikonfirmasi LUNAS oleh admin.')
  noticeMessage.value = `Pembayaran ${pay.period} oleh ${pay.tenantName} telah dikonfirmasi LUNAS!`
  setTimeout(() => {
    noticeMessage.value = ''
  }, 4000)
}

const handleRejectPayment = (pay: PaymentData) => {
  const reason = prompt('Alasan penolakan konfirmasi pembayaran:', 'Bukti transfer tidak terbaca / nominal belum masuk.')
  if (reason !== null) {
    updatePaymentStatus(pay.id, 'rejected', reason)
    noticeMessage.value = `Pembayaran ${pay.tenantName} telah ditolak.`
    setTimeout(() => {
      noticeMessage.value = ''
    }, 4000)
  }
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
          <span class="header-tag">Financial & Billing Console</span>
          <h1>Kelola <span class="text-gradient">Tagihan & Konfirmasi Pembayaran</span></h1>
          <p>Kirim tagihan sewa bulanan ke penyewa dan konfirmasi bukti pembayaran yang diunggah.</p>
        </div>
        <button class="btn btn-primary" @click="openInvoiceModal">
          <i class='bx bx-paper-plane'></i> Kirim Tagihan Baru
        </button>
      </header>

      <!-- NOTICE ALERT -->
      <div v-if="noticeMessage" class="notice-alert">
        <i class='bx bx-check-circle'></i> {{ noticeMessage }}
      </div>

      <!-- FILTER TABS & SEARCH -->
      <div class="filter-bar">
        <div class="tab-group">
          <button 
            class="tab-btn" 
            :class="{ active: activeTab === 'all' }"
            @click="activeTab = 'all'"
          >
            Semua Tagihan ({{ payments.length }})
          </button>
          <button 
            class="tab-btn pending" 
            :class="{ active: activeTab === 'pending' }"
            @click="activeTab = 'pending'"
          >
            <i class='bx bx-time'></i> Menunggu Konfirmasi ({{ payments.filter(p => p.status === 'pending').length }})
          </button>
          <button 
            class="tab-btn paid" 
            :class="{ active: activeTab === 'paid' }"
            @click="activeTab = 'paid'"
          >
            <i class='bx bx-check-double'></i> Lunas ({{ payments.filter(p => p.status === 'paid').length }})
          </button>
          <button 
            class="tab-btn rejected" 
            :class="{ active: activeTab === 'rejected' }"
            @click="activeTab = 'rejected'"
          >
            <i class='bx bx-x-circle'></i> Ditolak ({{ payments.filter(p => p.status === 'rejected').length }})
          </button>
        </div>

        <div class="search-box">
          <i class='bx bx-search'></i>
          <input type="text" v-model="searchQuery" placeholder="Cari penyewa / periode..." />
        </div>
      </div>

      <!-- TABLE CONTAINER -->
      <div class="admin-card">
        <div class="table-wrapper">
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
                  <strong>{{ pay.tenantName }}</strong>
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
                  <div v-if="pay.status === 'pending'" class="action-buttons">
                    <button class="btn-action btn-confirm" @click="handleConfirmPayment(pay)" title="Konfirmasi Lunas">
                      <i class='bx bx-check'></i> Konfirmasi Lunas
                    </button>
                    <button class="btn-action btn-reject" @click="handleRejectPayment(pay)" title="Tolak Pembayaran">
                      <i class='bx bx-x'></i> Tolak
                    </button>
                  </div>
                  <div v-else-if="pay.status === 'paid'" class="text-muted text-xs">
                    <i class='bx bx-check-circle text-success'></i> Lunas Terverifikasi
                  </div>
                  <div v-else class="text-muted text-xs">
                    <i class='bx bx-info-circle text-danger'></i> Ditolak Admin
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
          <p>Tagihan akan diterbitkan dan tampil pada Portal Penyewa</p>
        </div>

        <form @submit.prevent="handleSendInvoice" class="invoice-form">
          <div class="form-group">
            <label>Pilih Penyewa</label>
            <select v-model="formInvoice.tenantName" class="form-control" required>
              <option v-for="t in tenants" :key="t.id" :value="t.name">
                {{ t.name }} ({{ t.roomNumber || 'Kamar -' }} - {{ t.building || 'Gedung Utama' }})
              </option>
            </select>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Periode Tagihan</label>
              <input type="text" v-model="formInvoice.period" placeholder="Contoh: September 2026" class="form-control" required />
            </div>

            <div class="form-group">
              <label>Nominal Tagihan (Rp)</label>
              <input type="number" v-model="formInvoice.amount" placeholder="950000" class="form-control" required />
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
            <button type="submit" class="btn btn-primary">Kirim Tagihan Sekarang</button>
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

/* FILTER BAR */
.filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 16px;
}

.tab-group {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tab-btn {
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

.tab-btn:hover, .tab-btn.active {
  background: var(--primary);
  color: var(--white);
  border-color: var(--primary);
}

.tab-btn.pending.active {
  background: #B45309;
  border-color: #B45309;
}

.tab-btn.paid.active {
  background: #15803D;
  border-color: #15803D;
}

.tab-btn.rejected.active {
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

@media (max-width: 992px) {
  .admin-main { margin-left: 0; }
  .filter-bar { flex-direction: column; align-items: stretch; }
  .search-box { width: 100%; }
}
</style>
