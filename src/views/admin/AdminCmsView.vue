<script setup lang="ts">
import { ref } from 'vue'
import AdminSidebar from '../../components/layout/AdminSidebar.vue'
import { useDataStore } from '../../composables/useDataStore'

const { cmsSettings, updateCmsSettings } = useDataStore()

const formCms = ref({
  announcementBarText: cmsSettings.value.announcementBarText,
  heroBadgeText: cmsSettings.value.heroBadgeText,
  heroHeadline: cmsSettings.value.heroHeadline,
  heroDescription: cmsSettings.value.heroDescription,
  contactPhone: cmsSettings.value.contactPhone,
  contactEmail: cmsSettings.value.contactEmail,
  contactAddress: cmsSettings.value.contactAddress,
  // Prices
  priceKmLuarMonthly: cmsSettings.value.priceKmLuarMonthly || 700000,
  priceKmDalamMonthly: cmsSettings.value.priceKmDalamMonthly || 950000,
  priceKmLuarYearly: cmsSettings.value.priceKmLuarYearly || 650000,
  priceKmDalamYearly: cmsSettings.value.priceKmDalamYearly || 880000,
  // Images
  heroImage1: cmsSettings.value.heroImage1 || '/assets/images/hero-gedung-depan.png',
  heroImage2: cmsSettings.value.heroImage2 || '/assets/images/hero-kamar.png',
  heroImage3: cmsSettings.value.heroImage3 || '/assets/images/hero-dapur.png',
  qrisImage: cmsSettings.value.qrisImage || ''
})

const noticeMessage = ref('')

const handleFileUpload = (event: Event, imageKey: 'heroImage1' | 'heroImage2' | 'heroImage3' | 'qrisImage') => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    const file = target.files[0]
    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target?.result) {
        formCms.value[imageKey] = e.target.result as string
      }
    }
    reader.readAsDataURL(file)
  }
}

const removeQrisImage = () => {
  formCms.value.qrisImage = ''
}

const useDefaultDemoQris = () => {
  formCms.value.qrisImage = '/assets/images/qris-sekar-space.png'
}

const handleSaveCms = () => {
  updateCmsSettings(formCms.value)
  noticeMessage.value = 'Pengaturan Konten, Harga, dan Gambar Landing Page Berhasil Disimpan!'
  setTimeout(() => {
    noticeMessage.value = ''
  }, 4000)
}

const formatRupiah = (val: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)
}
</script>

<template>
  <div class="admin-page">
    <AdminSidebar />

    <main class="admin-main">
      <header class="admin-header">
        <div>
          <span class="header-tag">Landing Page CMS & Pricing Console</span>
          <h1>Kelola Konten, <span class="text-gradient">Harga & Gambar Landing Page</span></h1>
          <p>Ubah tarif sewa yang tampil di beranda, upload foto banner hero, dan atur running text pengumuman.</p>
        </div>
        <button class="btn btn-primary" @click="handleSaveCms">
          <i class='bx bx-save'></i> Simpan Semua Perubahan
        </button>
      </header>

      <!-- NOTICE ALERT -->
      <div v-if="noticeMessage" class="notice-alert">
        <i class='bx bx-check-circle'></i> {{ noticeMessage }}
      </div>

      <div class="cms-grid">
        <!-- 1. PENGATURAN HARGA KAMAR LANDING PAGE -->
        <div class="cms-card">
          <div class="card-header">
            <h3><i class='bx bxs-dollar-circle'></i> Tarif Harga Sewa (Tampil di Landing Page)</h3>
          </div>

          <div class="form-row mb-3">
            <div class="form-group">
              <label>Kamar Mandi Luar (Bulanan - Rp)</label>
              <input type="number" v-model="formCms.priceKmLuarMonthly" class="form-control" placeholder="700000" />
              <small class="help-text">Tampil: {{ formatRupiah(formCms.priceKmLuarMonthly) }}/bln</small>
            </div>

            <div class="form-group">
              <label>Kamar Mandi Dalam (Bulanan - Rp)</label>
              <input type="number" v-model="formCms.priceKmDalamMonthly" class="form-control" placeholder="950000" />
              <small class="help-text">Tampil: {{ formatRupiah(formCms.priceKmDalamMonthly) }}/bln</small>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Kamar Mandi Luar (Diskon Tahunan - Rp)</label>
              <input type="number" v-model="formCms.priceKmLuarYearly" class="form-control" placeholder="650000" />
              <small class="help-text">Tampil: {{ formatRupiah(formCms.priceKmLuarYearly) }}/bln (paket 1 tahun)</small>
            </div>

            <div class="form-group">
              <label>Kamar Mandi Dalam (Diskon Tahunan - Rp)</label>
              <input type="number" v-model="formCms.priceKmDalamYearly" class="form-control" placeholder="880000" />
              <small class="help-text">Tampil: {{ formatRupiah(formCms.priceKmDalamYearly) }}/bln (paket 1 tahun)</small>
            </div>
          </div>
        </div>

        <!-- 2. UPLOAD & GANTI GAMBAR HERO BANNER SLIDESHOW -->
        <div class="cms-card">
          <div class="card-header">
            <h3><i class='bx bxs-image-add'></i> Upload & Ganti Gambar Banner Hero</h3>
          </div>

          <div class="image-upload-grid">
            <!-- Slide 1 Image -->
            <div class="image-upload-item">
              <label class="img-title">Gambar Slide 1 (Gedung Utama)</label>
              <div class="preview-box">
                <img :src="formCms.heroImage1" alt="Slide 1 Preview" />
              </div>
              <div class="upload-controls">
                <input type="file" @change="handleFileUpload($event, 'heroImage1')" accept="image/*" id="uploadSlide1" class="file-input" />
                <label for="uploadSlide1" class="btn-file"><i class='bx bx-upload'></i> Upload Foto Baru</label>
              </div>
            </div>

            <!-- Slide 2 Image -->
            <div class="image-upload-item">
              <label class="img-title">Gambar Slide 2 (Interior Kamar)</label>
              <div class="preview-box">
                <img :src="formCms.heroImage2" alt="Slide 2 Preview" />
              </div>
              <div class="upload-controls">
                <input type="file" @change="handleFileUpload($event, 'heroImage2')" accept="image/*" id="uploadSlide2" class="file-input" />
                <label for="uploadSlide2" class="btn-file"><i class='bx bx-upload'></i> Upload Foto Baru</label>
              </div>
            </div>

            <!-- Slide 3 Image -->
            <div class="image-upload-item">
              <label class="img-title">Gambar Slide 3 (Kamar Standard)</label>
              <div class="preview-box">
                <img :src="formCms.heroImage3" alt="Slide 3 Preview" />
              </div>
              <div class="upload-controls">
                <input type="file" @change="handleFileUpload($event, 'heroImage3')" accept="image/*" id="uploadSlide3" class="file-input" />
                <label for="uploadSlide3" class="btn-file"><i class='bx bx-upload'></i> Upload Foto Baru</label>
              </div>
            </div>
          </div>
        </div>

        <!-- 3. ANNOUNCEMENT CARD -->
        <div class="cms-card">
          <div class="card-header">
            <h3><i class='bx bxs-megaphone'></i> Announcement Bar (Running Text)</h3>
          </div>

          <div class="form-group">
            <label>Running Text Announcement Bar (Top Marquee Beranda)</label>
            <textarea 
              v-model="formCms.announcementBarText" 
              rows="2" 
              class="form-control" 
              placeholder="Pesan pengumuman running text yang berjalan di bagian paling atas..."
            ></textarea>
            <small class="form-hint">Kosongkan jika tidak ingin menampilkan bar pengumuman.</small>
          </div>
        </div>

        <!-- 4. HERO TEXT & CONTACT INFO CARD -->
        <div class="cms-card">
          <div class="card-header">
            <h3><i class='bx bxs-carousel'></i> Headline Hero & Kontak Official</h3>
          </div>

          <div class="form-row mb-3">
            <div class="form-group">
              <label>Sub-Headline Badge Top</label>
              <input type="text" v-model="formCms.heroBadgeText" class="form-control" />
            </div>

            <div class="form-group">
              <label>Judul Utama (Headline H1)</label>
              <input type="text" v-model="formCms.heroHeadline" class="form-control" />
            </div>
          </div>

          <div class="form-group mb-3">
            <label>Deskripsi Hero Section</label>
            <textarea v-model="formCms.heroDescription" rows="2" class="form-control"></textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>No WhatsApp Official</label>
              <input type="text" v-model="formCms.contactPhone" class="form-control" />
            </div>
            <div class="form-group">
              <label>Email Official</label>
              <input type="email" v-model="formCms.contactEmail" class="form-control" />
            </div>
          </div>
        </div>

        <!-- 4. PENGATURAN QRIS PEMBAYARAN KOS -->
        <div class="cms-card">
          <div class="card-header">
            <h3><i class='bx bx-qr-scan'></i> QRIS Pembayaran Resmi Kos</h3>
          </div>
          <p class="section-desc mb-3">
            Unggah file barcode/gambar QRIS resmi kos Anda di sini. Jika file diunggah, penyewa dapat langsung melihat dan scan QRIS di Portal Pembayaran. Jika belum diunggah, sistem otomatis menampilkan status <em>"Metode Pembayaran Belum Tersedia"</em>.
          </p>

          <div class="qris-upload-section">
            <div v-if="formCms.qrisImage" class="qris-preview-box">
              <img :src="formCms.qrisImage" alt="QRIS Sekar Space Kost" class="qris-preview-img" />
              <div class="qris-preview-meta">
                <span class="badge-qris-active"><i class='bx bx-check-circle'></i> File QRIS Aktif</span>
                <button type="button" class="btn btn-outline-danger btn-sm" @click="removeQrisImage">
                  <i class='bx bx-trash'></i> Hapus QRIS
                </button>
              </div>
            </div>
            <div v-else class="qris-empty-placeholder">
              <i class='bx bx-qr'></i>
              <span>Belum ada gambar QRIS yang diunggah</span>
            </div>

            <div class="form-group mt-3">
              <label>{{ formCms.qrisImage ? 'Ganti File Gambar QRIS' : 'Unggah File Gambar QRIS' }}</label>
              <input type="file" accept="image/*" @change="handleFileUpload($event, 'qrisImage')" class="form-control" />
              <div class="qris-action-quick mt-2">
                <button type="button" class="btn btn-ghost btn-sm" @click="useDefaultDemoQris" style="font-size: 0.8rem; padding: 4px 10px;">
                  <i class='bx bx-check-double'></i> Gunakan Gambar QRIS Resmi (Assets)
                </button>
              </div>
              <small class="help-text">Format didukung: PNG, JPG, JPEG, WEBP. Tersimpan di sistem aset dan database CMS.</small>
            </div>
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

.admin-main {
  flex: 1;
  margin-left: 260px;
  padding: 32px;
  transition: margin var(--transition-smooth);
}

.admin-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 28px;
  flex-wrap: wrap;
  gap: 16px;
}

.header-tag {
  display: inline-block;
  padding: 4px 12px;
  background: var(--tertiary);
  color: var(--primary);
  font-size: 0.75rem;
  font-weight: 700;
  border-radius: var(--radius-full);
  margin-bottom: 6px;
}

.admin-header h1 {
  font-size: 1.8rem;
  color: var(--dark);
}

.admin-header p {
  color: var(--text-muted);
  font-size: 0.9rem;
}

.notice-alert {
  background: #DCFCE7;
  color: #15803D;
  padding: 12px 20px;
  border-radius: var(--radius-md);
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.cms-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

.cms-card {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  padding: 28px;
  box-shadow: var(--shadow-sm);
}

.card-header h3 {
  font-size: 1.15rem;
  color: var(--dark);
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-header h3 i {
  color: var(--primary);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-group label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--dark);
  display: block;
  margin-bottom: 6px;
}

.form-control {
  width: 100%;
  padding: 10px 14px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  font-size: 0.9rem;
  font-family: inherit;
}

.section-desc {
  font-size: 0.85rem;
  color: var(--text-muted);
  line-height: 1.5;
}

.qris-upload-section {
  background: var(--off-white);
  padding: 16px;
  border-radius: var(--radius-md);
  border: 1px dashed var(--border);
}

.qris-preview-box {
  display: flex;
  align-items: center;
  gap: 20px;
  background: var(--white);
  padding: 16px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
}

.qris-preview-img {
  width: 140px;
  height: 140px;
  object-fit: contain;
  border-radius: var(--radius-sm);
  background: white;
  padding: 6px;
  border: 1px solid #E2E8F0;
}

.qris-preview-meta {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.badge-qris-active {
  background: #DCFCE7;
  color: #16A34A;
  font-weight: 700;
  font-size: 0.8rem;
  padding: 6px 12px;
  border-radius: var(--radius-full);
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.btn-outline-danger {
  background: transparent;
  border: 1px solid #EF4444;
  color: #EF4444;
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.btn-outline-danger:hover {
  background: #EF4444;
  color: white;
}

.qris-empty-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: var(--white);
  border-radius: var(--radius-md);
  color: var(--text-muted);
  font-size: 0.88rem;
  gap: 6px;
}

.qris-empty-placeholder i {
  font-size: 2.5rem;
  color: #CBD5E1;
}

.help-text {
  font-size: 0.75rem;
  color: var(--primary);
  font-weight: 600;
  margin-top: 4px;
  display: block;
}

.checkbox-label {
  display: flex !important;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.mb-3 {
  margin-bottom: 16px;
}

/* IMAGE UPLOAD STYLES */
.image-upload-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.image-upload-item {
  background: var(--off-white);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.img-title {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--dark);
  margin-bottom: 8px;
  text-align: center;
}

.preview-box {
  width: 100%;
  height: 90px;
  border-radius: var(--radius-md);
  overflow: hidden;
  margin-bottom: 8px;
  background: #000;
}

.preview-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.file-input {
  display: none;
}

.btn-file {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  background: var(--primary);
  color: white;
  font-size: 0.72rem;
  font-weight: 600;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.btn-file:hover {
  opacity: 0.9;
}

@media (max-width: 1100px) {
  .cms-grid { grid-template-columns: 1fr; }
}

@media (max-width: 992px) {
  .admin-main { margin-left: 0; padding: 20px; }
}

@media (max-width: 768px) {
  .admin-main { padding: 16px; }
  .admin-header { flex-direction: column; align-items: flex-start; gap: 12px; margin-bottom: 20px; }
  .admin-header h1 { font-size: 1.4rem; }
  .admin-header button { width: 100%; justify-content: center; }
  .cms-card { padding: 18px 14px; }
  .form-row { grid-template-columns: 1fr; gap: 12px; }
}

@media (max-width: 600px) {
  .image-upload-grid { grid-template-columns: 1fr; }
}

@media (max-width: 480px) {
  .admin-main { padding: 12px; }
  .admin-header h1 { font-size: 1.2rem; }
  .admin-header p { font-size: 0.78rem; }
  .cms-card { padding: 14px 12px; border-radius: var(--radius-md); }
}
</style>
