<script setup lang="ts">
import { ref, computed } from 'vue'
import UserSidebar from '../../components/layout/UserSidebar.vue'
import { useDataStore, type ComplaintData } from '../../composables/useDataStore'
import { useAuth } from '../../composables/useAuth'

const { complaints, addComplaint } = useDataStore()
const { currentUser } = useAuth()

const activeFilter = ref<'all' | 'pending' | 'in-progress' | 'resolved'>('all')

const filteredComplaints = computed(() => {
  if (activeFilter.value === 'all') return complaints.value
  return complaints.value.filter(c => c.status === activeFilter.value)
})

// Form State
const newTitle = ref('')
const newCategory = ref('Fasilitas Kamar')
const newPriority = ref<'low' | 'medium' | 'high'>('medium')
const newDescription = ref('')
const isSuccessMessage = ref(false)

// Modal Detail State
const selectedComplaint = ref<ComplaintData | null>(null)
const isDetailModalOpen = ref(false)

const handleAddComplaint = () => {
  if (!newTitle.value || !newDescription.value) {
    alert('Mohon isi judul dan deskripsi keluhan Anda.')
    return
  }

  addComplaint({
    tenantName: currentUser.value?.name || 'Keyla Asyfa Zahra',
    title: newTitle.value,
    category: newCategory.value,
    roomNumber: currentUser.value?.roomNumber || 'Kamar 07',
    date: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
    status: 'pending',
    priority: newPriority.value,
    description: newDescription.value
  })

  newTitle.value = ''
  newDescription.value = ''
  isSuccessMessage.value = true

  setTimeout(() => {
    isSuccessMessage.value = false
  }, 4000)
}

const openDetailModal = (comp: ComplaintData) => {
  selectedComplaint.value = comp
  isDetailModalOpen.value = true
}

const closeDetailModal = () => {
  isDetailModalOpen.value = false
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'pending': return { text: 'Menunggu', class: 'status-pending' }
    case 'in-progress': return { text: 'Diproses', class: 'status-progress' }
    case 'resolved': return { text: 'Selesai', class: 'status-resolved' }
    default: return { text: status, class: '' }
  }
}
</script>

<template>
  <div class="complaint-page">
    <UserSidebar />

    <main class="main-content">
      <header class="top-header">
        <div>
          <h1>Pengaduan Keluhan</h1>
          <p>Kelola & pantau status perbaikan keluhan hunian Anda</p>
        </div>
      </header>

      <div class="page-body">
        <div class="complaint-layout">
          <!-- LEFT COLUMN: FORM BUAT KELUHAN -->
          <div class="complaint-form-box">
            <h2><i class='bx bxs-edit-location'></i> Buat Keluhan Baru</h2>

            <div v-if="isSuccessMessage" class="alert-success">
              <i class='bx bx-check-circle'></i> Keluhan berhasil dikirim & tersimpan ke <strong>complaints.json</strong>!
            </div>

            <form @submit.prevent="handleAddComplaint">
              <div class="form-group">
                <label>Judul / Singkapan Keluhan</label>
                <input type="text" v-model="newTitle" placeholder="Contoh: Kran air bocor" required />
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Kategori</label>
                  <select v-model="newCategory">
                    <option value="Fasilitas Kamar">Fasilitas Kamar</option>
                    <option value="Kebersihan & Lingkungan">Kebersihan & Lingkungan</option>
                    <option value="Jaringan Internet / WiFi">Jaringan Internet / WiFi</option>
                    <option value="Keamanan & Kunci">Keamanan & Kunci</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>

                <div class="form-group">
                  <label>Tingkat Prioritas</label>
                  <select v-model="newPriority">
                    <option value="low">Rendah</option>
                    <option value="medium">Sedang</option>
                    <option value="high">Tinggi (Mendesak)</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label>Deskripsi Detil Keluhan</label>
                <textarea v-model="newDescription" rows="4" placeholder="Jelaskan kendala secara mendetail..." required></textarea>
              </div>

              <button type="submit" class="btn btn-primary submit-btn">
                <i class='bx bx-paper-plane'></i> Kirim Keluhan
              </button>
            </form>
          </div>

          <!-- RIGHT COLUMN: RIWAYAT KELUHAN -->
          <div class="complaint-list-box">
            <div class="list-header">
              <h2><i class='bx bx-history'></i> Riwayat Keluhan Anda</h2>

              <!-- FILTER TABS -->
              <div class="filter-tabs">
                <button 
                  class="tab-btn" 
                  :class="{ active: activeFilter === 'all' }"
                  @click="activeFilter = 'all'"
                >Semua</button>
                <button 
                  class="tab-btn" 
                  :class="{ active: activeFilter === 'in-progress' }"
                  @click="activeFilter = 'in-progress'"
                >Diproses</button>
                <button 
                  class="tab-btn" 
                  :class="{ active: activeFilter === 'resolved' }"
                  @click="activeFilter = 'resolved'"
                >Selesai</button>
              </div>
            </div>

            <div class="complaint-cards">
              <div 
                v-for="c in filteredComplaints" 
                :key="c.id" 
                class="complaint-item-card"
                @click="openDetailModal(c)"
              >
                <div class="card-top">
                  <span class="complaint-id">{{ c.id }}</span>
                  <span class="status-pill" :class="getStatusBadge(c.status).class">
                    {{ getStatusBadge(c.status).text }}
                  </span>
                </div>

                <h3>{{ c.title }}</h3>
                <p class="card-desc">{{ c.description }}</p>

                <div class="card-footer">
                  <span class="meta-item"><i class='bx bx-tag'></i> {{ c.category }}</span>
                  <span class="meta-item"><i class='bx bx-calendar'></i> {{ c.date }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- MODAL DETAIL KELUHAN -->
    <div v-if="isDetailModalOpen" class="modal-backdrop" @click.self="closeDetailModal">
      <div class="modal-box">
        <button class="modal-close" @click="closeDetailModal"><i class='bx bx-x'></i></button>
        <div v-if="selectedComplaint">
          <div class="modal-header">
            <span class="status-pill" :class="getStatusBadge(selectedComplaint.status).class">
              {{ getStatusBadge(selectedComplaint.status).text }}
            </span>
            <h2>{{ selectedComplaint.title }}</h2>
            <span class="complaint-meta">{{ selectedComplaint.id }} · {{ selectedComplaint.date }}</span>
          </div>

          <div class="modal-body-content">
            <div class="detail-section">
              <h4>Deskripsi Keluhan</h4>
              <p>{{ selectedComplaint.description }}</p>
            </div>

            <div v-if="selectedComplaint.response" class="detail-section response-box">
              <h4><i class='bx bx-message-detail'></i> Tanggapan Pengelola</h4>
              <p>{{ selectedComplaint.response }}</p>
            </div>
            <div v-else class="detail-section response-pending">
              <p><i class='bx bx-time'></i> Keluhan ini sedang menunggu penanganan oleh tim teknisi.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.complaint-page {
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
  margin-bottom: 32px;
}

.top-header h1 {
  font-size: 1.8rem;
  margin-bottom: 4px;
}

.top-header p {
  color: var(--text-muted);
  font-size: 0.9rem;
}

.complaint-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
}

.complaint-form-box, .complaint-list-box {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 28px;
}

.complaint-form-box h2, .list-header h2 {
  font-size: 1.25rem;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.alert-success {
  background: var(--success-bg);
  color: var(--success);
  padding: 12px 16px;
  border-radius: var(--radius-md);
  font-size: 0.88rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
}

.form-group label {
  font-size: 0.85rem;
  font-weight: 600;
}

.form-group input, .form-group select, .form-group textarea {
  padding: 10px 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  outline: none;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.submit-btn {
  width: 100%;
  margin-top: 8px;
}

/* LIST HEADER & TABS */
.list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.filter-tabs {
  display: flex;
  gap: 6px;
  background: var(--off-white);
  padding: 4px;
  border-radius: var(--radius-full);
}

.tab-btn {
  padding: 4px 12px;
  border: none;
  background: none;
  border-radius: var(--radius-full);
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-muted);
  cursor: pointer;
}

.tab-btn.active {
  background: var(--white);
  color: var(--primary);
  box-shadow: var(--shadow-sm);
}

.complaint-cards {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.complaint-item-card {
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 18px;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.complaint-item-card:hover {
  border-color: var(--primary);
  box-shadow: var(--shadow-sm);
}

.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.complaint-id {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--text-muted);
}

.status-pill {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: var(--radius-full);
}

.status-pending { background: var(--warning-bg); color: var(--warning); }
.status-progress { background: var(--info-bg); color: var(--info); }
.status-resolved { background: var(--success-bg); color: var(--success); }

.complaint-item-card h3 {
  font-size: 1.05rem;
  margin-bottom: 6px;
}

.card-desc {
  font-size: 0.88rem;
  color: var(--text-muted);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 12px;
}

.card-footer {
  display: flex;
  gap: 16px;
  font-size: 0.78rem;
  color: var(--text-muted);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* MODAL */
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
  max-width: 550px;
  width: 100%;
  padding: 32px;
  position: relative;
}

.modal-close {
  position: absolute;
  top: 20px;
  right: 20px;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
}

.modal-header h2 {
  font-size: 1.35rem;
  margin: 8px 0 4px;
}

.complaint-meta {
  font-size: 0.82rem;
  color: var(--text-muted);
}

.modal-body-content {
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-section h4 {
  font-size: 0.95rem;
  margin-bottom: 6px;
}

.detail-section p {
  font-size: 0.9rem;
  color: var(--text);
  line-height: 1.6;
}

.response-box {
  background: var(--tertiary-light);
  padding: 16px;
  border-radius: var(--radius-md);
  border-left: 4px solid var(--primary);
}

.response-pending {
  background: var(--warning-bg);
  padding: 14px;
  border-radius: var(--radius-md);
  color: var(--warning);
}

@media (max-width: 992px) {
  .main-content { margin-left: 0; padding: 20px; }
  .complaint-layout { grid-template-columns: 1fr; }
}
</style>
