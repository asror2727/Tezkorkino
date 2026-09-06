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
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB ulandi'))
  .catch(err => {
    console.error('❌ MongoDB xatosi:', err.message);
    process.exit(1);
  });

// ========================
// ADMIN PANEL DASHBOARD
// ========================

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// ========================
// 📊 STATISTIKA
// ========================

app.get('/api/stats', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const totalUsers = await User.countDocuments();
    const vipUsers = await User.countDocuments({ 'vip.active': true });
    const totalMovies = await Movie.countDocuments({ active: true });
    
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
      totalUsers,
      vipUsers,
      totalMovies,
      monthlyRevenue: monthlyRevenue[0]?.total || 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========================
// 🎬 KINOLAR
// ========================

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
      genre: Array.isArray(genre) ? genre : genre.split(',').map(g => g.trim()),
      rating,
      duration,
      description,
      video,
      premiumOnly: premiumOnly || false
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

// ========================
// 💎 VIP NARXLAR
// ========================

app.put('/api/config/vip-prices', async (req, res) => {
  try {
    const { '1month': month1, '3month': month3, '1year': year1 } = req.body;
    
    let config = await Config.findOne();
    if (!config) {
      config = new Config();
    }
    
    config.vipPrices = {
      '1month': parseInt(month1),
      '3month': parseInt(month3),
      '1year': parseInt(year1)
    };
    
    await config.save();
    res.json({ success: true, prices: config.vipPrices });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========================
// 📡 KANALLAR
// ========================

// Kanal qo'shish
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

// Kanallarni olish
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

// ========================
// ⚙️ SOZLAMALAR
// ========================

app.put('/api/config/links', async (req, res) => {
  try {
    const { supportUsername, developerUsername } = req.body;
    
    let config = await Config.findOne();
    if (!config) {
      config = new Config();
    }
    
    config.supportUsername = supportUsername || 'support';
    config.developerUsername = developerUsername || 'dev';
    
    await config.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========================
// ERROR HANDLER
// ========================

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Server xatosi' });
});

// ========================
// SERVER START
// ========================

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Admin panel http://localhost:${PORT} portda ishga tushdi!`);
});
