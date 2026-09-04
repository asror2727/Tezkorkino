# 🎬 Kino Bot - Professional Telegram Kino Streaming Bot

**Telegram** da kinolar tarqatish uchun professional bot!

## ✨ Xususiyatlari

- ✅ **Kino Katalogi** - Kod bilan qidirish
- 💎 **VIP Obuna Sistema** - 3 ta paket (1 oy, 3 oy, 1 yil)
- 💬 **Sovdalashish** - AI tarzda narx ko'paytirish
- 🎛️ **Admin Panel** - Kinolar qo'shish, o'chirish, statistika
- 📊 **Statistika** - Foydalanuvchi, foyda, ko'rilish
- 📡 **Majburiy Kanallar** - Obuna tekshir
- 📢 **Reklama** - Barcha foydalanuvchilarga xabar
- 💾 **Saqlash** - Sevimli kinolarni saqlash
- ✍️ **Izohlar** - Kinolar haqida izoh yozish
- 🌐 **Responsive Admin** - Telefon va kompyuterda ishlaydi

## 🚀 O'rnatish

### Talablar
- Node.js 14+
- MongoDB 4.4+
- Telegram Bot Token

### Qadamlar

1. **Proyektni klonla**
```bash
git clone https://github.com/yourusername/kino-bot.git
cd kino-bot
```

2. **Paketlarni o'rnat**
```bash
npm install
```

3. **.env fayli yaratib tayyorla**
```bash
cp .env.example .env
# .env faylini tahrir qil va token va URL qo'sh
```

4. **Mongodani ul**
```
.env faylida MONGODB_URI ni to'g'ri qo'y
MongoDB Atlas (cloud) ishlat: https://www.mongodb.com/cloud/atlas
```

5. **Botni ishga tushir**
```bash
npm start
```

6. **Admin panelni ishga tushir (alohida terminal)**
```bash
npm run admin
```

## 📱 Bot Buyruqlari

| Buyruq | Tavsif |
|--------|--------|
| `/start` | Botni boshlash |
| `/rand` | Random kino |
| `/top` | Eng ko'p ko'rilgan kinolar |
| `/last` | Oxirgi yuklangan kinolar |
| `/vip` | VIP obuna haqida |
| `/help` | Yordam |
| `/dev` | Dasturchi |

## 🎛️ Admin Panel

**Manzil:** `http://localhost:3000`

**Admin Panel orqali:**
- ✅ Kino qo'shish va o'chirish
- 💎 VIP narxlarni o'zgartirish
- 📡 Majburiy kanallarni qo'shish
- 📊 Barcha statistikani ko'rish
- 📢 Reklama tarqatish
- ⚙️ Bot sozlamalarini o'zgartirish

## 💾 Database Schema

### User
```javascript
{
  userId: Number,
  username: String,
  gender: 'erkak' | 'ayol',
  subscribed: Boolean,
  vip: {
    active: Boolean,
    plan: '1month' | '3month' | '1year',
    endDate: Date
  },
  savedMovies: [ObjectId],
  payments: [...],
  lastActive: Date
}
```

### Movie
```javascript
{
  code: String,
  name: String,
  year: Number,
  genre: [String],
  rating: Number,
  video: String,
  views: Number,
  premiumOnly: Boolean
}
```

## 🔐 Xavfsizlik

- Environment variables dan token ishlat
- Admin panel uchun password qo'sh (keyin)
- Payment API keylarini saqlash

## 📈 Deployment

### Render.com (Tavsiya qilaman)

1. GitHub repo yaratish
2. Render.com ga kirish (GitHub bilan)
3. **Web Service** > **Select Repository**
4. Build: `npm install`
5. Start: `npm start`
6. Environment Variables qo'shish:
   - BOT_TOKEN
   - MONGODB_URI
   - SUPPORT_USERNAME
   - DEVELOPER_USERNAME

### Railway.app
```bash
railway link
railway up
```

### Heroku
```bash
heroku create kino-bot
heroku config:set BOT_TOKEN=xxx
heroku config:set MONGODB_URI=xxx
git push heroku main
```

## 🛠️ Admin Panel Sozlamalari

### VIP Narxlar
- 1 oylik: 10,000 so'm
- 3 oylik: 25,000 so'm
- 1 yilik: 75,000 so'm

*(Admin panel orqali o'zgartirish mumkin)*

### To'lov Usullari
- Click
- Payme
- Hazna
- Sovdalashish (AI tarzida)

## 📞 Support

**Support:** @x7fan
**Developer:** @x7fan

## 📄 Litsenziya

MIT License

## 🙌 Hissa Qo'shish

1. Fork repo
2. Feature branch yaratish (`git checkout -b feature`)
3. Commit (`git commit -am 'Add feature'`)
4. Push (`git push origin feature`)
5. Pull Request

---

**Yozilgan:** Node.js + Telegraf + MongoDB + Express
**Deploy qilish:** Render.com, Railway, Heroku

🚀 **Omad!**
