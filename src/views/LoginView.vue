<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useAuth } from '../composables/useAuth'

const router = useRouter()
const { login } = useAuth()

const username = ref('')
const password = ref('')
const errorMessage = ref('')
const isLoading = ref(false)

const handleLogin = () => {
  if (!username.value || !password.value) {
    errorMessage.value = 'Mohon isi username dan password.'
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  setTimeout(() => {
    const result = login(username.value, password.value)
    isLoading.value = false

    if (result.success && result.user) {
      if (result.user.role === 'admin') {
        router.push('/admin/tenants')
      } else {
        router.push('/user')
      }
    } else {
      errorMessage.value = result.message
    }
  }, 400)
}

const quickLoginAdmin = () => {
  username.value = 'admin'
  password.value = 'admin123'
  handleLogin()
}

const quickLoginMember = () => {
  username.value = 'keyla'
  password.value = 'user123'
  handleLogin()
}
</script>

<template>
  <div class="login-page">
    <RouterLink to="/" class="back-home-btn">
      <i class='bx bx-left-arrow-alt'></i> Beranda
    </RouterLink>

    <div class="login-container">
      <div class="login-card">
        <div class="brand-header">
          <RouterLink to="/" class="login-logo">
            <i class='bx bxs-home-heart'></i>
            <span>Sekar<strong>Space</strong></span>
          </RouterLink>
          <h2>Masuk ke Akun Anda</h2>
          <p>Silakan masuk menggunakan akun Penyewa atau Admin Kost</p>
        </div>

        <div v-if="errorMessage" class="alert-error">
          <i class='bx bx-error-circle'></i> {{ errorMessage }}
        </div>

        <form @submit.prevent="handleLogin" class="login-form">
          <div class="form-group">
            <label>Username / Email</label>
            <div class="input-icon-wrapper">
              <i class='bx bx-user'></i>
              <input 
                type="text" 
                v-model="username" 
                placeholder="Masukkan username Anda" 
                required 
              />
            </div>
          </div>

          <div class="form-group">
            <label>Password</label>
            <div class="input-icon-wrapper">
              <i class='bx bx-lock-alt'></i>
              <input 
                type="password" 
                v-model="password" 
                placeholder="Masukkan password Anda" 
                required 
              />
            </div>
          </div>

          <button type="submit" class="btn btn-primary login-btn" :disabled="isLoading">
            <span v-if="!isLoading"><i class='bx bx-log-in'></i> Masuk Sekarang</span>
            <span v-else><i class='bx bx-loader-alt bx-spin'></i> Memproses...</span>
          </button>
        </form>

        <div class="quick-demo-box">
          <span class="demo-title">Atau Gunakan Quick Demo Login:</span>
          <div class="demo-buttons">
            <button class="demo-btn admin-demo" @click="quickLoginAdmin">
              <i class='bx bxs-shield'></i> Login Admin
            </button>
            <button class="demo-btn member-demo" @click="quickLoginMember">
              <i class='bx bxs-user-badge'></i> Login Member (Keyla)
            </button>
          </div>
        </div>

        <div class="login-footer-info">
          <p><i class='bx bx-info-circle'></i> Ingin mendaftar akun baru? Pendaftaran akun member baru hanya dapat dibuat langsung oleh <strong>Admin Pengelola Kost Sekar Space</strong>.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--tertiary-light) 0%, var(--tertiary) 100%);
  padding: 24px;
  position: relative;
}

.back-home-btn {
  position: absolute;
  top: 24px;
  left: 24px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--primary);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-fast);
}

.back-home-btn:hover {
  background: var(--primary);
  color: var(--white);
}

.login-container {
  width: 100%;
  max-width: 440px;
}

.login-card {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  padding: 36px 32px;
  box-shadow: var(--shadow-xl);
}

.brand-header {
  text-align: center;
  margin-bottom: 28px;
}

.login-logo {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-heading);
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--primary);
  margin-bottom: 12px;
}

.login-logo i {
  font-size: 1.8rem;
}

.brand-header h2 {
  font-size: 1.5rem;
  margin-bottom: 6px;
}

.brand-header p {
  font-size: 0.88rem;
  color: var(--text-muted);
}

.alert-error {
  background: var(--danger-bg);
  color: var(--danger);
  padding: 12px 16px;
  border-radius: var(--radius-md);
  font-size: 0.88rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
  margin-bottom: 24px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 0.85rem;
  font-weight: 600;
}

.input-icon-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon-wrapper i {
  position: absolute;
  left: 14px;
  font-size: 1.2rem;
  color: var(--text-muted);
}

.input-icon-wrapper input {
  width: 100%;
  padding: 12px 14px 12px 42px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  outline: none;
  font-size: 0.92rem;
  transition: border-color var(--transition-fast);
}

.input-icon-wrapper input:focus {
  border-color: var(--primary);
}

.login-btn {
  width: 100%;
  padding: 14px;
  font-size: 0.95rem;
  margin-top: 4px;
}

.quick-demo-box {
  background: var(--off-white);
  border: 1px dashed var(--border);
  border-radius: var(--radius-lg);
  padding: 16px;
  text-align: center;
  margin-bottom: 20px;
}

.demo-title {
  display: block;
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  margin-bottom: 10px;
}

.demo-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.demo-btn {
  border: none;
  padding: 8px 10px;
  border-radius: var(--radius-md);
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  transition: all var(--transition-fast);
}

.admin-demo {
  background: var(--primary);
  color: white;
}

.admin-demo:hover {
  background: var(--primary-light);
}

.member-demo {
  background: var(--tertiary);
  color: var(--primary);
}

.member-demo:hover {
  background: var(--secondary);
}

.login-footer-info {
  border-top: 1px solid var(--border);
  padding-top: 16px;
  font-size: 0.8rem;
  color: var(--text-muted);
  line-height: 1.5;
  text-align: center;
}
</style>
