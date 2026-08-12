<script setup lang="ts">
import AdminSidebar from '../../components/layout/AdminSidebar.vue'
import { RouterLink } from 'vue-router'
import { useDataStore } from '../../composables/useDataStore'

const { complaints } = useDataStore()
</script>

<template>
  <div class="admin-page">
    <AdminSidebar />

    <main class="main-content">
      <header class="top-header">
        <div>
          <h1>Keluhan Masuk</h1>
          <p>Kelola dan tanggapi laporan pengaduan dari penghuni kost</p>
        </div>
      </header>

      <div class="page-body">
        <div class="table-card">
          <div class="table-header-bar">
            <h2>Daftar Pengaduan Keluhan ({{ complaints.length }})</h2>
          </div>

          <div class="table-responsive">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Penyewa</th>
                  <th>Kamar</th>
                  <th>Deskripsi Keluhan</th>
                  <th>Tanggal</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="c in complaints" :key="c.id">
                  <td><strong>{{ c.tenantName }}</strong></td>
                  <td><span class="room-tag">{{ c.roomNumber }}</span></td>
                  <td class="desc-cell">{{ c.description }}</td>
                  <td>{{ c.date }}</td>
                  <td>
                    <span 
                      class="status-pill" 
                      :class="c.status === 'resolved' ? 'pill-resolved' : c.status === 'in-progress' ? 'pill-progress' : 'pill-pending'"
                    >
                      {{ c.status === 'resolved' ? 'Selesai' : c.status === 'in-progress' ? 'Diproses' : 'Menunggu' }}
                    </span>
                  </td>
                  <td>
                    <RouterLink :to="`/admin/complaints/${c.id}`" class="btn-detail">
                      <i class='bx bx-message-square-dots'></i> Tanggapi
                    </RouterLink>
                  </td>
                </tr>
              </tbody>
            </table>
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

.top-header h1 {
  font-size: 1.8rem;
  margin-bottom: 4px;
}

.top-header p {
  color: var(--text-muted);
  font-size: 0.9rem;
}

.table-card {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 24px;
}

.table-header-bar h2 {
  font-size: 1.2rem;
  margin-bottom: 20px;
}

.admin-table {
  width: 100%;
  border-collapse: collapse;
}

.admin-table th {
  text-align: left;
  padding: 12px 16px;
  background: var(--tertiary-light);
  color: var(--primary);
  font-size: 0.85rem;
  font-weight: 700;
}

.admin-table td {
  padding: 16px;
  border-bottom: 1px solid var(--border);
  font-size: 0.9rem;
}

.admin-table tbody tr {
  transition: all var(--transition-fast);
}

.admin-table tbody tr:hover {
  background: var(--tertiary-light);
}

.room-tag {
  background: var(--tertiary);
  color: var(--primary);
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  font-weight: 600;
  font-size: 0.82rem;
}

.desc-cell {
  max-width: 320px;
}

.status-pill {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: var(--radius-full);
}

.pill-pending { background: var(--warning-bg); color: var(--warning); }
.pill-progress { background: var(--info-bg); color: var(--info); }
.pill-resolved { background: var(--success-bg); color: var(--success); }

.btn-detail {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
  background: var(--primary);
  color: white;
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
  font-weight: 600;
}

.btn-detail:hover {
  background: var(--primary-light);
}

@media (max-width: 992px) {
  .main-content { margin-left: 0; padding: 20px; }
}
</style>
