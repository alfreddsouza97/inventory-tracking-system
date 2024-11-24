// server.js
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const Stats = require('./models/Stats');

const app = express();
app.use(cors());
app.use(bodyParser.json());

mongoose.connect('mongodb+srv://alfreddsouza97:mongo1234@cluster0.dpymh6t.mongodb.net/24nov2', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const itemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    description: { type: String },
    buyValue: { type: Number, required: true },
    sellerName: { type: String }, // Optional seller name when buying
    buyers: [
      {
        name: { type: String },
        quantity: { type: Number },
        sellValue: { type: Number },
        date: { type: Date, default: Date.now },
      },
    ], // List of buyers when selling
  });

const Item = mongoose.model('Item', itemSchema);

// let totalSales = 0;
// let totalProfit = 0;
// let totalCost = 0;

// Initialize stats if not present
const initializeStats = async () => {
    const stats = await Stats.findOne();
    if (!stats) {
      await Stats.create({ totalCost: 0, totalSales: 0, totalProfit: 0 });
    }
  };
  initializeStats();

// Get all items
app.get('/api/items', async (req, res) => {
    try {
      const items = await Item.find();
      const stats = await Stats.findOne();
      res.json({
        items,
        totalCost: stats.totalCost,
        totalSales: stats.totalSales,
        totalProfit: stats.totalProfit,
      });
    } catch (err) {
      res.status(500).json({ error: 'Error fetching items.' });
    }
  });
  
// Add a new item
app.post('/api/items', async (req, res) => {
    const { name, quantity, description, buyValue, sellerName } = req.body;
  
    try {
      const item = new Item({ name, quantity, description, buyValue, sellerName });
      await item.save();
  
      // Update totalCost
      const stats = await Stats.findOne();
      stats.totalCost += quantity * buyValue;
      await stats.save();
  
      res.status(201).json({ message: 'Item added successfully!' });
    } catch (err) {
      res.status(500).json({ error: 'Error adding item.' });
    }
  });
  


// Sell an item
app.put('/api/items/:id/sell', async (req, res) => {
    const { sellQuantity, sellValue, buyerName } = req.body;
  
    try {
      const item = await Item.findById(req.params.id);
  
      if (!item || sellQuantity > item.quantity) {
        return res.status(400).json({ error: 'Invalid quantity or item not found.' });
      }
  
      // Update item quantity
      item.quantity -= sellQuantity;
  
      // Record buyer details
      item.buyers.push({
        name: buyerName || 'Unknown',
        quantity: sellQuantity,
        sellValue,
      });
  
      await item.save();
  
      // Calculate sales and profit
      const sales = sellQuantity * sellValue;
      const cost = sellQuantity * item.buyValue;
      const profit = sales - cost;
  
      // Update stats
      const stats = await Stats.findOne();
      stats.totalSales += sales;
      stats.totalProfit += profit;
      await stats.save();
  
      res.json({ message: 'Item sold successfully!' });
    } catch (err) {
      res.status(500).json({ error: 'Error selling item.' });
    }
  });
  
  
// Delete an item
app.delete('/api/items/:id', async (req, res) => {
  const { id } = req.params;
  const deletedItem = await Item.findByIdAndDelete(id);
  res.json(deletedItem);
});

// Reset totals endpoint
app.post('/api/reset-totals', async (req, res) => {
    try {
      const stats = await Stats.findOne();
      stats.totalSales = 0;
      stats.totalProfit = 0;
      stats.totalCost = 0;
      await stats.save();
  
      res.json({ message: 'Totals reset successfully!' });
    } catch (err) {
      res.status(500).json({ error: 'Error resetting totals.' });
    }
  });
  

// Start the server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
