const mongoose = require('mongoose');

const ConfigSchema = new mongoose.Schema({
  // Kanallar (majburiy)
  requiredChannels: [{
    channelId: String,
    channelName: String,
    link: String,
    active: { type: Boolean, default: true }
  }],
  
  // VIP Narxlar
  vipPrices: {
    '1month': { type: Number, default: 10000 },
    '3month': { type: Number, default: 25000 },
    '1year': { type: Number, default: 75000 }
  },
  
  // To'lov usullari
  paymentMethods: {
    click: {
      enabled: { type: Boolean, default: false },
      merchantId: String,
      apiKey: String
    },
    payme: {
      enabled: { type: Boolean, default: false },
      merchantKey: String,
      apiKey: String
    },
    hazna: {
      enabled: { type: Boolean, default: false },
      apiKey: String
    }
  },
  
  // Support va Developer
  supportLink: String,
  supportUsername: { type: String, default: 'support' },
  developerUsername: { type: String, default: 'dev' },
  
  // Boshqa sozlamalar
  maxChannels: { type: Number, default: 3 },
  checkTimeout: { type: Number, default: 60000 },
  
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Config', ConfigSchema);
