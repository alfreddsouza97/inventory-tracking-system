const mongoose = require('mongoose');

const StatsSchema = new mongoose.Schema({
  totalCost: { type: Number, default: 0 },
  totalSales: { type: Number, default: 0 },
  totalProfit: { type: Number, default: 0 },
});

module.exports = mongoose.model('Stats', StatsSchema);
