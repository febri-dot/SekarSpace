<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import AdminSidebar from '../../components/layout/AdminSidebar.vue'
import { useDataStore } from '../../composables/useDataStore'

const route = useRoute()
const { complaints, updateComplaintResponse } = useDataStore()

const complaintId = String(route.params.id)
const replyText = ref('')
const isSent = ref(false)

const complaintDetail = computed(() => {
  return complaints.value.find(c => c.id === complaintId) || {
    id: complaintId,
    tenantName: 'Keyla Asyfa Zahra',
    title: 'AC Kamar Kurang Dingin',
    description: 'AC kamar sudah tidak dingin sejak kemarin malam dan membuat kamar terasa panas.',
    response: 'Teknisi AC telah dijadwalkan untuk melakukan servis freon pada jam 14.00 WIB.',
    status: 'in-progress' as const
  }
})

const sendReply = () => {
  if (!replyText.value) {
    alert('Mohon isi pesan balasan keluhan.')
    return
  }
  updateComplaintResponse(complaintId, replyText.value, 'resolved')
  isSent.value = true
  setTimeout(() => {
    isSent.value = false
  }, 4000)
}
</script>

<template>
  <div class="admin-page">
    <AdminSidebar />

    <main class="main-content">
      <div class="container">
        <h1>Detail Keluhan</h1>

        <div v-if="isSent" class="alert-success">
          <i class='bx bx-check-circle'></i> Balasan berhasil dikirim ke penyewa!
        </div>

        <section class="section">
          <h2>Informasi Keluhan</h2>
          <p><strong>Nama Penyewa:</strong> {{ complaintDetail.tenantName }}</p>
          <p>
            <strong>Keluhan:</strong><br>
            {{ complaintDetail.description }}
          </p>

          <div v-if="complaintDetail.response" class="current-reply">
            <p><strong>Tanggapan Saat Ini:</strong> {{ complaintDetail.response }}</p>
          </div>
        </section>

        <section class="section">
          <h2>Balas Keluhan</h2>

          <form @submit.prevent="sendReply">
            <textarea 
              v-model="replyText" 
              placeholder="Tulis balasan..." 
              required
            ></textarea>
            <br>
            <button type="submit" class="btn-submit">Kirim Balasan</button>
          </form>
        </section>

        <RouterLink to="/admin/complaints" class="back-btn">
          <button class="btn-back">Kembali</button>
        </RouterLink>
      </div>
    </main>
  </div>
</template>

<style scoped>
.admin-page {
  display: flex;
  min-height: 100vh;
  background-color: #F1E2D1;
}

.main-content {
  flex: 1;
  margin-left: 260px;
  padding: 30px;
}

.container {
  background: white;
  padding: 25px;
  border-radius: 8px;
  max-width: 800px;
  box-shadow: var(--shadow-sm);
}

h1 {
  color: #541A1A;
  margin-bottom: 20px;
  font-size: 1.8rem;
}

.alert-success {
  background: #DCFCE7;
  color: #15803D;
  padding: 12px 16px;
  border-radius: 6px;
  margin-bottom: 20px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section {
  margin-bottom: 25px;
}

.section h2 {
  color: #541A1A;
  font-size: 1.2rem;
  border-bottom: 2px solid #DCC3AA;
  padding-bottom: 5px;
  margin-bottom: 12px;
}

p {
  margin-bottom: 10px;
  line-height: 1.5;
  font-size: 0.95rem;
}

.current-reply {
  background: #F8FAFC;
  padding: 12px;
  border-radius: 6px;
  border-left: 4px solid #541A1A;
  margin-top: 10px;
}

textarea {
  width: 100%;
  min-height: 120px;
  padding: 12px;
  margin-top: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-family: inherit;
  font-size: 0.95rem;
  box-sizing: border-box;
}

.btn-submit {
  margin-top: 10px;
  padding: 8px 16px;
  border: none;
  background-color: #541A1A;
  color: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: opacity 0.2s ease;
}

.btn-submit:hover, .btn-back:hover {
  opacity: 0.9;
}

.back-btn {
  display: inline-block;
  margin-top: 15px;
  text-decoration: none;
}

.btn-back {
  padding: 8px 16px;
  border: none;
  background-color: #DCC3AA;
  color: black;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
}

@media (max-width: 992px) {
  .main-content { margin-left: 0; padding: 20px; }
}
</style>
