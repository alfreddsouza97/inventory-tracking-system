import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css'; // Import the CSS file for styling.
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const App = () => {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({
    name: '',
    quantity: '',
    description: '',
    buyValue: '',
  });
  const [stats, setStats] = useState({
    totalSales: 0,
    totalProfit: 0,
    totalCost: 0,
  });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const { data } = await axios.get('https://inventory-tracking-system-3emf.onrender.com/api/items');
      setItems(data.items);
      setStats({
        totalSales: data.totalSales,
        totalProfit: data.totalProfit,
        totalCost: data.totalCost,
      });
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };
  
  const resetTotals = async () => {
    try {
      await axios.post('https://inventory-tracking-system-3emf.onrender.com/api/reset-totals');
      setStats({
        totalSales: 0,
        totalProfit: 0,
        totalCost: 0,
      });
      alert('Totals reset successfully!');
    } catch (err) {
      console.log(err);
      
      alert('Error resetting totals.');
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const addItem = async () => {
    await axios.post('https://inventory-tracking-system-3emf.onrender.com/api/items', form);
    fetchItems();
    setForm({
      name: '',
      quantity: '',
      description: '',
      buyValue: '',
    });
  };

  const sellItem = async (id) => {
    const sellQuantity = prompt('Enter quantity to sell:');
    const sellValue = prompt('Enter sell value per unit:');
    const buyerName = prompt('Enter buyer name (optional):');
  
    if (!sellQuantity || !sellValue || isNaN(sellQuantity) || isNaN(sellValue)) {
      alert('Invalid input!');
      return;
    }
  
    try {
      await axios.put(`https://inventory-tracking-system-3emf.onrender.com/api/items/${id}/sell`, {
        sellQuantity: Number(sellQuantity),
        sellValue: Number(sellValue),
        buyerName: buyerName || null, // Optional
      });
      fetchItems();
    } catch (err) {
      alert('Error selling item.');
    }
  };


// Export to Excel
const exportToExcel = () => {
  const worksheet = XLSX.utils.json_to_sheet(
    items.map((item) => ({
      Name: item.name,
      Quantity: item.quantity,
      Description: item.description,
      "Buy Value": item.buyValue,
      "Seller Name": item.sellerName || "N/A",
      Buyers: item.buyers
        .map((buyer) => `${buyer.name} (${buyer.quantity} @ $${buyer.sellValue}/unit)`)
        .join(', '),
    }))
  );
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory");
  XLSX.writeFile(workbook, "InventoryData.xlsx");
};

// Export to PDF
const exportToPDF = () => {
  const doc = new jsPDF();
  doc.text("Inventory Report", 14, 10);

  const tableColumn = [
    "Name",
    "Quantity",
    "Description",
    "Buy Value",
    "Seller Name",
    "Buyers",
  ];
  const tableRows = [];

  items.forEach((item) => {
    tableRows.push([
      item.name,
      item.quantity,
      item.description,
      `$${item.buyValue}`,
      item.sellerName || "N/A",
      item.buyers
        .map((buyer) => `${buyer.name} (${buyer.quantity} @ $${buyer.sellValue}/unit)`)
        .join(", "),
    ]);
  });

  doc.autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: 20,
  });

  doc.save("InventoryData.pdf");
};

  
  

  const deleteItem = async (id) => {
    await axios.delete(`https://inventory-tracking-system-3emf.onrender.com/api/items/${id}`);
    fetchItems();
  };

  return (
    <div className="container">
      <h1>Inventory Tracking System</h1>
      <div className="form-container">
        <h3>Add New Inventory Item</h3>
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Name"
          className="input"
        />
        <input
          name="quantity"
          value={form.quantity}
          onChange={handleChange}
          placeholder="Quantity"
          type="number"
          className="input"
        />
        <input
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Description"
          className="input"
        />
        <input
          name="buyValue"
          value={form.buyValue}
          onChange={handleChange}
          placeholder="Buy Value"
          type="number"
          className="input"
        />
       <input
  name="sellerName"
  value={form.sellerName}
  onChange={(e) => setForm({ ...form, [e.target.name]: e.target.value })}
  placeholder="Seller Name (optional)"
  className="input"
/>


        <button className="add-button" onClick={addItem}>
          Add Item
        </button>
      </div>
      <h3>Inventory</h3>
      <table className="table">
  <thead>
    <tr>
      <th>Name</th>
      <th>Quantity</th>
      <th>Description</th>
      <th>Buy Value</th>
      <th>Seller</th>
      <th>Buyers</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    {items.map((item) => (
      <tr key={item._id}>
        <td>{item.name}</td>
        <td>{item.quantity}</td>
        <td>{item.description}</td>
        <td>{item.buyValue}</td>
        <td>{item.sellerName || 'N/A'}</td>
        <td>
          {item.buyers.length > 0 ? (
            <ul>
              {item.buyers.map((buyer, index) => (
                <li key={index}>
                  {buyer.name} bought {buyer.quantity} at ${buyer.sellValue}/unit
                </li>
              ))}
            </ul>
          ) : (
            'No buyers yet'
          )}
        </td>
        <td>
          <button className="sell-button" onClick={() => sellItem(item._id)}>
            Sell
          </button>
          <button className="delete-button" onClick={() => deleteItem(item._id)}>
            Delete
          </button>
        </td>
      </tr>
    ))}
  </tbody>
</table>
{/* <table className="table">
  <thead>
    <tr>
      <th>Name</th>
      <th>Quantity</th>
      <th>Description</th>
      <th>Buy Value</th>
      <th>Seller Name</th>
      <th>Sell Value</th>
      <th>Buyers</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    {items.map((item) => {
      // Calculate the total sell value for the item
      const totalSellValue = item.buyers.reduce((sum, buyer) => sum + buyer.quantity * buyer.sellValue, 0);

      return (
        <tr key={item._id}>
          <td>{item.name}</td>
          <td>{item.quantity}</td>
          <td>{item.description}</td>
          <td>${item.buyValue}</td>
          <td>{item.sellerName || 'N/A'}</td>
          <td>${totalSellValue}</td>
          <td>
            {item.buyers.length > 0 ? (
              <ul>
                {item.buyers.map((buyer, index) => (
                  <li key={index}>
                    {buyer.name || 'Unknown'} bought {buyer.quantity} @ ${buyer.sellValue}/unit
                  </li>
                ))}
              </ul>
            ) : (
              'No buyers yet'
            )}
          </td>
          <td>
            <button className="sell-button" onClick={() => sellItem(item._id)}>
              Sell
            </button>
            <button className="delete-button" onClick={() => deleteItem(item._id)}>
              Delete
            </button>
          </td>
        </tr>
      );
    })}
  </tbody>
</table> */}



      <h3>Statistics</h3>
      <div className="stats">
        <p>Total Sales: <span>${stats.totalSales.toFixed(2)}</span></p>
        <p>Total Profit: <span>${stats.totalProfit.toFixed(2)}</span></p>
        <p>Total Cost: <span>${stats.totalCost.toFixed(2)}</span></p>
        <button className="reset-button" onClick={resetTotals}>
          Reset Totals
        </button>
      </div>

      <div style={{ margin: "20px 0" }}>
  <button className="export-button" onClick={exportToExcel}>
    Export to Excel
  </button>
  <button className="export-button" onClick={exportToPDF}>
    Export to PDF
  </button>
</div>

    </div>
  );
};

export default App;
