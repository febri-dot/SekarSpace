<script setup lang="ts">
import Navbar from '../components/layout/Navbar.vue'
import Footer from '../components/layout/Footer.vue'
import { RouterLink } from 'vue-router'

const facilities = [
  { icon: 'bx bx-wifi', title: 'WiFi Cepat 24 Jam', desc: 'Internet berkecepatan tinggi tersedia 24 jam untuk kebutuhan belajar dan bekerja.' },
  { icon: 'bx bx-shield-quarter', title: 'Keamanan 24 Jam', desc: 'Sistem keamanan terpadu dengan CCTV dan akses terbatas untuk kenyamanan Anda.' },
  { icon: 'bx bxs-car-garage', title: 'Parkir Luas', desc: 'Area parkir yang memadai untuk motor dan sepeda, aman dan terlindung.' },
  { icon: 'bx bx-fridge', title: 'Dapur Bersama', desc: 'Dapur lengkap dengan peralatan memasak yang bisa digunakan bersama.' },
  { icon: 'bx bxs-washer', title: 'Layanan Laundry', desc: 'Layanan laundry tersedia untuk memudahkan kegiatan sehari-hari Anda.' },
  { icon: 'bx bxs-mosque', title: 'Musholla Nyaman', desc: 'Ruang ibadah yang bersih dan tenang untuk beribadah dengan khusyuk.' }
]
</script>

<template>
  <div class="home-page">
    <Navbar />

    <main class="main-body">
      <!-- HERO SECTION -->
      <section id="hero" class="hero">
        <div class="hero-overlay"></div>
        <div class="hero-content container">
          <span class="hero-badge">
            <i class='bx bxs-star'></i>
            Kost Muslimah Terpercaya
          </span>
          <h1 id="heroHeading">Temukan Hunian<br><span class="text-gradient">Nyaman & Aman</span></h1>
          <p class="hero-desc">
            Sekar Space menyediakan kost muslimah dengan fasilitas lengkap, 
            lingkungan yang kondusif, dan harga terjangkau untuk kenyamanan Anda.
          </p>
          <div class="hero-actions">
            <RouterLink to="/rooms" class="btn btn-primary" id="btnExploreRooms">
              <i class='bx bx-search-alt'></i>
              Lihat Kamar
            </RouterLink>
            <a href="https://wa.me/6281234567890" class="btn btn-ghost" id="btnWhatsapp" target="_blank" rel="noopener">
              <i class='bx bxl-whatsapp'></i>
              Hubungi Kami
            </a>
          </div>
          <div class="hero-stats">
            <div class="stat-item">
              <strong>50+</strong>
              <span>Penyewa Puas</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <strong>15+</strong>
              <span>Kamar Tersedia</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <strong>4.8</strong>
              <span>Rating Kualitas</span>
            </div>
          </div>
        </div>
      </section>

      <!-- FACILITIES SECTION -->
      <section id="facilities" class="section facilities">
        <div class="container">
          <header class="section-header">
            <span class="section-tag">Keunggulan Kami</span>
            <h2>Fasilitas <span class="text-gradient">Lengkap</span></h2>
            <p>Kami menyediakan berbagai fasilitas untuk menunjang kenyamanan dan keamanan Anda selama tinggal.</p>
          </header>

          <div class="facilities-grid">
            <article 
              v-for="(fac, index) in facilities" 
              :key="index" 
              class="facility-card"
            >
              <div class="facility-icon">
                <i :class="fac.icon"></i>
              </div>
              <h3>{{ fac.title }}</h3>
              <p>{{ fac.desc }}</p>
            </article>
          </div>
        </div>
      </section>

      <!-- ROOMS PREVIEW SECTION -->
      <section id="rooms" class="section rooms">
        <div class="container">
          <header class="section-header">
            <span class="section-tag">Pilihan Kamar</span>
            <h2>Pilih Tipe <span class="text-gradient">Kamar</span></h2>
            <p>Kami menyediakan pilihan tipe kamar yang disesuaikan dengan kebutuhan dan budget Anda.</p>
          </header>

          <div class="room-comparison">
            <!-- Kamar Mandi Luar -->
            <RouterLink to="/rooms?tipe=km-luar" class="room-type-card">
              <div class="room-type-image-wrapper">
                <img src="/assets/images/room-single.png" alt="Tipe Kamar Mandi Luar" class="room-type-img">
                <div class="room-type-img-overlay"></div>
                <div class="room-type-icon-badge">
                  <i class='bx bx-door-open'></i>
                </div>
              </div>
              <div class="room-type-content">
                <span class="room-type-tag">Terjangkau</span>
                <h3>Kamar Mandi Luar</h3>
                <p class="room-type-desc">Kamar nyaman dengan akses kamar mandi bersama yang selalu bersih dan terawat.</p>
                <ul class="room-type-features">
                  <li><i class='bx bx-check-circle'></i> Ukuran 3 × 3 meter</li>
                  <li><i class='bx bx-check-circle'></i> Kasur & Lemari</li>
                  <li><i class='bx bx-check-circle'></i> WiFi 24 Jam</li>
                  <li><i class='bx bx-check-circle'></i> Listrik Token</li>
                </ul>
                <div class="room-type-price">
                  <span class="price-from">Mulai dari</span>
                  <strong>Rp 700.000<span>/bulan</span></strong>
                </div>
                <div class="room-type-cta">
                  <span>Lihat Kamar Tersedia</span>
                  <i class='bx bx-right-arrow-alt'></i>
                </div>
              </div>
            </RouterLink>

            <div class="room-comparison-divider">
              <span>atau</span>
            </div>

            <!-- Kamar Mandi Dalam -->
            <RouterLink to="/rooms?tipe=km-dalam" class="room-type-card room-type-premium">
              <div class="room-type-badge-float">
                <i class='bx bxs-star'></i> Populer
              </div>
              <div class="room-type-image-wrapper">
                <img src="/assets/images/room-deluxe.png" alt="Tipe Kamar Mandi Dalam" class="room-type-img">
                <div class="room-type-img-overlay"></div>
                <div class="room-type-icon-badge">
                  <i class='bx bx-bath'></i>
                </div>
              </div>
              <div class="room-type-content">
                <span class="room-type-tag tag-premium">Premium</span>
                <h3>Kamar Mandi Dalam</h3>
                <p class="room-type-desc">Privasi lebih dengan kamar mandi dalam yang nyaman, bersih, dan eksklusif.</p>
                <ul class="room-type-features">
                  <li><i class='bx bx-check-circle'></i> Ukuran 3 × 4 meter</li>
                  <li><i class='bx bx-check-circle'></i> Kamar Mandi Dalam</li>
                  <li><i class='bx bx-check-circle'></i> Kasur & Lemari</li>
                  <li><i class='bx bx-check-circle'></i> WiFi 24 Jam</li>
                </ul>
                <div class="room-type-price">
                  <span class="price-from">Mulai dari</span>
                  <strong>Rp 950.000<span>/bulan</span></strong>
                </div>
                <div class="room-type-cta">
                  <span>Lihat Kamar Tersedia</span>
                  <i class='bx bx-right-arrow-alt'></i>
                </div>
              </div>
            </RouterLink>
          </div>
        </div>
      </section>

      <!-- CONTACT SECTION -->
      <section id="contact" class="section contact">
        <div class="container">
          <header class="section-header">
            <span class="section-tag">Hubungi Kami</span>
            <h2>Lokasi & <span class="text-gradient">Kontak</span></h2>
            <p>Kunjungi langsung lokasi kami atau hubungi pengelola untuk pemesanan.</p>
          </header>

          <div class="contact-grid">
            <div class="contact-info-wrapper">
              <address class="contact-details">
                <div class="contact-item">
                  <div class="contact-icon">
                    <i class='bx bxs-map'></i>
                  </div>
                  <div>
                    <h3>Alamat</h3>
                    <p>Jl. Sekar Wangi No. 123<br>Kota, Provinsi 12345</p>
                  </div>
                </div>
                <div class="contact-item">
                  <div class="contact-icon">
                    <i class='bx bxs-phone'></i>
                  </div>
                  <div>
                    <h3>Telepon</h3>
                    <p><a href="tel:+6281234567890">+62 812-3456-7890</a></p>
                  </div>
                </div>
                <div class="contact-item">
                  <div class="contact-icon">
                    <i class='bx bxs-envelope'></i>
                  </div>
                  <div>
                    <h3>Email</h3>
                    <p><a href="mailto:info@sekarspace.com">info@sekarspace.com</a></p>
                  </div>
                </div>
                <div class="contact-item">
                  <div class="contact-icon">
                    <i class='bx bxs-time'></i>
                  </div>
                  <div>
                    <h3>Jam Operasional</h3>
                    <p>Senin – Sabtu: 08.00 – 17.00<br>Minggu: Dengan perjanjian</p>
                  </div>
                </div>
              </address>

              <div class="contact-cta-group">
                <a href="https://wa.me/6281234567890?text=Halo%20Sekar%20Space%2C%20saya%20ingin%20bertanya" 
                   class="contact-cta-btn cta-wa" target="_blank" rel="noopener">
                  <i class='bx bxl-whatsapp'></i>
                  <span>Hubungi via WhatsApp</span>
                </a>
                <a href="https://www.google.com/maps/search/?api=1&query=-6.2,106.8" 
                   class="contact-cta-btn cta-maps" target="_blank" rel="noopener">
                  <i class='bx bxs-map-pin'></i>
                  <span>Buka Google Maps</span>
                </a>
              </div>
            </div>

            <div class="contact-map">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.0!2d106.8!3d-6.2!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNsKwMTInMDAuMCJTIDEwNsKwNDgnMDAuMCJF!5e0!3m2!1sid!2sid!4v1700000000000!5m2!1sid!2sid"
                width="100%"
                height="100%"
                style="border:0; border-radius: 16px;"
                allowfullscreen
                loading="lazy"
                title="Lokasi Sekar Space Google Maps">
              </iframe>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- FLOATING WHATSAPP -->
    <a href="https://wa.me/6281234567890" class="floating-wa" target="_blank" rel="noopener" aria-label="Hubungi via WhatsApp">
      <i class='bx bxl-whatsapp'></i>
    </a>

    <Footer />
  </div>
</template>

<style scoped>
.home-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.main-body {
  flex: 1;
  padding-top: 70px;
}

/* HERO SECTION */
.hero {
  position: relative;
  min-height: calc(100vh - 70px);
  display: flex;
  align-items: center;
  background: url('/assets/images/hero-bg.png') center/cover no-repeat;
  padding: 80px 0;
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(253, 251, 249, 0.94) 0%, rgba(241, 226, 209, 0.88) 100%);
}

.hero-content {
  position: relative;
  z-index: 2;
  max-width: 780px;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 16px;
  background: var(--tertiary);
  color: var(--primary);
  border-radius: var(--radius-full);
  font-weight: 600;
  font-size: 0.85rem;
  margin-bottom: 24px;
}

.hero h1 {
  font-size: 3.2rem;
  margin-bottom: 20px;
  letter-spacing: -1px;
}

.hero-desc {
  font-size: 1.15rem;
  color: var(--text);
  margin-bottom: 32px;
  max-width: 600px;
}

.hero-actions {
  display: flex;
  gap: 16px;
  margin-bottom: 48px;

}

.hero-stats {
  display: flex;
  align-items: center;
  gap: 32px;
  padding-top: 32px;
  border-top: 1px solid rgba(84, 26, 26, 0.12);
}

.stat-item strong {
  display: block;
  font-family: var(--font-heading);
  font-size: 1.8rem;
  color: var(--primary);
  line-height: 1;
}

.stat-item span {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.stat-divider {
  width: 1px;
  height: 36px;
  background: rgba(84, 26, 26, 0.15);
}

/* SECTION STYLES */
.section {
  padding: var(--section-padding);
}

.section-header {
  text-align: center;
  max-width: 600px;
  margin: 0 auto 56px;
}

.section-tag {
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.2px;
  color: var(--primary);
  display: block;
  margin-bottom: 8px;
}

.section-header h2 {
  font-size: 2.2rem;
  margin-bottom: 12px;
}

.section-header p {
  color: var(--text-muted);
}

/* FACILITIES */
.facilities {
  background-color: var(--white);
}

.facilities-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 28px;
}

.facility-card {
  padding: 32px 24px;
  border-radius: var(--radius-lg);
  background: var(--off-white);
  border: 1px solid var(--border);
  transition: all var(--transition-smooth);
}

.facility-card:hover {
  transform: translateY(-6px);
  box-shadow: var(--shadow-lg);
  border-color: var(--secondary);
}

.facility-icon {
  width: 54px;
  height: 54px;
  border-radius: var(--radius-md);
  background: var(--tertiary);
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.6rem;
  margin-bottom: 20px;
}

.facility-card h3 {
  font-size: 1.2rem;
  margin-bottom: 10px;
}

.facility-card p {
  font-size: 0.92rem;
  color: var(--text-muted);
  line-height: 1.6;
}

/* ROOMS COMPARISON */
.rooms {
  background-color: var(--off-white);
}

.room-comparison {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 24px;
  align-items: center;
}

.room-type-card {
  background: var(--white);
  border-radius: var(--radius-xl);
  border: 1px solid var(--border);
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
  transition: all var(--transition-smooth);
}

.room-type-card:hover {
  transform: translateY(-8px);
  box-shadow: var(--shadow-xl);
  border-color: var(--secondary);
}

.room-type-badge-float {
  position: absolute;
  top: 16px;
  right: 16px;
  background: var(--primary);
  color: var(--white);
  font-size: 0.75rem;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: var(--radius-full);
  z-index: 10;
}

.room-type-image-wrapper {
  position: relative;
  height: 220px;
  overflow: hidden;
}

.room-type-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--transition-smooth);
}

.room-type-card:hover .room-type-img {
  transform: scale(1.05);
}

.room-type-icon-badge {
  position: absolute;
  bottom: 16px;
  left: 16px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--white);
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  box-shadow: var(--shadow-md);
}

.room-type-content {
  padding: 24px;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.room-type-tag {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--primary);
  text-transform: uppercase;
  margin-bottom: 6px;
}

.room-type-tag.tag-premium {
  color: #B8860B;
}

.room-type-content h3 {
  font-size: 1.35rem;
  margin-bottom: 8px;
}

.room-type-desc {
  font-size: 0.9rem;
  color: var(--text-muted);
  margin-bottom: 16px;
}

.room-type-features {
  margin-bottom: 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.room-type-features li {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.88rem;
}

.room-type-features i {
  color: var(--primary);
}

.room-type-price {
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px solid var(--border);
}

.price-from {
  display: block;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.room-type-price strong {
  font-size: 1.4rem;
  color: var(--primary);
}

.room-type-price strong span {
  font-size: 0.85rem;
  font-weight: 400;
  color: var(--text-muted);
}

.room-type-cta {
  margin-top: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--primary);
}

.room-comparison-divider {
  text-align: center;
  font-family: var(--font-heading);
  font-weight: 600;
  color: var(--text-muted);
  background: var(--tertiary);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
}

/* CONTACT */
.contact {
  background: var(--white);
}

.contact-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
}

.contact-details {
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin-bottom: 32px;
  font-style: normal;
}

.contact-item {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.contact-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  background: var(--tertiary);
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  flex-shrink: 0;
}

.contact-item h3 {
  font-size: 1rem;
  margin-bottom: 4px;
}

.contact-item p {
  font-size: 0.9rem;
  color: var(--text-muted);
  line-height: 1.5;
}

.contact-cta-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.contact-cta-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 14px 24px;
  border-radius: var(--radius-lg);
  font-weight: 600;
  font-size: 0.95rem;
  transition: all var(--transition-smooth);
}

.cta-wa {
  background: #25D366;
  color: white;
}

.cta-wa:hover {
  background: #20b858;
}

.cta-maps {
  background: var(--tertiary);
  color: var(--primary);
}

.cta-maps:hover {
  background: var(--secondary);
}

.contact-map {
  min-height: 380px;
}

@media (max-width: 900px) {
  .hero h1 {
    font-size: 2.4rem;
  }
  .facilities-grid {
    grid-template-columns: 1fr 1fr;
  }
  .room-comparison {
    grid-template-columns: 1fr;
  }
  .contact-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .facilities-grid {
    grid-template-columns: 1fr;
  }
}
</style>
