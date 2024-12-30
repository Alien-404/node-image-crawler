## Installation Guide

## Prerequisites

Sebelum memulai, pastikan Anda memiliki beberapa hal berikut:

- **Node.js**: Pastikan Node.js sudah terinstal di komputer Anda.
- **PostgreSQL**: Pastikan Anda memiliki database PostgreSQL yang berjalan di mesin Anda.

## Langkah-Langkah Instalasi

### 1\. Cek Versi Node.js

Pastikan Node.js sudah terinstal di komputer Anda dengan menjalankan perintah berikut di terminal:

```plaintext
node -v
```

Jika Node.js terinstal dengan benar, perintah ini akan menampilkan versi Node.js yang terpasang.

### 2\. Clone Repository

Clone repository aplikasi ini ke komputer Anda dengan menggunakan perintah git berikut:

```plaintext
git clone <URL_REPOSITORY_PADA_REPO_INI>
```

### 3\. Buat File `.env`

Buat file `.env` di direktori root proyek Anda dan tambahkan konfigurasi berikut:

```plaintext
DB_USER=your_database_user
DB_NAME=your_database_name
DB_PASSWORD=your_database_password
```

- Gantilah `your_database_user` dengan nama pengguna database PostgreSQL Anda.
- Gantilah `your_database_name` dengan nama database yang akan digunakan oleh aplikasi.
- Gantilah `your_database_password` dengan kata sandi database Anda.

### 4\. Install Dependencies

Setelah selesai mengatur file `.env`, jalankan perintah berikut untuk menginstal semua dependencies yang dibutuhkan oleh aplikasi:

```plaintext
npm install
```

### 5\. Menjalankan Aplikasi

Setelah instalasi selesai, jalankan aplikasi menggunakan perintah berikut:

```plaintext
npm start
```

Ini akan menjalankan server aplikasi pada `localhost` di port 3000.

### 6\. Akses Aplikasi

Buka browser dan pergi ke alamat berikut:

```plaintext
http://localhost:3000
```

Ikuti petunjuk pada website untuk melanjutkan proses setup dan penggunaan aplikasi.
