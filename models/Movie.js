const mongoose = require('mongoose');

const MovieSchema = new mongoose.Schema({
  // Asosiy ma'lumotlar
  code: { type: String, unique: true, required: true, index: true },
  name: { type: String, required: true, index: true },
  originalName: String,
  description: String,
  
  // Kino haqida
  year: Number,
  genre: [String],
  rating: { type: Number, min: 0, max: 10, default: 0 },
  duration: Number, // minutlarda
  director: String,
  actors: [String],
  
  // Kino fayllar
  poster: String,
  trailer: String,
  video: { type: String, required: true },
  quality: { type: String, enum: ['720p', '1080p', '4K'], default: '1080p' },
  
  // VIP bo'limi
  isPremium: { type: Boolean, default: false },
  premiumOnly: { type: Boolean, default: false },
  
  // Statistika
  views: { type: Number, default: 0, index: true },
  likes: { type: Number, default: 0 },
  downloads: { type: Number, default: 0 },
  
  // Izohlar
  comments: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: String,
    rating: Number,
    date: { type: Date, default: Date.now }
  }],
  
  // Admin
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  uploadDate: { type: Date, default: Date.now, index: true },
  
  active: { type: Boolean, default: true, index: true }
});

module.exports = mongoose.model('Movie', MovieSchema);
