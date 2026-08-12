<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import AdminSidebar from '../../components/layout/AdminSidebar.vue'
import { useDataStore } from '../../composables/useDataStore'

const route = useRoute()
const { complaints, updateComplaintResponse } = useDataStore()

const complaintId = String(route.params.id)
const replyText = ref('')
const selectedStatus = ref<'in-progress' | 'resolved'>('in-progress')
const isSent = ref(false)

const complaintDetail = computed(() => {
  return complaints.value.find(c => c.id === complaintId) || {
    id: complaintId,
    tenantName: 'Keyla Asyfa Zahra',
    title: 'AC Kamar Kurang Dingin',
    category: 'Fasilitas Kamar',
    roomNumber: 'Kamar 07',
    date: '11 Agustus 2026',
    status: 'in-progress' as const,
    priority: 'high' as const,
    description: 'AC kamar sudah tidak dingin sejak kemarin malam dan membuat kamar terasa panas.',
    response: 'Teknisi AC telah dijadwalkan untuk melakukan servis freon pada jam 14.00 WIB.'
  }
})

const sendReply = () => {
  if (!replyText.value) {
    alert('Mohon tulis balasan tanggapan.')
    return
  }
  updateComplaintResponse(complaintId, replyText.value, selectedStatus.value)
  isSent.value = true
  setTimeout(() => {
    isSent.value = false
  }, 3000)
}
</script>

<template>
  <div class="admin-page">
    <AdminSidebar />

    <main class="main-content">
      <header class="top-header">
        <div>
          <RouterLink to="/admin/complaints" class="back-link">
            <i class='bx bx-left-arrow-alt'></i> Kembali ke Daftar Keluhan
          </RouterLink>
          <h1>Detail & Tanggapi Keluhan</h1>
        </div>
      </header>

      <div class="page-body">
        <div class="card-box">
          <div v-if="isSent" class="alert-success">
            <i class='bx bx-check-circle'></i> Tanggapan berhasil disimpan ke <strong>complaints.json</strong>!
          </div>

          <div class="info-section">
            <span class="meta-tag">Laporan #{{ complaintDetail.id }}</span>
            <h2>{{ complaintDetail.tenantName }} — {{ complaintDetail.roomNumber }}</h2>
            <span class="report-date"><i class='bx bx-calendar'></i> Diterima pada: {{ complaintDetail.date }}</span>

            <div class="desc-box">
              <h4>Isi Pengaduan Penyewa ({{ complaintDetail.title }}):</h4>
              <p>{{ complaintDetail.description }}</p>
            </div>

            <div v-if="complaintDetail.response" class="current-response-box">
              <h4>Tanggapan Saat Ini:</h4>
              <p>{{ complaintDetail.response }}</p>
            </div>
          </div>

          <div class="reply-section">
            <h3><i class='bx bx-message-detail'></i> Tulis / Perbarui Tanggapan</h3>

            <form @submit.prevent="sendReply">
              <div class="form-group">
                <label>Update Status Keluhan</label>
                <select v-model="selectedStatus">
                  <option value="in-progress">Diproses (Sedang Ditangani)</option>
                  <option value="resolved">Selesai (Sudah Dibereskan)</option>
                </select>
              </div>

              <div class="form-group">
                <label>Tulis Pesan Tanggapan Untuk Penyewa</label>
                <textarea v-model="replyText" rows="4" placeholder="Tulis balasan pesan untuk penyewa..." required></textarea>
              </div>

              <button type="submit" class="btn btn-primary submit-btn">
                <i class='bx bx-send'></i> Simpan & Kirim Tanggapan
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.admin-page {
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

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.88rem;
  color: var(--primary);
  font-weight: 600;
  margin-bottom: 8px;
}

.top-header h1 {
  font-size: 1.8rem;
}

.card-box {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 32px;
  max-width: 750px;
}

.alert-success {
  background: var(--success-bg);
  color: var(--success);
  padding: 12px 16px;
  border-radius: var(--radius-md);
  margin-bottom: 20px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.meta-tag {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--primary);
  background: var(--tertiary);
  padding: 3px 10px;
  border-radius: var(--radius-full);
}

.info-section h2 {
  font-size: 1.4rem;
  margin: 10px 0 4px;
}

.report-date {
  font-size: 0.85rem;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 20px;
}

.desc-box {
  background: var(--off-white);
  padding: 18px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  margin-bottom: 20px;
}

.desc-box h4, .current-response-box h4 {
  font-size: 0.9rem;
  margin-bottom: 6px;
}

.desc-box p, .current-response-box p {
  font-size: 0.92rem;
  line-height: 1.6;
}

.current-response-box {
  background: var(--tertiary-light);
  padding: 16px;
  border-radius: var(--radius-md);
  border-left: 4px solid var(--primary);
  margin-bottom: 32px;
}

.reply-section h3 {
  font-size: 1.15rem;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
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

.form-group select, .form-group textarea {
  padding: 10px 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
}

.submit-btn {
  width: 100%;
}

@media (max-width: 992px) {
  .main-content { margin-left: 0; padding: 20px; }
}
</style>
