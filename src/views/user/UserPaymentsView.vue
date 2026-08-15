<script setup lang="ts">
import { ref, computed } from 'vue'
import UserSidebar from '../../components/layout/UserSidebar.vue'
import { useDataStore, getRoomPriceByDuration, type PaymentData } from '../../composables/useDataStore'
import { useAuth } from '../../composables/useAuth'

const { payments, addPayment, cmsSettings, getRoomById, getActiveRentalByMemberId, getPaymentsByMemberId, getPaymentAmount, isRoomBookedByOthers, getTenantStayStatus, setExtensionIntent } = useDataStore()
const { currentUser } = useAuth()

const copySuccessMsg = ref('')

const currentRoom = computed(() => {
  const rent = currentUser.value?.id ? getActiveRentalByMemberId(currentUser.value.id) : null
  const rId = rent?.roomId || 'A-13'
  return getRoomById(rId)
})

const bankAccounts = computed(() => cmsSettings.value.bankAccounts || [
  { bank: 'BCA', number: '1234 5678 90', holder: 'a.n. Sekar Space Kost', badgeClass: 'bank-bca' },
  { bank: 'Mandiri', number: '9876 5432 10', holder: 'a.n. Sekar Space Kost', badgeClass: 'bank-mandiri' },
  { bank: 'QRIS', number: 'SEKAR SPACE QRIS', holder: 'Scan via All E-Wallet', badgeClass: 'bank-qris' }
])

const userPayments = computed(() => {
  if (!currentUser.value?.id) return []
  return getPaymentsByMemberId(currentUser.value.id)
})

const paymentHistory = userPayments

// Form Konfirmasi State
const formBank = ref('BCA')
const formDurationMonths = ref(1)
const formDate = ref(new Date().toISOString().substring(0, 10))
const formNotes = ref('')
const isSubmitted = ref(false)

const calculatedAmount = computed(() => {
  const duration = Number(formDurationMonths.value) || 1
  return getRoomPriceByDuration(currentRoom.value, duration)
})

// Modal Invoice State
const selectedInvoice = ref<PaymentData | null>(null)
const isInvoiceModalOpen = ref(false)
const proofImageBase64 = ref('')

const handleFileUpload = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = () => {
      proofImageBase64.value = reader.result as string
    }
    reader.readAsDataURL(file)
  }
}

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text.replace(/\s/g, ''))
  copySuccessMsg.value = `Nomor rekening ${text} berhasil disalin!`
  setTimeout(() => {
    copySuccessMsg.value = ''
  }, 3000)
}

const submitPayment = () => {
  const duration = Number(formDurationMonths.value) || 1
  const periodStr = `Perpanjangan Sewa ${duration} Bulan`
  const currentRent = currentUser.value?.id ? getActiveRentalByMemberId(currentUser.value.id) : null

  addPayment({
    rentalId: currentRent?.id || 'RNT-001',
    period: periodStr,
    amount: calculatedAmount.value,
    durationMonths: duration,
    method: `Transfer ${formBank.value}`,
    date: formDate.value,
    status: 'pending',
    notes: formNotes.value,
    proofImage: proofImageBase64.value || ''
  })
  isSubmitted.value = true
}

const viewInvoice = (pay: PaymentData) => {
  if (pay.status !== 'paid') return
  selectedInvoice.value = pay
  isInvoiceModalOpen.value = true
}

const closeInvoiceModal = () => {
  isInvoiceModalOpen.value = false
}

const currentRent = computed(() => {
  return currentUser.value?.id ? getActiveRentalByMemberId(currentUser.value.id) : null
})

const stayStatus = computed(() => {
  if (!currentUser.value?.id) return { hasActiveStay: false, isUpcomingOnly: false, upcomingRental: null }
  return getTenantStayStatus(currentUser.value.id)
})

const isUpcomingOnly = computed(() => stayStatus.value.isUpcomingOnly)
const upcomingRental = computed(() => stayStatus.value.upcomingRental)

const isNotExtending = computed(() => {
  return currentRent.value?.extensionIntent === 'not_extend'
})

const isQrisModalOpen = ref(false)
const openQrisModal = () => {
  if (cmsSettings.value.qrisImage) {
    isQrisModalOpen.value = true
  }
}
const closeQrisModal = () => {
  isQrisModalOpen.value = false
}

const isRoomAlreadyBooked = computed(() => {
  if (!currentRent.value?.roomId || !currentRent.value?.endDate) return false
  return isRoomBookedByOthers(currentRent.value.roomId, currentRent.value.id, currentRent.value.endDate)
})

const handleUndoNotExtend = () => {
  if (currentRent.value) {
    setExtensionIntent(currentRent.value.id, 'pending')
  }
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
          <div v-for="b in bankAccounts" :key="b.bank" class="bank-card" :class="{ 'card-qris': b.bank === 'QRIS' }">
            <div class="bank-header">
              <span class="bank-logo-badge" :class="b.badgeClass">{{ b.bank }}</span>

              <template v-if="b.bank === 'QRIS'">
                <button v-if="cmsSettings.qrisImage" class="view-qris-btn" @click="openQrisModal">
                  <i class='bx bx-qr-scan'></i> Tampilkan QRIS
                </button>
                <span v-else class="qris-unavailable-badge">
                  <i class='bx bx-time-five'></i> Belum Tersedia
                </span>
              </template>
              <template v-else>
                <button class="copy-btn" @click="copyToClipboard(b.number)">
                  <i class='bx bx-copy'></i> Salin
                </button>
              </template>
            </div>

            <template v-if="b.bank === 'QRIS'">
              <div class="bank-number" :class="{ 'text-unavailable': !cmsSettings.qrisImage }">
                {{ cmsSettings.qrisImage ? 'Scan QRIS Resmi' : 'Metode Pembayaran Belum Tersedia' }}
              </div>
              <div class="bank-holder">
                {{ cmsSettings.qrisImage ? 'Semua E-Wallet & M-Banking' : 'Pemilik kos belum mengunggah file QRIS' }}
              </div>
            </template>
            <template v-else>
              <div class="bank-number">{{ b.number }}</div>
              <div class="bank-holder">{{ b.holder }}</div>
            </template>
          </div>
        </div>

        <!-- TWO COLUMN LAYOUT -->
        <div class="payments-layout">
          <!-- LEFT COLUMN: FORM KONFIRMASI -->
          <div class="payment-box">
            <h2><i class='bx bx-upload'></i> Konfirmasi Pembayaran</h2>

            <!-- UPCOMING TENANT LOCKED STATE -->
            <div v-if="isUpcomingOnly" class="upcoming-locked-box">
              <div class="locked-icon"><i class='bx bx-calendar-event'></i></div>
              <div class="alert-body">
                <h3>Belum Ada Tagihan Baru</h3>
                <p>
                  Kontrak sewa awal Anda untuk <strong>Kamar {{ currentRoom?.number }}</strong> dijadwalkan mulai pada <strong>{{ formatDateIndo(upcomingRental?.startDate) }}</strong>. 
                  Formulir perpanjangan sewa akan aktif secara otomatis menjelang akhir masa sewa Anda.
                </p>
              </div>
            </div>

            <!-- NOT EXTENDING ALERT -->
            <div v-else-if="isNotExtending" class="not-extending-alert-box" :class="{ 'booked-locked': isRoomAlreadyBooked }">
              <div class="alert-icon">
                <i v-if="isRoomAlreadyBooked" class='bx bx-lock-alt' style="color: #DC2626;"></i>
                <i v-else class='bx bx-calendar-x'></i>
              </div>
              <div class="alert-body">
                <h3 v-if="isRoomAlreadyBooked">Kamar Telah Direservasi Calon Penyewa Baru</h3>
                <h3 v-else>Pembayaran Perpanjangan Dinonaktifkan</h3>
                <p v-if="isRoomAlreadyBooked">
                  Kamar <strong>{{ currentRoom?.number }}</strong> Anda telah direservasi oleh calon penyewa baru untuk periode mulai <strong>{{ formatDateIndo(currentRent?.endDate) }}</strong>. 
                  Sesuai konfirmasi sebelumnya, masa sewa Anda berakhir pada tanggal tersebut dan perpanjangan sewa tidak dapat dilakukan lagi.
                </p>
                <p v-else>
                  Anda telah mengonfirmasi untuk <strong>TIDAK memperpanjang</strong> masa sewa Kamar {{ currentRoom?.number }}. 
                  Masa sewa Anda akan berakhir pada <strong>{{ formatDateIndo(currentRent?.endDate) }}</strong> dan kamar telah dijadwalkan untuk checkout.
                </p>
                <div class="alert-action-btn">
                  <button v-if="!isRoomAlreadyBooked" class="btn btn-outline-primary btn-sm" @click="handleUndoNotExtend">
                    <i class='bx bx-undo'></i> Ingin Perpanjang? Ubah Keputusan
                  </button>
                  <span v-else class="locked-text-tag">
                    <i class='bx bx-lock-alt'></i> Keputusan perpanjangan sewa terkunci (Kamar sudah dibooking)
                  </span>
                </div>
              </div>
            </div>

            <div v-else-if="!isSubmitted">
              <form @submit.prevent="submitPayment" class="pay-form">
                <div class="form-group">
                  <label>Pilih Bank Tujuan</label>
                  <select v-model="formBank">
                    <option value="BCA">Bank BCA (1234 5678 90)</option>
                    <option value="Mandiri">Bank Mandiri (9876 5432 10)</option>
                    <option value="QRIS" :disabled="!cmsSettings.qrisImage">
                      QRIS Sekar Space {{ !cmsSettings.qrisImage ? '(Metode Belum Tersedia)' : '' }}
                    </option>
                  </select>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label>Durasi Perpanjangan Sewa</label>
                    <select v-model="formDurationMonths" required>
                      <option :value="1">1 Bulan</option>
                      <option :value="3">3 Bulan</option>
                      <option :value="6">6 Bulan</option>
                      <option :value="12">12 Bulan (1 Tahun)</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label>Total Nominal Tagihan (Otomatis)</label>
                    <input type="text" :value="formatRupiah(calculatedAmount)" readonly class="readonly-price-input" />
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label>Tanggal Transfer</label>
                    <input type="date" v-model="formDate" required />
                  </div>
                  <div class="form-group">
                    <label>Unggah Bukti Transfer (Gambar / PDF)</label>
                    <input type="file" accept="image/*" @change="handleFileUpload" />
                  </div>
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
                    <td>{{ formatRupiah(getPaymentAmount(p)) }}</td>
                    <td>
                      <span class="status-pill" :class="p.status === 'paid' ? 'pill-paid' : 'pill-pending'">
                        {{ p.status === 'paid' ? 'Lunas' : 'Verifikasi' }}
                      </span>
                    </td>
                    <td>
                      <template v-if="p.status === 'paid'">
                        <button class="btn-invoice" @click="viewInvoice(p)" title="Cetak Struk Pembayaran Resmi">
                          <i class='bx bx-printer'></i> Cetak Struk
                        </button>
                      </template>
                      <template v-else-if="p.status === 'pending'">
                        <span class="btn-invoice-pending" title="Menunggu persetujuan admin">
                          <i class='bx bx-time-five'></i> Menunggu Verifikasi
                        </span>
                      </template>
                      <template v-else>
                        <span class="btn-invoice-rejected" title="Pembayaran ditolak">
                          <i class='bx bx-x-circle'></i> Ditolak
                        </span>
                      </template>
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
                    <strong class="pay-val">{{ formatRupiah(getPaymentAmount(p)) }}</strong>
                  </div>
                  <template v-if="p.status === 'paid'">
                    <button class="btn-invoice" @click="viewInvoice(p)">
                      <i class='bx bx-printer'></i> Cetak Struk
                    </button>
                  </template>
                  <template v-else-if="p.status === 'pending'">
                    <span class="btn-invoice-pending">
                      <i class='bx bx-time-five'></i> Menunggu Verifikasi
                    </span>
                  </template>
                  <template v-else>
                    <span class="btn-invoice-rejected">
                      <i class='bx bx-x-circle'></i> Ditolak
                    </span>
                  </template>
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
              <strong>{{ currentUser?.name || 'Penyewa Kost' }}</strong>
            </div>
            <div class="receipt-row">
              <span>Kamar:</span>
              <strong>{{ currentRoom ? `Kamar ${currentRoom.number} (${currentRoom.typeName})` : 'Kamar Kost' }}</strong>
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
              <strong>{{ formatRupiah(getPaymentAmount(selectedInvoice)) }}</strong>
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

    <!-- QRIS MODAL POPUP -->
    <div v-if="isQrisModalOpen" class="modal-backdrop" @click.self="closeQrisModal">
      <div class="modal-box qris-modal-box">
        <button class="modal-close" @click="closeQrisModal"><i class='bx bx-x'></i></button>
        
        <div class="qris-modal-header">
          <div class="qris-logo-wrap">
            <i class='bx bx-qr-scan'></i>
          </div>
          <h3>QRIS Pembayaran Resmi</h3>
          <p>Kost Muslimah Sekar Space</p>
        </div>

        <div class="qris-image-container">
          <img :src="cmsSettings.qrisImage" alt="QRIS Sekar Space Kost" class="qris-modal-img" />
        </div>

        <div class="qris-modal-meta">
          <div class="qris-meta-row">
            <span>Merchant:</span>
            <strong>SEKAR SPACE KOST</strong>
          </div>
          <div class="qris-meta-row">
            <span>Mendukung:</span>
            <span>BCA, Mandiri, BRI, BNI, GoPay, OVO, DANA, ShopeePay, LinkAja</span>
          </div>
        </div>

        <div class="qris-modal-actions">
          <a :href="cmsSettings.qrisImage" download="QRIS-Sekar-Space.png" class="btn btn-primary btn-block">
            <i class='bx bx-download'></i> Unduh Gambar QRIS
          </a>
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

.view-qris-btn {
  background: #7B1FA2;
  color: #fff;
  border: none;
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s ease;
}

.view-qris-btn:hover {
  background: #6A1B9A;
  transform: translateY(-1px);
}

.qris-unavailable-badge {
  background: #FEE2E2;
  color: #DC2626;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: var(--radius-sm);
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.text-unavailable {
  font-size: 0.95rem !important;
  color: #DC2626 !important;
  font-weight: 600 !important;
}

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

.not-extending-alert-box {
  background: #FFFBEB;
  border: 1px solid #FDE68A;
  border-radius: var(--radius-md);
  padding: 24px;
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.upcoming-locked-box {
  background: #FEF3C7;
  border: 1px solid #FDE68A;
  border-radius: var(--radius-md);
  padding: 24px;
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.upcoming-locked-box .locked-icon {
  width: 44px;
  height: 44px;
  background: #FDE68A;
  color: #D97706;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.6rem;
  flex-shrink: 0;
}

.upcoming-locked-box .alert-body h3 {
  font-size: 1.05rem;
  font-weight: 700;
  color: #92400E;
  margin-bottom: 6px;
}

.upcoming-locked-box .alert-body p {
  font-size: 0.88rem;
  color: #78350F;
  line-height: 1.5;
}

.not-extending-alert-box .alert-icon {
  font-size: 2rem;
  color: #D97706;
  background: #FEF3C7;
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.not-extending-alert-box .alert-body h3 {
  font-size: 1.05rem;
  font-weight: 700;
  color: #92400E;
  margin-bottom: 6px;
}

.not-extending-alert-box.booked-locked {
  background: #FEF2F2;
  border-color: #FECACA;
}

.not-extending-alert-box.booked-locked .alert-icon {
  background: #FEE2E2;
}

.not-extending-alert-box.booked-locked .alert-body h3 {
  color: #991B1B;
}

.not-extending-alert-box.booked-locked .alert-body p {
  color: #7F1D1D;
}

.locked-text-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #DC2626;
  font-size: 0.85rem;
  font-weight: 600;
  background: #FEE2E2;
  padding: 6px 12px;
  border-radius: var(--radius-sm);
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
  width: 100%;
  padding: 10px 14px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  font-size: 0.9rem;
}

.form-group input.readonly-price-input {
  background: var(--off-white);
  font-weight: 700;
  color: var(--primary);
  border-color: var(--tertiary-dark, var(--border));
  cursor: default;
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

/* QRIS MODAL STYLING */
.qris-modal-box {
  max-width: 420px;
  text-align: center;
  padding: 28px;
}

.qris-modal-header {
  margin-bottom: 20px;
}

.qris-logo-wrap {
  width: 52px;
  height: 52px;
  background: #F3E5F5;
  color: #7B1FA2;
  border-radius: var(--radius-full);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  margin-bottom: 10px;
}

.qris-modal-header h3 {
  font-size: 1.3rem;
  color: var(--dark);
  margin-bottom: 4px;
}

.qris-modal-header p {
  color: var(--text-muted);
  font-size: 0.88rem;
}

.qris-image-container {
  background: white;
  padding: 16px;
  border-radius: var(--radius-md);
  border: 2px dashed #E2E8F0;
  margin-bottom: 20px;
  display: flex;
  justify-content: center;
}

.qris-modal-img {
  max-width: 100%;
  max-height: 260px;
  object-fit: contain;
  border-radius: var(--radius-sm);
}

.qris-modal-meta {
  background: var(--off-white);
  padding: 14px;
  border-radius: var(--radius-md);
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  text-align: left;
  font-size: 0.85rem;
}

.qris-meta-row {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.qris-meta-row span:first-child {
  color: var(--text-muted);
}

.qris-meta-row span:last-child {
  text-align: right;
  font-size: 0.8rem;
}

.btn-block {
  width: 100%;
  justify-content: center;
}

.btn-invoice {
  background: var(--tertiary);
  border: 1px solid var(--primary-light, #BFDBFE);
  color: var(--primary);
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s ease;
}

.btn-invoice:hover {
  background: var(--primary);
  color: var(--white);
}

.btn-invoice-pending {
  font-size: 0.75rem;
  color: #B45309;
  background: #FEF3C7;
  border: 1px solid #FDE68A;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-weight: 500;
}

.btn-invoice-rejected {
  font-size: 0.75rem;
  color: #B91C1C;
  background: #FEE2E2;
  border: 1px solid #FECACA;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-weight: 500;
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
