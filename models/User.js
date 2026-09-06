const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  userId: { type: Number, unique: true, required: true, index: true },
  username: String,
  firstName: String,
  lastName: String,
  gender: { type: String, enum: ['erkak', 'ayol', 'unknown'], default: 'unknown' },
  
  // Obuna statusi
  subscribed: { type: Boolean, default: false },
  subscribedChannels: [String],
  subscribeDate: Date,
  
  // VIP Obuna
  vip: {
    active: { type: Boolean, default: false },
    plan: { type: String, enum: ['none', '1month', '3month', '1year'], default: 'none' },
    price: { type: Number, default: 0 },
    startDate: Date,
    endDate: Date,
    method: { type: String, enum: ['click', 'payme', 'hazna', 'savdo', 'none'], default: 'none' },
    isPremium: { type: Boolean, default: false }
  },
  
  // Saqlangan kinolar
  savedMovies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Movie' }],
  
  // Izohlar
  notes: [{
    movieId: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie' },
    text: String,
    rating: { type: Number, min: 1, max: 5 },
    date: { type: Date, default: Date.now }
  }],
  
  // To'lovlar tarixi
  payments: [{
    amount: Number,
    method: String,
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
    date: { type: Date, default: Date.now },
    transactionId: String,
    plan: String
  }],
  
  // Statistika
  lastActive: { type: Date, default: Date.now, index: true },
  totalWatched: { type: Number, default: 0 },
  joinDate: { type: Date, default: Date.now, index: true }
});

// Index fix - E11000 duplicate key error'ni hal qilish
UserSchema.index({ userId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('User', UserSchema);
