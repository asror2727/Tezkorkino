const mongoose = require('mongoose');

const StatsSchema = new mongoose.Schema({
  date: { 
    type: Date, 
    default: () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return today;
    },
    index: true 
  },
  
  // Kunlik statistika
  newUsers: { type: Number, default: 0 },
  activeUsers: { type: Number, default: 0 },
  leftUsers: { type: Number, default: 0 },
  
  // VIP
  vipSubscriptions: { type: Number, default: 0 },
  totalVipRevenue: { type: Number, default: 0 },
  
  // Kino
  moviesAdded: { type: Number, default: 0 },
  totalViews: { type: Number, default: 0 },
  
  // To'lovlar
  totalPayments: { type: Number, default: 0 },
  successPayments: { type: Number, default: 0 },
  failedPayments: { type: Number, default: 0 },
  
  // Boshqa
  totalUsers: { type: Number, default: 0 },
  vipUsers: { type: Number, default: 0 },
  subscribedUsers: { type: Number, default: 0 }
});

module.exports = mongoose.model('Stats', StatsSchema);
