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
          <h1>Daftar Keluhan</h1>
          <p>Keluhan yang dikirim oleh penyewa Kost Muslimah Sekar Wangi</p>
        </div>
      </header>

      <div class="page-body">
        <div class="table-card">
          <div class="table-responsive">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Nama Pembuat</th>
                  <th>Deskripsi</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="c in complaints" :key="c.id">
                  <td><strong>{{ c.tenantName }}</strong></td>
                  <td class="desc-cell">{{ c.description }}</td>
                  <td>
                    <RouterLink :to="`/admin/complaints/${c.id}`">
                      <button class="btn-detail">Detail</button>
                    </RouterLink>
                  </td>
                </tr>
                <tr v-if="complaints.length === 0">
                  <td colspan="3" class="empty-cell">Belum ada keluhan yang masuk.</td>
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

.top-header {
  margin-bottom: 24px;
}

.top-header h1 {
  font-size: 1.8rem;
  color: #541A1A;
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
  box-shadow: var(--shadow-sm);
}

.admin-table {
  width: 100%;
  border-collapse: collapse;
  background-color: white;
}

.admin-table th {
  background-color: #DCC3AA;
  color: #541A1A;
  font-weight: 700;
  padding: 12px 14px;
  text-align: left;
  border: 1px solid #ddd;
}

.admin-table td {
  padding: 12px 14px;
  border: 1px solid #ddd;
  font-size: 0.9rem;
}

.desc-cell {
  line-height: 1.5;
}

.btn-detail {
  padding: 6px 14px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background-color: #541A1A;
  color: white;
  font-size: 0.85rem;
  font-weight: 600;
  transition: opacity 0.2s ease;
}

.btn-detail:hover {
  opacity: 0.9;
}

.empty-cell {
  text-align: center;
  padding: 30px;
  color: var(--text-muted);
}

@media (max-width: 992px) {
  .main-content { margin-left: 0; padding: 20px; }
}
</style>
