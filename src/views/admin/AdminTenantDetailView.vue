<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import AdminSidebar from '../../components/layout/AdminSidebar.vue'
import { useAuth } from '../../composables/useAuth'

const route = useRoute()
const { getTenantById } = useAuth()

const tenantId = String(route.params.id)

const tenant = computed(() => {
  return getTenantById(tenantId) || {
    id: tenantId,
    name: 'Keyla Asyfa Zahra',
    username: 'keyla',
    phone: '081234567890',
    email: 'keyla.asyfa@gmail.com',
    roomNumber: 'Kamar 07',
    roomType: 'Kamar Mandi Dalam (Deluxe)',
    building: 'Gedung Utama (Lantai 2)',
    monthlyRent: 950000,
    startDate: '01 September 2025',
    endDate: '01 September 2026',
    status: 'aktif'
  }
})

const getInitials = (name: string) => {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

const formatRupiah = (val?: number) => {
  if (!val) return 'Rp 0'
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)
}
</script>

<template>
  <div class="admin-page">
    <AdminSidebar />

    <main class="main-content">
      <header class="top-header">
        <div>
          <RouterLink to="/admin/tenants" class="back-link">
            <i class='bx bx-left-arrow-alt'></i> Kembali ke Daftar Penyewa
          </RouterLink>
          <h1>Detail Data Penyewa</h1>
        </div>
      </header>

      <div class="page-body">
        <div class="detail-card">
          <div class="profile-banner">
            <div class="avatar-circle">{{ getInitials(tenant.name) }}</div>
            <div>
              <h2>{{ tenant.name }}</h2>
              <span class="status-badge"><i class='bx bx-check-circle'></i> Status: {{ tenant.status === 'aktif' ? 'Aktif' : 'Hampir Habis' }}</span>
            </div>
          </div>

          <div class="detail-grid">
            <div class="info-group">
              <label>Username Account</label>
              <p><strong>@{{ tenant.username }}</strong></p>
            </div>

            <div class="info-group">
              <label>Nomor Telepon / WhatsApp</label>
              <p v-if="tenant.phone">
                <a :href="`https://wa.me/${tenant.phone.replace(/[^0-9]/g, '')}`" target="_blank" class="wa-link">
                  <i class='bx bxl-whatsapp'></i> {{ tenant.phone }}
                </a>
              </p>
              <p v-else>-</p>
            </div>

            <div class="info-group">
              <label>Alamat Email</label>
              <p>{{ tenant.email }}</p>
            </div>

            <div class="info-group">
              <label>Nomor & Tipe Kamar</label>
              <p><strong>{{ tenant.roomNumber || 'Kamar -' }}</strong> ({{ tenant.roomType || 'Standar' }})</p>
            </div>

            <div class="info-group">
              <label>Gedung Hunian</label>
              <p>{{ tenant.building || 'Gedung Utama' }}</p>
            </div>

            <div class="info-group">
              <label>Biaya Sewa Bulanan</label>
              <p class="price-highlight">{{ formatRupiah(tenant.monthlyRent) }}</p>
            </div>

            <div class="info-group">
              <label>Masa Berlaku Sewa</label>
              <p>{{ tenant.startDate || '-' }} s.d {{ tenant.endDate || '-' }}</p>
            </div>
          </div>

          <div class="notes-box">
            <label>Catatan Pengelola Admin</label>
            <p>Akun penyewa terdaftar resmi di sistem Sekar Space Kost Muslimah.</p>
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

.detail-card {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 32px;
  max-width: 850px;
}

.profile-banner {
  display: flex;
  align-items: center;
  gap: 20px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 28px;
}

.avatar-circle {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.4rem;
}

.profile-banner h2 {
  font-size: 1.5rem;
  margin-bottom: 4px;
}

.status-badge {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--success);
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 28px;
}

.info-group label {
  font-size: 0.8rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: block;
  margin-bottom: 4px;
}

.info-group p {
  font-size: 0.95rem;
  color: var(--text);
}

.wa-link {
  color: #25D366;
  font-weight: 600;
}

.price-highlight {
  font-size: 1.15rem !important;
  font-weight: 700;
  color: var(--primary) !important;
}

.notes-box {
  background: var(--tertiary-light);
  padding: 20px;
  border-radius: var(--radius-md);
  border-left: 4px solid var(--primary);
}

.notes-box label {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--primary);
  text-transform: uppercase;
  display: block;
  margin-bottom: 6px;
}

.notes-box p {
  font-size: 0.9rem;
}

@media (max-width: 992px) {
  .main-content { margin-left: 0; padding: 20px; }
  .detail-grid { grid-template-columns: 1fr; }
}
</style>
