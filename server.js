const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

// Modellar
const User = require('./models/User');
const Movie = require('./models/Movie');
const Config = require('./models/Config');
const Stats = require('./models/Stats');

const app = express();

// Middleware
app.use(express.json());
app.use(express.static('public'));

// MongoDB
mongoose.connect(process.env.MONGODB_URI);

// ========================
// ADMIN PANEL DASHBOARD
// ========================

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// ========================
// API ENDPOINTS
// ========================

// Statistika
app.get('/api/stats', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayStats = await Stats.findOne({ date: today });
    const totalUsers = await User.countDocuments();
    const vipUsers = await User.countDocuments({ 'vip.active': true });
    const totalMovies = await Movie.countDocuments({ active: true });
    
    // Oylik foyda
    const thisMonth = new Date();
    thisMonth.setDate(1);
    const monthlyRevenue = await User.aggregate([
      {
        $match: {
          'payments.date': { $gte: thisMonth },
          'payments.status': 'completed'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$payments.amount' }
        }
      }
    ]);
    
    res.json({
      today: todayStats,
      totalUsers,
      vipUsers,
      totalMovies,
      monthlyRevenue: monthlyRevenue[0]?.total || 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Kino qo'shish
app.post('/api/movies', async (req, res) => {
  try {
    const { code, name, year, genre, rating, duration, description, video, premiumOnly } = req.body;
    
    if (!code || !name || !video) {
      return res.status(400).json({ error: 'Majburiy maydonlar to\'ldirilmagan' });
    }
    
    const movie = new Movie({
      code,
      name,
      year,
      genre: genre.split(',').map(g => g.trim()),
      rating,
      duration,
      description,
      video,
      premiumOnly
    });
    
    await movie.save();
    res.json({ success: true, movie });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Kinolarni olish
app.get('/api/movies', async (req, res) => {
  try {
    const movies = await Movie.find({ active: true })
      .sort({ uploadDate: -1 })
      .limit(100);
    res.json(movies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Kinoni o'chirish
app.delete('/api/movies/:id', async (req, res) => {
  try {
    await Movie.updateOne({ _id: req.params.id }, { active: false });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// VIP narx o'zgartirish
app.put('/api/config/vip-prices', async (req, res) => {
  try {
    const { '1month': month1, '3month': month3, '1year': year1 } = req.body;
    
    let config = await Config.findOne();
    if (!config) {
      config = new Config();
    }
    
    config.vipPrices = {
      '1month': month1,
      '3month': month3,
      '1year': year1
    };
    
    await config.save();
    res.json({ success: true, prices: config.vipPrices });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Kanallar qo'shish
app.post('/api/config/channels', async (req, res) => {
  try {
    const { channelId, channelName, link } = req.body;
    
    let config = await Config.findOne();
    if (!config) {
      config = new Config();
    }
    
    config.requiredChannels.push({
      channelId,
      channelName,
      link,
      active: true
    });
    
    await config.save();
    res.json({ success: true, channels: config.requiredChannels });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Kanallar olish
app.get('/api/config/channels', async (req, res) => {
  try {
    const config = await Config.findOne();
    res.json(config?.requiredChannels || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Kanalni o'chirish
app.delete('/api/config/channels/:id', async (req, res) => {
  try {
    await Config.updateOne(
      {},
      { $pull: { requiredChannels: { _id: req.params.id } } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Support va Developer link
app.put('/api/config/links', async (req, res) => {
  try {
    const { supportUsername, developerUsername } = req.body;
    
    let config = await Config.findOne();
    if (!config) {
      config = new Config();
    }
    
    config.supportUsername = supportUsername;
    config.developerUsername = developerUsername;
    
    await config.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reklama tarqatish (To'g'ridan-to'g'ri bot orqali)
app.post('/api/broadcast', async (req, res) => {
  try {
    const { message } = req.body;
    
    // Bu yerda telegraf bot orqali barcha userlarga reklama yuboring
    // Bot faylida alohida function yaratish kerak
    
    res.json({ success: true, message: 'Reklama tarqatilmoqda...' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`📱 Admin panel ${PORT} portda ishga tushdi!`);
});
