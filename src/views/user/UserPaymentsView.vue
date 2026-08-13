<script setup lang="ts">
import { ref } from 'vue'
import UserSidebar from '../../components/layout/UserSidebar.vue'
import { useDataStore, type PaymentData } from '../../composables/useDataStore'
import { useAuth } from '../../composables/useAuth'

const { payments, addPayment } = useDataStore()
const { currentUser } = useAuth()

const copySuccessMsg = ref('')

const bankAccounts = [
  { bank: 'BCA', number: '1234 5678 90', holder: 'a.n. Sekar Space Kost', badgeClass: 'bank-bca' },
  { bank: 'Mandiri', number: '9876 5432 10', holder: 'a.n. Sekar Space Kost', badgeClass: 'bank-mandiri' },
  { bank: 'QRIS', number: 'SEKAR SPACE QRIS', holder: 'Scan via All E-Wallet', badgeClass: 'bank-qris' }
]

const paymentHistory = payments

// Form Konfirmasi State
const formBank = ref('BCA')
const formAmount = ref(950000)
const formDate = ref(new Date().toISOString().substring(0, 10))
const formNotes = ref('')
const isSubmitted = ref(false)

// Modal Invoice State
const selectedInvoice = ref<PaymentData | null>(null)
const isInvoiceModalOpen = ref(false)

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text.replace(/\s/g, ''))
  copySuccessMsg.value = `Nomor rekening ${text} berhasil disalin!`
  setTimeout(() => {
    copySuccessMsg.value = ''
  }, 3000)
}

const submitPayment = () => {
  const d = new Date(formDate.value)
  const monthNames = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']
  const periodStr = `${monthNames[d.getMonth()]} ${d.getFullYear()}`
  addPayment({
    tenantName: currentUser.value?.name || 'Keyla Asyfa Zahra',
    period: periodStr,
    amount: formAmount.value,
    method: `Transfer ${formBank.value}`,
    date: formDate.value,
    status: 'pending'
  })
  isSubmitted.value = true
}

const viewInvoice = (pay: PaymentData) => {
  selectedInvoice.value = pay
  isInvoiceModalOpen.value = true
}

const closeInvoiceModal = () => {
  isInvoiceModalOpen.value = false
}

const formatRupiah = (val: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)
}

const printReceipt = () => {
  window.print()
}
</script>

<template>
  <div class="payments-page">
    <UserSidebar />

    <main class="main-content">
      <header class="top-header">
        <div>
          <h1>Pembayaran & Tagihan</h1>
          <p>Kelola konfirmasi transfer dan unduh bukti pembayaran sewa Anda</p>
        </div>
      </header>

      <div class="page-body">
        <!-- TOAST COPIED -->
        <div v-if="copySuccessMsg" class="toast-success">
          <i class='bx bx-check-circle'></i> {{ copySuccessMsg }}
        </div>

        <!-- REKENING BANK GRID -->
        <h2 class="section-subtitle"><i class='bx bxs-credit-card'></i> Rekening Pembayaran Resmi</h2>
        <div class="bank-accounts-grid">
          <div v-for="b in bankAccounts" :key="b.bank" class="bank-card">
            <div class="bank-header">
              <span class="bank-logo-badge" :class="b.badgeClass">{{ b.bank }}</span>
              <button class="copy-btn" @click="copyToClipboard(b.number)">
                <i class='bx bx-copy'></i> Salin
              </button>
            </div>
            <div class="bank-number">{{ b.number }}</div>
            <div class="bank-holder">{{ b.holder }}</div>
          </div>
        </div>

        <!-- TWO COLUMN LAYOUT -->
        <div class="payments-layout">
          <!-- LEFT COLUMN: FORM KONFIRMASI -->
          <div class="payment-box">
            <h2><i class='bx bx-upload'></i> Konfirmasi Pembayaran</h2>

            <div v-if="!isSubmitted">
              <form @submit.prevent="submitPayment" class="pay-form">
                <div class="form-group">
                  <label>Pilih Bank Tujuan</label>
                  <select v-model="formBank">
                    <option value="BCA">Bank BCA (1234 5678 90)</option>
                    <option value="Mandiri">Bank Mandiri (9876 5432 10)</option>
                    <option value="QRIS">QRIS Sekar Space</option>
                  </select>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label>Jumlah Transfer (Rp)</label>
                    <input type="number" v-model="formAmount" required />
                  </div>
                  <div class="form-group">
                    <label>Tanggal Transfer</label>
                    <input type="date" v-model="formDate" required />
                  </div>
                </div>

                <div class="form-group">
                  <label>Unggah Bukti Transfer (Gambar / PDF)</label>
                  <input type="file" accept="image/*,.pdf" />
                </div>

                <div class="form-group">
                  <label>Catatan (Opsional)</label>
                  <textarea v-model="formNotes" rows="2" placeholder="Nama pemilik rekening pengirim..."></textarea>
                </div>

                <button type="submit" class="btn btn-primary submit-pay-btn">
                  <i class='bx bx-check-circle'></i> Kirim Konfirmasi
                </button>
              </form>
            </div>

            <div v-else class="pay-submitted-state">
              <i class='bx bx-check-circle success-clock'></i>
              <h3>Konfirmasi Pembayaran Terkirim!</h3>
              <p>Data pembayaran berhasil tersimpan ke <strong>payments.json</strong> dan sedang menunggu verifikasi admin. Status akan diperbarui dalam 1x24 jam.</p>
              <button class="btn btn-ghost" @click="isSubmitted = false">Kirim Bukti Lain</button>
            </div>
          </div>

          <!-- RIGHT COLUMN: RIWAYAT TAGIHAN -->
          <div class="payment-box">
            <h2><i class='bx bx-receipt'></i> Riwayat Pembayaran</h2>

            <div class="table-responsive">
              <table class="pay-table">
                <thead>
                  <tr>
                    <th>Periode</th>
                    <th>Nominal</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="p in paymentHistory" :key="p.id">
                    <td>
                      <strong>{{ p.period }}</strong>
                      <span class="pay-date">{{ p.date }}</span>
                    </td>
                    <td>{{ formatRupiah(p.amount) }}</td>
                    <td>
                      <span class="status-pill" :class="p.status === 'paid' ? 'pill-paid' : 'pill-pending'">
                        {{ p.status === 'paid' ? 'Lunas' : 'Verifikasi' }}
                      </span>
                    </td>
                    <td>
                      <button class="btn-invoice" @click="viewInvoice(p)">
                        <i class='bx bx-file'></i> Struk
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- MOBILE CARD VIEW FOR PAYMENTS -->
            <div class="mobile-payment-cards">
              <div v-for="p in paymentHistory" :key="'mob-' + p.id" class="mobile-pay-card">
                <div class="pay-card-header">
                  <div>
                    <strong class="pay-period">{{ p.period }}</strong>
                    <span class="pay-date-sub">{{ p.date }}</span>
                  </div>
                  <span class="status-pill" :class="p.status === 'paid' ? 'pill-paid' : 'pill-pending'">
                    {{ p.status === 'paid' ? 'Lunas' : 'Verifikasi' }}
                  </span>
                </div>
                <div class="pay-card-body">
                  <div class="pay-amount-box">
                    <span>Nominal:</span>
                    <strong class="pay-val">{{ formatRupiah(p.amount) }}</strong>
                  </div>
                  <button class="btn-invoice" @click="viewInvoice(p)">
                    <i class='bx bx-file'></i> Struk
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- INVOICE MODAL -->
    <div v-if="isInvoiceModalOpen" class="modal-backdrop" @click.self="closeInvoiceModal">
      <div class="modal-box">
        <button class="modal-close" @click="closeInvoiceModal"><i class='bx bx-x'></i></button>
        <div v-if="selectedInvoice" class="invoice-receipt">
          <div class="receipt-header">
            <i class='bx bxs-home-heart receipt-logo'></i>
            <h3>SEKAR SPACE KOST</h3>
            <p>Kwitansi Bukti Pembayaran Sewa</p>
          </div>

          <div class="receipt-divider"></div>

          <div class="receipt-details">
            <div class="receipt-row">
              <span>No. Transaksi:</span>
              <strong>{{ selectedInvoice.id }}</strong>
            </div>
            <div class="receipt-row">
              <span>Nama Penyewa:</span>
              <strong>Keyla Asyfa Zahra</strong>
            </div>
            <div class="receipt-row">
              <span>Kamar:</span>
              <strong>Kamar 07 (Deluxe)</strong>
            </div>
            <div class="receipt-row">
              <span>Periode Sewa:</span>
              <strong>{{ selectedInvoice.period }}</strong>
            </div>
            <div class="receipt-row">
              <span>Metode Pembayaran:</span>
              <strong>{{ selectedInvoice.method }}</strong>
            </div>
            <div class="receipt-row">
              <span>Tanggal Bayar:</span>
              <strong>{{ selectedInvoice.date }}</strong>
            </div>
            <div class="receipt-row total-row">
              <span>Total Bayar:</span>
              <strong>{{ formatRupiah(selectedInvoice.amount) }}</strong>
            </div>
          </div>

          <div class="receipt-stamp">
            <i class='bx bx-check-double'></i> LUNAS VERIFIKASI
          </div>

          <button class="btn btn-primary print-btn" @click="printReceipt">
            <i class='bx bx-printer'></i> Cetak Struk
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.payments-page {
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
  margin-bottom: 24px;
}

.top-header h1 {
  font-size: 1.8rem;
  margin-bottom: 4px;
}

.top-header p {
  color: var(--text-muted);
  font-size: 0.9rem;
}

.toast-success {
  background: var(--success-bg);
  color: var(--success);
  padding: 12px 20px;
  border-radius: var(--radius-md);
  margin-bottom: 20px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-subtitle {
  font-size: 1.15rem;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* BANK GRID */
.bank-accounts-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 32px;
}

.bank-card {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 20px;
  transition: all var(--transition-fast);
}

.bank-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.bank-logo-badge {
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 0.9rem;
  padding: 4px 10px;
  border-radius: var(--radius-sm);
}

.bank-bca { background: #E3F2FD; color: #0D47A1; }
.bank-mandiri { background: #FFF8E1; color: #F57F17; }
.bank-qris { background: #F3E5F5; color: #7B1FA2; }

.copy-btn {
  background: var(--tertiary);
  color: var(--primary);
  border: none;
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
}

.copy-btn:hover {
  background: var(--primary);
  color: white;
}

.bank-number {
  font-family: var(--font-heading);
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--dark);
  margin-bottom: 4px;
}

.bank-holder {
  font-size: 0.8rem;
  color: var(--text-muted);
}

/* TWO COLUMN */
.payments-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
}

.payment-box {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 28px;
}

.payment-box h2 {
  font-size: 1.2rem;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.pay-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 0.85rem;
  font-weight: 600;
}

.form-group input, .form-group select, .form-group textarea {
  padding: 10px 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.submit-pay-btn {
  width: 100%;
  margin-top: 8px;
}

.pay-submitted-state {
  text-align: center;
  padding: 32px 16px;
}

.success-clock {
  font-size: 3.5rem;
  color: var(--info);
  margin-bottom: 12px;
}

/* TABLE */
.pay-table {
  width: 100%;
  border-collapse: collapse;
}

.pay-table th {
  text-align: left;
  padding: 12px;
  font-size: 0.82rem;
  color: var(--text-muted);
  border-bottom: 2px solid var(--border);
}

.pay-table td {
  padding: 14px 12px;
  border-bottom: 1px solid var(--border);
  font-size: 0.9rem;
}

.pay-date {
  display: block;
  font-size: 0.78rem;
  color: var(--text-muted);
  font-weight: normal;
}

.status-pill {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: var(--radius-full);
}

.pill-paid { background: var(--success-bg); color: var(--success); }
.pill-pending { background: var(--warning-bg); color: var(--warning); }

.btn-invoice {
  background: var(--tertiary);
  border: none;
  color: var(--primary);
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
}

/* INVOICE MODAL */
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
  max-width: 450px;
  width: 100%;
  padding: 32px;
  position: relative;
}

.modal-close {
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
}

.receipt-header {
  text-align: center;
  margin-bottom: 20px;
}

.receipt-logo {
  font-size: 2.5rem;
  color: var(--primary);
}

.receipt-header h3 {
  font-size: 1.3rem;
  margin-top: 4px;
}

.receipt-header p {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.receipt-divider {
  border-top: 2px dashed var(--border);
  margin: 16px 0;
}

.receipt-details {
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 0.88rem;
}

.receipt-row {
  display: flex;
  justify-content: space-between;
}

.total-row {
  font-size: 1.05rem;
  padding-top: 10px;
  border-top: 1px solid var(--border);
  color: var(--primary);
}

.receipt-stamp {
  margin: 24px 0 16px;
  text-align: center;
  font-family: var(--font-heading);
  font-weight: 700;
  color: var(--success);
  border: 2px solid var(--success);
  padding: 8px;
  border-radius: var(--radius-md);
  letter-spacing: 1px;
}

.mobile-payment-cards {
  display: none;
  flex-direction: column;
  gap: 12px;
}

.mobile-pay-card {
  background: var(--off-white);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.pay-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.pay-period {
  display: block;
  font-size: 0.95rem;
  color: var(--dark);
}

.pay-date-sub {
  font-size: 0.78rem;
  color: var(--text-muted);
}

.pay-card-body {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 8px;
  border-top: 1px dashed var(--border);
}

.pay-amount-box span {
  font-size: 0.75rem;
  color: var(--text-muted);
  display: block;
}

.pay-val {
  font-size: 1.05rem;
  color: var(--primary);
}

@media (max-width: 992px) {
  .main-content { margin-left: 0; padding: 20px; }
  .bank-accounts-grid { grid-template-columns: 1fr; }
  .payments-layout { grid-template-columns: 1fr; }
  .table-responsive { display: none !important; }
  .mobile-payment-cards { display: flex; }
}

@media (max-width: 768px) {
  .main-content { padding: 16px; }
  .top-header { margin-bottom: 20px; }
  .top-header h1 { font-size: 1.4rem; }
  .payment-box { padding: 18px 14px; }
  .form-row { grid-template-columns: 1fr; gap: 12px; }
  .modal-box { max-width: 92vw; max-height: 90vh; overflow-y: auto; padding: 24px 16px; }
}

@media (max-width: 480px) {
  .main-content { padding: 12px; }
  .top-header h1 { font-size: 1.2rem; }
  .top-header p { font-size: 0.78rem; }
  .payment-box { padding: 14px 12px; border-radius: var(--radius-md); }
  .bank-card { padding: 12px; }
  .bank-header h4 { font-size: 0.92rem; }
  .account-num strong { font-size: 0.95rem; }
  .modal-box { max-width: 96vw; padding: 20px 12px; border-radius: var(--radius-lg); }
}
</style>
