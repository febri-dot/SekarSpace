<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useDataStore } from '../../composables/useDataStore'

const { cmsSettings } = useDataStore()
</script>

<template>
  <footer class="footer" id="footer">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-brand">
          <RouterLink to="/" class="footer-logo" aria-label="Sekar Space">
            <i class='bx bxs-home-heart'></i>
            <span>Sekar<strong>Space</strong></span>
          </RouterLink>
          <p>Kost Muslimah Sekar Wangi — hunian nyaman, aman, dan terjangkau khusus muslimah dengan fasilitas lengkap dan lokasi strategis.</p>
          <div class="footer-socials">
            <a href="#" aria-label="Instagram Sekar Space" id="socialInstagram"><i class='bx bxl-instagram'></i></a>
            <a href="#" aria-label="Facebook Sekar Space" id="socialFacebook"><i class='bx bxl-facebook'></i></a>
            <a :href="'https://wa.me/' + (cmsSettings.contactPhone ? cmsSettings.contactPhone.replace(/[^0-9]/g, '') : '62895378020456')" aria-label="WhatsApp Sekar Space" id="socialWhatsapp" target="_blank" rel="noopener"><i class='bx bxl-whatsapp'></i></a>
            <a href="#" aria-label="TikTok Sekar Space" id="socialTiktok"><i class='bx bxl-tiktok'></i></a>
          </div>
        </div>

        <nav class="footer-nav" aria-label="Navigasi Footer - Tautan Cepat">
          <h3>Tautan Cepat</h3>
          <ul>
            <li><RouterLink to="/">Beranda</RouterLink></li>
            <li><a href="/#facilities">Fasilitas</a></li>
            <li><RouterLink to="/rooms">Pilihan Kamar</RouterLink></li>
            <li><a href="/#gallery">Galeri Foto</a></li>
            <li><a href="/#faq">FAQ</a></li>
            <li><a href="/#contact">Kontak Kami</a></li>
          </ul>
        </nav>

        <nav class="footer-nav" aria-label="Navigasi Footer - Layanan">
          <h3>Portal & Layanan</h3>
          <ul>
            <li><RouterLink to="/user">Portal Penyewa</RouterLink></li>
            <li><RouterLink to="/admin/dashboard">Portal Admin</RouterLink></li>
          </ul>
        </nav>

        <div class="footer-contact">
          <h3>Kontak Kami</h3>
          <address>
            <p><i class='bx bxs-map'></i> {{ cmsSettings.contactAddress || 'Kost Muslimah Sekar Wangi, Trini, Sinduadi, Kec. Mlati, Kabupaten Sleman, D.I. Yogyakarta 55284' }}</p>
            <p><i class='bx bxs-phone'></i> <a :href="'tel:' + (cmsSettings.contactPhone || '+62 895-3780-20456')">{{ cmsSettings.contactPhone || '+62 895-3780-20456' }}</a></p>
            <p><i class='bx bxs-envelope'></i> <a :href="'mailto:' + (cmsSettings.contactEmail || 'info@sekarspace.com')">{{ cmsSettings.contactEmail || 'info@sekarspace.com' }}</a></p>
          </address>
        </div>
      </div>

      <div class="footer-bottom">
        <p>&copy; 2026 Sekar Space — Kost Muslimah Sekar Wangi. All rights reserved.</p>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  background-color: var(--dark);
  color: var(--tertiary-light);
  padding: 64px 0 24px;
  margin-top: auto;
}

.footer-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1.5fr;
  gap: 40px;
  margin-bottom: 48px;
}

.footer-logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-heading);
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--secondary);
  margin-bottom: 16px;
}

.footer-brand p {
  color: #A08C7D;
  font-size: 0.9rem;
  line-height: 1.6;
  margin-bottom: 20px;
}

.footer-socials {
  display: flex;
  gap: 12px;
}

.footer-socials a {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--secondary);
  font-size: 1.2rem;
  transition: all var(--transition-fast);
}

.footer-socials a:hover {
  background: var(--secondary);
  color: var(--dark);
}

.footer-nav h3,
.footer-contact h3 {
  color: var(--white);
  font-size: 1.1rem;
  margin-bottom: 20px;
}

.footer-nav ul {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.footer-nav a {
  color: #A08C7D;
  font-size: 0.9rem;
  transition: color var(--transition-fast);
}

.footer-nav a:hover {
  color: var(--secondary);
}

.footer-contact address p {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #A08C7D;
  font-size: 0.9rem;
  margin-bottom: 12px;
  font-style: normal;
}

.footer-contact address i {
  color: var(--secondary);
}

.footer-bottom {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding-top: 24px;
  text-align: center;
  font-size: 0.85rem;
  color: #8A7668;
}

@media (max-width: 900px) {
  .footer-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 600px) {
  .footer-grid {
    grid-template-columns: 1fr;
  }
}
</style>
