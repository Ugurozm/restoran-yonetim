const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  try {
    const todayTotal = await db.query(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM transactions
      WHERE DATE(created_at) = CURRENT_DATE
    `);

    const allTotal = await db.query(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM transactions
    `);

    const tableRevenue = await db.query(`
      SELECT t.table_number, COALESCE(SUM(tx.amount), 0) as revenue, o.status
      FROM tables t
      LEFT JOIN orders o ON t.id = o.table_id
      LEFT JOIN transactions tx ON o.id = tx.order_id
      GROUP BY t.table_number, o.status
      ORDER BY t.table_number
    `);

    const itemSales = await db.query(`
      SELECT oi.item_name, COUNT(*) as count, SUM(oi.price) as total
      FROM order_items oi
      WHERE oi.is_paid = TRUE
      GROUP BY oi.item_name
      ORDER BY total DESC
    `);

    const recentTx = await db.query(`
      SELECT tx.*, t.table_number
      FROM transactions tx
      JOIN orders o ON tx.order_id = o.id
      JOIN tables t ON o.table_id = t.id
      ORDER BY tx.created_at DESC
      LIMIT 5
    `);

    res.json({
      today_total: parseFloat(todayTotal.rows[0].total),
      all_total: parseFloat(allTotal.rows[0].total),
      table_revenue: tableRevenue.rows,
      item_sales: itemSales.rows,
      recent_transactions: recentTx.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;