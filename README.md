\# Restoran Demo



Modern restoran yönetim sistemi. QR kod ile sipariş, anlık ödeme takibi ve garson paneli.



\## Özellikler



\- 📱 QR kod ile masadan sipariş ve ödeme

\- 💳 Ürün bazlı veya tutar bazlı ödeme

\- 👨‍🍳 Garson paneli (real-time WebSocket)

\- 📊 Yönetim paneli ve raporlar

\- 📋 Menü yönetimi

\- 🪑 Masa yönetimi ve QR üretici

\- 👥 Kullanıcı yönetimi (patron/garson rolleri)

\- 🔐 JWT kimlik doğrulama



\## Teknolojiler



\*\*Backend:\*\* Node.js, Express, PostgreSQL, Socket.io, JWT, bcrypt



\*\*Frontend:\*\* React, Vite, Chart.js, React Router



\*\*Deploy:\*\* Railway (backend + DB), Vercel (frontend)



\## Demo



\- \*\*URL:\*\* https://restoran-demo-taupe.vercel.app

\- \*\*Patron:\*\* patron / 1234

\- \*\*Garson:\*\* garson1 / 12345



\## Kurulum



\### Gereksinimler

\- Node.js 20+

\- Docker



\### Çalıştırma



```bash

\# PostgreSQL başlat

docker-compose up -d



\# Backend

cd backend

npm install

npm run dev



\# Frontend

cd frontend

npm install

npm run dev

```



\### Ortam Değişkenleri



`backend/.env`:

