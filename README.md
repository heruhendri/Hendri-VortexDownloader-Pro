# Hendri VortexDownloader Pro 🚀
**A powerful, server-secured, purely self-hosted, multi-platform media downloader with a responsive Bento Grid interface, real-time download tracking charts, and an encrypted Telegram Backup/Restore utility.**

Aplikasi ini dibangun menggunakan **TypeScript, React, Next.js (App Router), Recharts, Tailwind CSS (v4), Framer Motion**, serta memanfaatkan **Google Gemini API** (Server-Side) untuk kecerdasan fitur captions generatif. 

Aplikasi ini dirancang khusus untuk **berdiri sendiri (100% standalone)** pada server VPS/NAT-VPS Anda tanpa bergantung pada API pengunduh pihak ketiga (tanpa Cobalt, tanpa downloader SaaS eksternal). Aplikasi langsung mengekstrak metadata dan stream video dari CDN platform asli dari server Anda sendiri.

---

## 🌟 FITUR UTAMA (FEATURES)

1. **100% Mandiri (Self-Hosted)**: Menggunakan engine pengunduh lokal **yt-dlp** premium yang berjalan langsung di kernel Ubuntu Anda untuk menjamin privasi maksimum dan ketiadaan limits API pihak ketiga.
2. **Bento Grid Premium UI**: Desain antarmuka bento-grid yang modern, bersih, intuitif, dan responsif.
3. **Multi-Platform Extractor**: Mendukung ekstraksi video & audio instan dari YouTube, TikTok, Instagram Reels, Twitter/X, Facebook, dll.
4. **Grafik Penggunaan Interaktif**: Grafik statistik interaktif (Recharts) yang memantau total bandwidth (dalam GB) dan hits file terunduh secara langsung.
5. **Sinkronisasi Telegram Bot**: Otomatisasi pengiriman link / berkas hasil unduhan langsung ke Telegram Pribadi/Grup Anda.
6. **Cadangan & Pemulihan (Hendri Backup-Restore)**: Mengenkripsi seluruh preferensi Anda dan Token API menjadi sebuah kode unik aman, dikirimkan langsung ke Telegram untuk kemudian dipulihkan saat migrasi device.
7. **Server-Side Security**: Seluruh API Key (seperti Gemini API Key) tersimpan rapat secara server-side tanpa kebocoran ke browser klien.

---

## 🛠️ PERSYARATAN SISTEM & DEPENDENSI (SYSTEM & DEPENDENCIES REQUIREMENT)

Untuk menjalankan aplikasi ini dengan sukses di VPS/NAT-VPS Ubuntu Anda sendiri, sediakan beberapa dependensi berikut:

### 1. Spesifikasi Server Minimum
- **OS**: Ubuntu 20.04 LTS, 22.04 LTS, atau 24.04 LTS.
- **CPU**: 1 Core (vCPU) sudah sangat cukup.
- **RAM**: Minimum **512 MB**, disarankan **1 GB**.
  *Catatan Khusus NAT VPS*: Apabila RAM VPS Anda sangat kecil (256MB atau 512MB), pastikan membuat **Swap space** minimal 1-2 GB guna memuluskan proses compile/build Next.js (`npm run build`).

### 2. Dependensi Utama System (Ubuntu Packages)
- **Node.js**: Versi **v18.x** atau **v20.x** (Disarankan LTS v20.x).
- **NPM**: Versi **v9.x** atau **v10.x** (Otomatis terinstal bersama Node.js).
- **yt-dlp**: Versi rilis terbaru (Direkomendasikan rilis binary/nightly independen agar auto-update bekerja dengan baik).
- **ffmpeg**: Pemroses format multimedia yang diperlukan oleh `yt-dlp` untuk memisahkan/menggabungkan audio video.
- **PM2**: Node Process Manager untuk memastikan aplikasi selalu online di background.
- **Nginx** (Opsional, direkomendasikan): Sebagai reverse proxy port 3000 ke port publik HTTP (80) & HTTPS (443).
- **Cloudflare Tunnel** (Sangat disarankan jika menggunakan **NAT VPS** yang tidak memiliki IP Publik IPv4 khusus).

---

## 🚀 PANDUAN INSTALASI LANGKAH DEMI LANGKAH DI VPS/NAT-VPS UBUNTU

Ikuti instruksi terminal di bawah ini untuk memulai instalasi secara bersih:

### Langkah 1: Update & Install Software Dasar
Buka terminal SSH Anda ke Ubuntu Server, lalu jalankan:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git ufw build-essential ffmpeg python3-pip
```

### Langkah 2: Install Node.js LTS (v20) via NodeSource
Instal jalurnya secara bersih dari nodesource:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verifikasi instalasi Node
node -v
npm -v
```

### Langkah 3: Install Binary yt-dlp Terbaru (PENTING)
Jangan menginstal `yt-dlp` dari repository default Ubuntu `apt` biasa, karena versinya sering tertinggal jauh dan dapat menyebabkan kegagalan ekstraksi video TikTok atau YouTube. Pasang binary rilis langsung dari Github resmi:
```bash
# Unduh kompilasi binary yt-dlp resmi terbaru
sudo wget https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -O /usr/local/bin/yt-dlp

# Ubah permission agar bisa dieksekusi oleh sistem hosting
sudo chmod a+rx /usr/local/bin/yt-dlp

# Verifikasi versi yt-dlp Anda
yt-dlp --version
```
*(Catatan: Anda dapat memperbarui yt-dlp kapan saja di masa depan cukup dengan mengetik: `sudo yt-dlp -U`)*

### Langkah 4: Clone Project dari GitHub ke VPS
Di server Anda, lakukan clone terhadap repositori Anda:
```bash
git clone https://github.com/USERNAME/REPOSITORI-ANDA.git hendri-downloader
cd hendri-downloader
```

### Langkah 5: Manajemen RAM Ketat (PENTING untuk NAT VPS / RAM < 1GB)
Next.js membutuhkan RAM yang memadai saat membuild project (`npm run build`). Jika NAT VPS Anda mengalami kendala kehabisan RAM, pasang virtual memori Swap:
```bash
# Membuat Swap File sebesar 1.5 GB
sudo fallocate -l 1.5G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Sifat permanen pasca reboot
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### Langkah 6: Install Node Dependencies
Gunakan npm untuk mengunduh seluruh package yang tercatat di `package.json`:
```bash
npm install
```

### Langkah 7: Konfigurasi Environment Variables (`.env`)
Salin berkas contoh konfigurasi ke berkas aktif `.env` Anda:
```bash
cp .env.example .env
```
Edit berkas `.env` menggunakan teks editor (misalnya `nano`):
```bash
nano .env
```
Masukkan parameter rahasia API Key Anda (Contoh: Google Gemini API) untuk asisten caption:
```env
# Dapatkan Gemini API Key gratis di Google AI Studio (https://aistudio.google.com/)
GEMINI_API_KEY=YOUR_ACTUAL_GEMINI_API_KEY_HERE
```
> *Catatan: Tekan `Ctrl + O` lalu `Enter` untuk menyimpan, kemudian `Ctrl + X` untuk keluar dari editor nano.*

### Langkah 8: Build Project Next.js ke Mode Produksi
Lakukan compile kode TypeScript dan markup ke kode HTML/JS statis produksi berkecepatan tinggi:
```bash
npm run build
```

---

## ⚡ MENJALANKAN APLIKASI DI BACKGROUND DENGAN PM2

Agar aplikasi Next.js Anda tidak mati saat jendela terminal SSH ditutup, jalankan di background menggunakan **PM2**:

1. **Install PM2 secara global**:
   ```bash
   sudo npm install pm2 -g
   ```

2. **Jalankan Aplikasi dengan PM2**:
   ```bash
   pm2 start npm --name "hendri-downloader" -- start
   ```

3. **Pastikan PM2 otomatis aktif kembali setelah server reboot**:
   ```bash
   pm2 startup
   # Jalankan perintah sudo env PATH... yang dihasilkan oleh terminal Anda setelah mengetik "pm2 startup"
   pm2 save
   ```

4. **Operasi PM2 Umum**:
   - Melihat status: `pm2 status`
   - Melihat real-time logs: `pm2 logs hendri-downloader`
   - Restart aplikasi: `pm2 restart hendri-downloader`
   - Stop aplikasi: `pm2 stop hendri-downloader`

---

## 🌐 KONFIGURASI JARINGAN & REVERSE PROXY (KHUSUS VPS / NAT VPS)

Secara default, aplikasi Next.js ini akan berjalan di port internal **3000**. Berikut cara mengarahkan trafik Internet ke aplikasi Anda:

### Opsi A: Menggunakan Nginx (Untuk VPS Ber-IP Public IPv4)
Instal Nginx untuk menerima lalu lintas pada port standar HTTP (80) dan mengarahkannya ke port 3000:
```bash
sudo apt install nginx -y
sudo nano /etc/nginx/sites-available/hendri-downloader
```
Tempelkan konfigurasi proxy block berikut:
```nginx
server {
    listen 80;
    server_name domain_kamu.com; # Ganti dengan domain atau IP Public server Anda

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```
Aktifkan konfigurasi dan muat ulang Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/hendri-downloader /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

Untuk mengaktifkan SSL HTTPS gratis, pasang Certbot:
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d domain_kamu.com
```

### Opsi B: Menggunakan Cloudflare Tunnel (Sangat Direkomendasikan untuk NAT VPS)
NAT VPS biasanya tidak memiliki akses IPv4 publik langsung, melainkan menggunakan pembagian port eksternal (Shared IP). Solusi termudah tanpa perlu pusing mencocokkan port forwarded dari provider adalah memakai **Cloudflare Tunnel (Cloudflared)**:

1. **Daftarkan Domain** Anda ke Cloudflare DNS secara gratis.
2. Di dashboard Cloudflare, buka menu **Zero Trust** -> **Networks** -> **Tunnels** -> **Create a Tunnel**.
3. Pilih opsi **Cloudflared connector** dan instal service `cloudflared` di Ubuntu server Anda sesuai perintah yang didapatkan dari halaman Cloudflare.
4. Di panel pengaturan jalur Tunnel, konfigurasikan:
   - **Service Type**: `HTTP`
   - **URL / Address**: `localhost:3000`
5. Selesai! Aplikasi Anda kini dapat diakses secara publik melalui domain aman HTTPS (misalnya `https://downloader.hendri.my.id`) secara langsung dari NAT VPS Anda tanpa perlu open port manual.

---

## ⚠️ MENGATASI ERROR "502 BAD GATEWAY" DI VPS / NAT VPS

Jika Anda menemui status **502 Bad Gateway** di browser Anda setelah mengonfigurasi Nginx, ini berarti server web **Nginx berjalan dengan baik**, tetapi **tidak dapat terhubung ke aplikasi Next.js** yang seharusmya berjalan di port `3000`.

Ikuti langkah-langkah diagnostik dan solusi berikut untuk mengatasinya secara tuntas:

### 1. Periksa Apakah Aplikasi Next.js Sedang Berjalan (Running)
Jalan perintah berikut untuk melihat status process PM2:
```bash
pm2 status
```
Jika statusnya menunjukkan `errored`, `stopped`, atau angka restart-nya terus bertambah (`restart loop`), artinya aplikasi Anda gagal melakukan start-up.
- **Solusinya**: Periksa logs error dengan mengetik:
  ```bash
  pm2 logs hendri-downloader
  ```
- **Penyebab Umum**: Lupa melakukan `npm run build` sebelum menjalankan PM2, atau file `.env` tidak lengkap / tidak ada.

### 2. Bentrokan Port 3000 (Port Already in Use)
Next.js secara default berjalan pada port `3000`. Jika ada aplikasi lain (seperti Node app lain atau Docker) yang sudah menduduki port tersebut, aplikasi Anda akan gagal memikat port tersebut dan mati seketika.
- **Cara mendeteksinya**:
  ```bash
  sudo lsof -i :3000
  ```
- **Solusinya**: Matikan aplikasi yang menggunakan port tersebut (`kill -9 <PID>`) atau ubah port aplikasi Hendri VortexDownloader Pro ke port lain (misal port `3005`).
  Menjalankan di port alternatif dengan PM2:
  ```bash
  PORT=3005 pm2 start npm --name "hendri-downloader" -- start
  ```
  *(Ingatlah untuk menyesuaikan `proxy_pass http://127.0.0.1:3005;` pada file konfigurasi Nginx Anda).*

### 3. Resolusi Alamat IP Lokal (IPv6 `[::1]` vs IPv4 `127.0.0.1`)
Pada Ubuntu Server modern, `localhost` sering kali mengarah ke alamat IPv6 Loopback `[::1]`. Jika Next.js mengikat dirinya ke IPv6 tetapi Nginx dikonfigurasi untuk mencari di IPv4 (`127.0.0.1`), Nginx akan ditolak saat mencoba menyambung, menghasilkan error `502 Bad Gateway`.
- **Solusi Terbaik**: Paksa aplikasi Next.js untuk secara eksplisit berjalan menggunakan IPv4 `127.0.0.1` saat dihidupkan oleh PM2.
  Gunakan perintah PM2 berikut untuk memastikan binding IPv4 sempurna:
  ```bash
  HOST=127.0.0.1 PORT=3000 pm2 start npm --name "hendri-downloader" -- start
  ```
  Ubah juga baris di konfigurasi Nginx Anda dari `proxy_pass http://localhost:3000;` menjadi spesifik:
  ```nginx
  proxy_pass http://127.0.0.1:3000;
  ```

### 4. Menjalankan Next.js Output Standalone (Alternatif Ramah RAM Hemat)
Karena aplikasi ini dikonfigurasi menggunakan mode `standalone` di `next.config.ts` untuk menghemat memori server, Anda bisa langsung menjalankan server produksi Next.js menggunakan Node native tanpa perlu melalui runner npm. Cara ini jauh lebih stabil dan sangat hemat RAM di NAT-VPS:
```bash
# Salin aset statis ke folder standalone (Hanya dilakukan sekali saja)
cp -r public .next/standalone/
cp -r .next/static .next/standalone/.next/

# Jalankan server menggunakan PM2 secara langsung
HOST=127.0.0.1 PORT=3000 pm2 start .next/standalone/server.js --name "hendri-downloader-standalone"
```

### 5. Jangan Lupa Reload Nginx setelah Setiap Perubahan
Setelah Anda melakukan modifikasi pada konfigurasi Server Block Nginx, pastikan konfigurasinya bebas dari typo dan restart service Nginx:
```bash
sudo nginx -t
sudo systemctl restart nginx
```

---

## ☁️ 🚀 PANDUAN DEPLOY DI SHARED HOSTING / cPANEL NODE.JS (TANPA ROOT ACCES)

Jika Anda ingin meng-host aplikasi **Hendri VortexDownloader Pro** ini di shared hosting biasa (misal: cPanel hosting yang memiliki fitur **Setup Node.js App**), Anda **tidak memiliki akses sudo/root** untuk menginstal `yt-dlp` dan `ffmpeg` secara global.

Aplikasi ini sudah dimodifikasi sehingga mendukung **Portabilitas Tanpa Root** dengan sangat cerdas. Di bawah ini adalah langkah-langkah implementasinya:

### Langkah 1: Siapkan Folder `bin` Lokal
1. Di komputer lokal Anda atau via cPanel File Manager, buat sebuah folder bernama **`bin`** di akar proyek (di sebelah folder `app`, `package.json`, dll).
2. Unduh biner static **`yt-dlp`** dan **`ffmpeg`** untuk Linux x86_64:
   - **yt-dlp (Linux release)**: [Unduh di sini](https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp)
   - **ffmpeg (Linux Static builds)**: [Unduh static ffmpeg goni/johnvansickle](https://johnvansickle.com/ffmpeg/) (pilih file biner `ffmpeg` saja).
3. Upload kedua file biner (`yt-dlp` dan `ffmpeg`) ke dalam folder `bin` yang baru saja Anda buat.
4. **PENTING**: Berikan izin eksekusi (*permission*) pada kedua file tersebut menjadi **755** (Melalui cPanel File Manager, klik kanan file -> *Change Permissions* -> centang semua kolom *Execute*).

### Langkah 2: Buat Aplikasi Node.js di cPanel
1. Masuk ke cPanel Anda, cari menu **"Setup Node.js App"**.
2. Klik **"Create Application"**:
   - **Node.js Version**: Pilih **v18.x** atau **v20.x** (disarankan v20).
   - **Application Mode**: `Production`.
   - **Application Root**: Tuliskan nama folder tempat Anda mengunggah source code proyek (misal `hendri-downloader`).
   - **Application URL**: Pilih subdomain atau domain yang ingin digunakan.
   - **Application Startup File**: Tuliskan `.next/standalone/server.js` atau `server.js` tergantung konfigurasi hosting Anda.

### Langkah 3: Build di Komputer Lokal / VPS Lalu Upload ke cPanel
Karena Shared Hosting sering membatasi penggunaan RAM dan CPU yang ketat (misal limit 512MB RAM), menjalankan `npm run build` langsung di terminal cPanel sering kali terkena kill otomatis / gagal.
- **Solusi Terbaik**:
  1. Jalankan `npm run build` di terminal laptop Anda terlebih dahulu.
  2. Kompresi seluruh folder berikut menjadi file `.zip` (Kecuali `node_modules`):
     - `.next`
     - `public`
     - `bin` (berisi biner `yt-dlp` dan `ffmpeg` lokal)
     - `app`, `lib`, `hooks` (opsional untuk backup)
     - `package.json`
     - `.env.example`
  3. Upload file `.zip` tersebut ke folder Shared Hosting Anda menggunakan cPanel File Manager, lalu ekstrak.
  4. Salin file `.next/standalone/server.js` ke folder root aplikasi cPanel Anda (jika installer cPanel meminta startup file di root).
  5. Salin isi folder `.next/static` ke dalam `.next/standalone/.next/static` dan isi folder `public` ke `.next/standalone/public` untuk melengkapi package standalone.

### Langkah 4: Tambahkan Environment Variable Kustom
Di menu **Setup Node.js App** cPanel, tambahkan variabel berikut di kolom **"Environment Variables"**:
- `GEMINI_API_KEY` = (Kunci API Google Gemini Anda)
- `YT_DLP_PATH` = `/home/USERNAME_CPANEL/nama_folder_aplikasi/bin/yt-dlp`
- `FFMPEG_PATH` = `/home/USERNAME_CPANEL/nama_folder_aplikasi/bin/ffmpeg`

*(Sesuaikan `home/USERNAME_CPANEL/...` dengan file path absolut direktori Anda). Jika Anda mengosongkannya, sistem secara cerdas akan mendeteksi folder biner `./bin/x` secara otomatis!*

### Langkah 5: Start & Jalankan Aplikasi
1. Klik tombol **"Run JS Install"** di panel cPanel Node.js Anda.
2. Klik **"Start Application"**.
3. Selesai! Aplikasi Anda kini berjalan mandiri, aman, dan lancar di shared hosting Anda!

---

## 📌 PEMELIHARAAN (MAINTENANCE) & PEMBARUAN KODE
Jika Anda melakukan perbaikan atau pembaruan kode di GitHub di kemudian hari, jalankan perintah ini di VPS Anda untuk menerapkan pembaruan tersebut:
```bash
# Ambil kode terbaru dari github
git pull origin main

# Perbarui biner yt-dlp ke versi teranyar
sudo yt-dlp -U

# Unduh dependensi baru jika ada
npm install

# Build ulang aplikasinya
npm run build

# Restart PM2 untuk memuat service baru pun
pm2 restart hendri-downloader
```

---

## 🛡️ LISENSI (LICENSE)
Aplikasi ini dikembangkan untuk tujuan personal dan kegunaan edukasi pribadi. Gunakan dengan bijak demi mematuhi kebijakan hak cipta media sosial masing-masing platform target.

*Developer: [Hendri]*
