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
    username: 'keyla01',
    nik: '3401234567890001',
    address: 'Sleman, Yogyakarta',
    phone: '081234567890',
    birthDate: '12 Mei 2004',
    parentPhone: '081298765432',
    roomNumber: 'Kamar 07 (A01)',
    roomType: 'Kamar Mandi Dalam (Deluxe)',
    building: 'Gedung Utama (Gedung A)',
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
          <h1>Detail Penyewa</h1>
        </div>
      </header>

      <div class="page-body">
        <div class="detail-card">
          <div class="profile-banner">
            <div class="avatar-circle">{{ getInitials(tenant.name) }}</div>
            <div>
              <h2>{{ tenant.name }}</h2>
              <span class="status-badge"><i class='bx bx-check-circle'></i> Status: {{ tenant.status === 'aktif' ? 'Aktif (Terisi)' : 'Hampir Habis' }}</span>
            </div>
          </div>

          <!-- Section 1: Informasi Penyewa -->
          <div class="section-box">
            <h2>Informasi Penyewa</h2>
            <div class="info-list">
              <p class="info"><span class="label">Username:</span> {{ tenant.username }}</p>
              <p class="info"><span class="label">Nama Lengkap:</span> {{ tenant.name }}</p>
              <p class="info"><span class="label">NIK:</span> {{ tenant.nik || '3401234567890001' }}</p>
              <p class="info"><span class="label">Alamat:</span> {{ tenant.address || 'Sleman, Yogyakarta' }}</p>
              <p class="info">
                <span class="label">No Telepon:</span> 
                <a :href="`https://wa.me/${(tenant.phone || '081234567890').replace(/[^0-9]/g, '')}`" target="_blank" class="wa-link">
                  <i class='bx bxl-whatsapp'></i> {{ tenant.phone || '081234567890' }}
                </a>
              </p>
              <p class="info"><span class="label">Tanggal Lahir:</span> {{ tenant.birthDate || '12 Mei 2004' }}</p>
              <p class="info"><span class="label">No Telepon Orang Tua:</span> {{ tenant.parentPhone || '081298765432' }}</p>
            </div>
          </div>

          <!-- Section 2: Informasi Kamar -->
          <div class="section-box">
            <h2>Informasi Kamar</h2>
            <div class="info-list">
              <p class="info"><span class="label">Nomor Kamar:</span> {{ tenant.roomNumber || 'Kamar 07' }}</p>
              <p class="info"><span class="label">Tipe Kamar:</span> {{ tenant.roomType || 'Kamar Mandi Dalam' }}</p>
              <p class="info"><span class="label">Gedung:</span> {{ tenant.building || 'Gedung Utama' }}</p>
              <p class="info"><span class="label">Status:</span> {{ tenant.status === 'aktif' ? 'Terisi' : 'Hampir Habis' }}</p>
            </div>
          </div>

          <!-- Section 3: Informasi Sewa -->
          <div class="section-box">
            <h2>Informasi Sewa</h2>
            <div class="info-list">
              <p class="info"><span class="label">Mulai Sewa:</span> {{ tenant.startDate || '01 September 2025' }}</p>
              <p class="info"><span class="label">Selesai Sewa:</span> {{ tenant.endDate || '01 September 2026' }}</p>
            </div>
          </div>

          <!-- Section 4: Informasi Pembayaran -->
          <div class="section-box">
            <h2>Informasi Pembayaran</h2>
            <div class="info-list">
              <p class="info"><span class="label">Status Pembayaran:</span> <strong class="text-success">Lunas</strong></p>
              <p class="info"><span class="label">Total Pembayaran:</span> {{ formatRupiah(tenant.monthlyRent || 950000) }} / bulan</p>
              <p class="info"><span class="label">Tenggat Pembayaran:</span> {{ tenant.endDate || '01 September 2026' }}</p>
            </div>
          </div>

          <div class="action-footer">
            <RouterLink to="/admin/tenants" class="btn btn-primary">Kembali ke Daftar Penyewa</RouterLink>
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
  color: var(--dark);
}

.detail-card {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  padding: 32px;
  max-width: 850px;
  box-shadow: var(--shadow-sm);
}

.profile-banner {
  display: flex;
  align-items: center;
  gap: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 24px;
}

.avatar-circle {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #541A1A;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.3rem;
}

.profile-banner h2 {
  font-size: 1.5rem;
  margin-bottom: 4px;
  color: #541A1A;
}

.status-badge {
  font-size: 0.82rem;
  font-weight: 700;
  color: #16A34A;
}

.section-box {
  margin-bottom: 24px;
}

.section-box h2 {
  color: #541A1A;
  font-size: 1.15rem;
  border-bottom: 2px solid #DCC3AA;
  padding-bottom: 6px;
  margin-bottom: 12px;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info {
  font-size: 0.95rem;
  color: var(--dark);
}

.label {
  font-weight: bold;
  color: #541A1A;
  display: inline-block;
  min-width: 170px;
}

.wa-link {
  color: #25D366;
  font-weight: 600;
}

.text-success {
  color: #16A34A;
}

.action-footer {
  margin-top: 28px;
  padding-top: 20px;
  border-top: 1px solid var(--border);
}

@media (max-width: 992px) {
  .main-content { margin-left: 0; padding: 20px; }
  .label { min-width: auto; display: block; margin-bottom: 2px; }
}

@media (max-width: 768px) {
  .main-content { padding: 16px; }
  .detail-card { padding: 18px 14px; }
  .profile-banner { flex-direction: column; align-items: flex-start; gap: 12px; }
  .profile-banner h2 { font-size: 1.3rem; }
  .top-bar { margin-bottom: 16px; }
}

@media (max-width: 480px) {
  .main-content { padding: 12px; }
  .detail-card { padding: 14px 12px; border-radius: var(--radius-md); }
  .profile-banner h2 { font-size: 1.15rem; }
  .info-item { font-size: 0.85rem; }
}
</style>
