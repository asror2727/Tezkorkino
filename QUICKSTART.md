# ⚡ Quick Start - 5 Daqiqada Boshlash

## 1️⃣ **Bot Tokenini Oling**
- [@BotFather](https://t.me/botfather) ga yozing
- `/newbot` yuboring
- Bot nomini kiriting (mesalan: `MyKinoBot`)
- Token nusxalang ✅

## 2️⃣ **MongoDB Ulang**
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) ga kirish
- **Free Cluster** yaratish
- Connection string nusxalang ✅
- Format: `mongodb+srv://user:pass@cluster.mongodb.net/kino-bot`

## 3️⃣ **Project Setup**

```bash
# Proyektni klonla
git clone https://github.com/yourusername/kino-bot.git
cd kino-bot

# Paketlarni o'rnat
npm install

# .env fayli yaratish
cp .env.example .env

# .env ni tahrir qil
nano .env
```

## 4️⃣ **.env File**

```env
BOT_TOKEN=your_token_here
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/kino-bot
SUPPORT_USERNAME=x7fan
DEVELOPER_USERNAME=x7fan
PORT=3000
```

## 5️⃣ **Botni Ishga Tushir**

```bash
# Terminal 1 - Bot
npm start

# Terminal 2 - Admin Panel
npm run admin
```

## 6️⃣ **Admin Panel Qanday?**
- Manzil: `http://localhost:3000`
- Kino qo'shish: Kod + Nom + Video URL
- VIP narx o'zgartirish
- Statistika ko'rish

## 7️⃣ **Test qil**
1. Botga `/start` yubor
2. `/rand` - Random kino
3. `/vip` - VIP obuna

## 🚀 **Deployment (Render.com)**

```bash
# 1. GitHub ga push qil
git add .
git commit -m "Init bot"
git push

# 2. Render.com ga kirish
# 3. New Web Service yaratish
# 4. Repository select qilish
# 5. Build command: npm install
# 6. Start command: npm start
# 7. Environment variables qo'shish
```

## 📱 **Bot Menyu**

```
/start - Botni boshlash
/rand - Random kino
/top - Top kinolar
/last - Oxirgi kinolar
/vip - Premium obuna
/help - Yordam
/dev - Dasturchi
```

## 💎 **VIP Sistem**

Bot automat ravishda:
1. Kanallarga obuna tekshir
2. VIP narxni ko'rsat
3. Sovdalashish (AI)
4. To'lov qabul qil
5. VIP faollashtir

## 🎬 **Kino Qo'shish**

Admin panel > Kinolar > Form toldirish:
- **Kod:** Unik raqam (1, 2, 3...)
- **Nom:** Kino nomi
- **Yil:** Shou yili
- **Janr:** Drama, Aksion, etc.
- **Video URL:** Streaming link
- **Premium:** Checkbox

## 💰 **VIP Narxlar**

Default narxlar (o'zgartirish mumkin):
- 1 oylik: 10,000 so'm
- 3 oylik: 25,000 so'm
- 1 yilik: 75,000 so'm

## ⚙️ **Muhim Sozlamalar**

| Sozlama | Joyi | Tavsif |
|---------|------|--------|
| Support | .env | Support username (@) |
| Developer | .env | Developer username |
| VIP Narxlar | Admin Panel | Paketlar narxi |
| Kanallar | Admin Panel | Majburiy obuna |
| Kinolar | Admin Panel | Kino katalogi |

## 🐛 **Agar Xatolik Bo'lsa**

**Bot ishlamasa:**
```bash
# Token tekshir
echo $BOT_TOKEN

# MongoDB tekshir
mongosh "mongodb_uri_here"

# Loglarni ko'r
npm start
```

**Admin panel ochilmasa:**
```bash
# Port ochiq bo'lsa
lsof -i :3000

# Server qayta boshlash
npm run admin
```

## 📞 **Yordam**
- Support: @x7fan
- GitHub: issues ochish

## ✅ **Tayyor!**
Tabriklayman! Bot ishga tushgan! 🎉

**Quyidagi qadamlar:**
1. ✅ Kinolar qo'shish
2. ✅ Kanallar qo'shish
3. ✅ VIP narxlar o'zgartirish
4. ✅ Reklama yuborish
5. ✅ Deploy qilish

---

**Savollar? Issues yo'zing!**
