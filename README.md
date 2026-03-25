# PresensiQR — Vue 3 + Vite

Sistem absensi cerdas berbasis QR Code dinamis.

## Tech Stack

| Layer | Library |
|---|---|
| Framework | Vue 3 (Composition API) |
| Build | Vite 5 |
| State | Pinia |
| Router | Vue Router 4 |
| Map | Leaflet.js |
| QR Scanner | html5-qrcode |
| QR Render | Custom canvas (pure JS, dark-mode proof) |
| Backend | Google Apps Script + Google Sheets |

---

## ⚡ Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Konfigurasi API URL
cp .env.example .env
# Buka .env dan isi VITE_API_URL dengan URL GAS deployment Anda

# 3. Jalankan dev server
npm run dev
# → http://localhost:5173

# 4. Build production
npm run build
```

---

## 🔧 Konfigurasi VITE_API_URL

**WAJIB diisi sebelum app bisa digunakan.**

```env
# .env
VITE_API_URL=https://script.google.com/macros/s/AKfycbxXXXXXXX/exec
```

### Cara dapat URL:
1. Buka Google Sheets → **Extensions → Apps Script**
2. Paste kode `Code.gs` dari project ini
3. **Deploy → New Deployment → Web App**
   - Execute as: **Me**
   - Who has access: **Anyone** ← WAJIB
4. Copy URL `/exec` → paste ke `.env`
5. Jalankan `setupAdmin()` sekali dari editor GAS

---

## 🛡️ CORS — Cara Kerja

Google Apps Script tidak mengembalikan `Access-Control-Allow-Origin` header
jika dipanggil dari browser secara langsung dengan method yang salah.

Project ini menyelesaikan ini dengan **3 lapisan**:

```
Layer 1 — DEV (Vite Proxy)
  Browser → localhost:5173/gas-proxy → Node.js Vite → GAS
  ✅ Tidak ada CORS karena request keluar dari Node, bukan browser

Layer 2 — PROD (POST text/plain)
  Browser → POST GAS URL, Content-Type: text/plain
  ✅ Browser kirim "simple request" (tanpa OPTIONS preflight)
  ✅ GAS merespons dengan CORS header jika deploy "Anyone"

Layer 3 — FALLBACK (GET + query param)
  Browser → GET GAS URL?body={...}
  ✅ Digunakan jika POST gagal (misal dari file://)
```

### Kenapa masih error CORS?

| Penyebab | Solusi |
|---|---|
| `YOUR_SCRIPT_ID` belum diganti | Isi `VITE_API_URL` di `.env` |
| Buka `index.html` langsung (file://) | Jalankan `npm run dev` |
| GAS deploy dengan akses "Only me" | Ubah ke **Anyone** lalu deploy ulang |
| Ubah kode GAS tapi tidak redeploy | Deploy ulang sebagai **New Version** |
| Pakai URL `/dev` bukan `/exec` | Gunakan URL `/exec` |

---

## 📁 Struktur Project

```
src/
├── main.js
├── App.vue
├── style.css                    # Design system global
├── router/index.js              # Vue Router 4 + role guards
├── stores/
│   ├── auth.js                  # Login, session, logout
│   └── accel.js                 # Accelerometer gate logic
├── services/
│   └── api.js                   # API calls + CORS handling
├── utils/
│   ├── qrCanvas.js              # Custom QR canvas renderer
│   ├── maps.js                  # Leaflet helpers
│   └── format.js                # Date/time formatters
├── components/
│   ├── layout/AppNav.vue
│   ├── layout/AppSidebar.vue
│   ├── ui/AccelGate.vue         # Widget verifikasi gerak
│   ├── ui/AppAlert.vue
│   └── ui/CheckinModal.vue
└── views/
    ├── AuthView.vue
    ├── DashView.vue
    ├── SetupKelas.vue
    ├── GenerateQR.vue
    ├── RekapAbsen.vue
    ├── AccelPanel.vue
    ├── GpsPanel.vue
    ├── admin/AdminUsers.vue
    └── mahasiswa/
        ├── ScanQR.vue
        ├── ManualToken.vue
        └── HistoryMhs.vue
```

---

## 👤 Default Admin

```
Email:    admin@kampus.ac.id
Password: Admin123!
```

> Ganti password setelah login pertama!

---

## 📱 Accelerometer Gate

Fitur anti-titip absen: mahasiswa wajib goyangkan HP selama 5 detik sebelum scan QR.

- **HP nyata (HTTPS)**: DeviceMotion API aktif → sensor asli
- **Desktop / localhost**: Simulasi gerak otomatis aktif
- **iOS Safari**: Muncul popup izin sensor → klik Allow
- Data dikirim ke server sebagai telemetry `accel/gate`
