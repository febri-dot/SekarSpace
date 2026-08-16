<script setup lang="ts">
import AdminSidebar from '../../components/layout/AdminSidebar.vue'
import { RouterLink } from 'vue-router'
import { useDataStore } from '../../composables/useDataStore'
import { useAuth } from '../../composables/useAuth'

const { complaints } = useDataStore()
const { getTenantById } = useAuth()

const getTenantName = (memberId: string) => {
  const tenant = getTenantById(memberId)
  return tenant ? tenant.name : 'Penyewa'
}
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
                  <td><strong>{{ getTenantName(c.memberId) }}</strong></td>
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

          <!-- MOBILE CARD VIEW FOR ADMIN COMPLAINTS -->
          <div class="mobile-complaint-admin-cards">
            <div v-for="c in complaints" :key="'mob-' + c.id" class="mobile-complaint-card">
              <div class="c-card-top">
                <strong class="c-tenant-name">{{ getTenantName(c.memberId) }}</strong>
                <RouterLink :to="`/admin/complaints/${c.id}`">
                  <button class="btn-detail">Detail</button>
                </RouterLink>
              </div>
              <p class="c-desc">{{ c.description }}</p>
            </div>
            <div v-if="complaints.length === 0" class="empty-cell">Belum ada keluhan yang masuk.</div>
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

.mobile-complaint-admin-cards {
  display: none;
  flex-direction: column;
  gap: 12px;
}

.mobile-complaint-card {
  background: var(--off-white);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.c-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.c-tenant-name {
  font-size: 1rem;
  color: var(--dark);
}

.c-desc {
  font-size: 0.88rem;
  color: var(--text-muted);
  line-height: 1.5;
}

@media (max-width: 992px) {
  .main-content { margin-left: 0; padding: 20px; }
  .table-responsive { display: none !important; }
  .mobile-complaint-admin-cards { display: flex; }
}

@media (max-width: 768px) {
  .main-content { padding: 16px; }
  .top-header h1 { font-size: 1.4rem; }
  .table-card { padding: 16px 12px; }
}

@media (max-width: 480px) {
  .main-content { padding: 12px; }
  .top-header h1 { font-size: 1.2rem; }
  .top-header p { font-size: 0.78rem; }
  .table-card { padding: 12px 8px; border-radius: var(--radius-md); }
}
</style>
