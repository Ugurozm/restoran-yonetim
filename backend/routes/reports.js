const express = require('express')
const router = express.Router()
const db = require('../db')

// Genel özet
router.get('/summary', async (req, res) => {
  try {
    const today = await db.query(`
      SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count
      FROM transactions WHERE DATE(created_at) = CURRENT_DATE
    `)
    const week = await db.query(`
      SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count
      FROM transactions WHERE created_at >= NOW() - INTERVAL '7 days'
    `)
    const month = await db.query(`
      SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count
      FROM transactions WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())
    `)
    const avgOrder = await db.query(`
      SELECT COALESCE(AVG(total_amount), 0) as avg FROM orders
    `)
    res.json({
      today: { total: parseFloat(today.rows[0].total), count: parseInt(today.rows[0].count) },
      week: { total: parseFloat(week.rows[0].total), count: parseInt(week.rows[0].count) },
      month: { total: parseFloat(month.rows[0].total), count: parseInt(month.rows[0].count) },
      avg_order: parseFloat(avgOrder.rows[0].avg)
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Günlük ciro (son 7 gün — gerçek işlemlerden)
router.get('/daily', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        TO_CHAR(DATE(created_at), 'DD/MM') as label,
        DATE(created_at) as date,
        COALESCE(SUM(amount), 0) as total,
        COUNT(*) as count
      FROM transactions
      WHERE created_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(created_at), label
      ORDER BY DATE(created_at)
    `)
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Aylık ciro (son 6 ay)
router.get('/monthly', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', created_at), 'MM/YYYY') as label,
        DATE_TRUNC('month', created_at) as date,
        COALESCE(SUM(amount), 0) as total,
        COUNT(*) as count
      FROM transactions
      WHERE created_at >= NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', created_at), label
      ORDER BY DATE_TRUNC('month', created_at)
    `)
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Masa bazlı ciro — gün ve ay filtresi
router.get('/tables', async (req, res) => {
  const { period } = req.query // 'day' | 'month' | 'all'
  let whereClause = ''
  if (period === 'day') whereClause = "WHERE DATE(tx.created_at) = CURRENT_DATE"
  else if (period === 'month') whereClause = "WHERE DATE_TRUNC('month', tx.created_at) = DATE_TRUNC('month', NOW())"

  try {
    const result = await db.query(`
      SELECT 
        t.table_number,
        COUNT(DISTINCT o.id) as order_count,
        COALESCE(SUM(tx.amount), 0) as revenue
      FROM tables t
      LEFT JOIN orders o ON t.id = o.table_id
      LEFT JOIN transactions tx ON o.id = tx.order_id ${whereClause}
      GROUP BY t.table_number
      ORDER BY t.table_number
    `)
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// En çok satanlar
router.get('/top-items', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT item_name, COUNT(*) as sold_count, SUM(price) as total_revenue
      FROM order_items WHERE is_paid = TRUE
      GROUP BY item_name ORDER BY sold_count DESC LIMIT 8
    `)
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Ödeme tipi dağılımı
router.get('/payment-types', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT payment_type, COUNT(*) as count, SUM(amount) as total
      FROM transactions GROUP BY payment_type
    `)
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router