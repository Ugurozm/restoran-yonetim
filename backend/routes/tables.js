const express = require('express');
const router = express.Router();
const db = require('../db');

// Tüm masaları getir
router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT t.*, o.id as order_id, o.total_amount, o.remaining_amount
      FROM tables t
      LEFT JOIN orders o ON t.id = o.table_id AND o.status != 'closed'
      ORDER BY t.table_number
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Tek masa detayı
router.get('/:tableNumber', async (req, res) => {
  try {
    const { tableNumber } = req.params;
    const table = await db.query(
      'SELECT * FROM tables WHERE table_number = $1',
      [tableNumber]
    );
    if (!table.rows.length) return res.status(404).json({ error: 'Masa bulunamadı' });

    const order = await db.query(
      "SELECT * FROM orders WHERE table_id = $1 AND status != 'closed' ORDER BY created_at DESC LIMIT 1",
      [table.rows[0].id]
    );
    
    if (!order.rows.length) {
      return res.json({ table: table.rows[0], order: null, items: [] });
    }

    const items = await db.query(
      'SELECT * FROM order_items WHERE order_id = $1',
      [order.rows[0].id]
    );

    res.json({ table: table.rows[0], order: order.rows[0], items: items.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Yeni masa ekle
router.post('/', async (req, res) => {
  const { table_number } = req.body;
  if (!table_number) return res.status(400).json({ error: 'Masa numarası zorunlu' });
  try {
    const existing = await db.query(
      'SELECT id FROM tables WHERE table_number = $1',
      [table_number]
    );
    if (existing.rows.length) return res.status(400).json({ error: 'Bu masa numarası zaten var' });

    const result = await db.query(
      'INSERT INTO tables (table_number, status) VALUES ($1, $2) RETURNING *',
      [table_number, 'empty']
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Masa sil (Geliştirildi)
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // 1. Kontrol: Açık sipariş var mı?
    const openOrder = await db.query(
      "SELECT id FROM orders WHERE table_id = $1 AND status != 'closed'",
      [id]
    );
    if (openOrder.rows.length) {
      return res.status(400).json({ error: 'Açık hesabı olan masa silinemez' });
    }

    // 2. İşlem: Transaction başlat (Tüm silmeler ya hep ya hiç gerçekleşmeli)
    await db.query('BEGIN');

    // Bağlı tüm verileri temizle
    await db.query('DELETE FROM transactions WHERE order_id IN (SELECT id FROM orders WHERE table_id = $1)', [id]);
    await db.query('DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE table_id = $1)', [id]);
    await db.query('DELETE FROM orders WHERE table_id = $1', [id]);
    await db.query('DELETE FROM tables WHERE id = $1', [id]);

    await db.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await db.query('ROLLBACK'); // Hata olursa işlemleri geri al
    res.status(500).json({ error: err.message });
  }
});

// Manuel hesap kapat
router.post('/:id/close', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query(
      "UPDATE orders SET status = 'closed' WHERE table_id = $1 AND status != 'closed'",
      [id]
    );
    await db.query("UPDATE tables SET status = 'empty' WHERE id = $1", [id]);

    const io = req.app.get('io');
    if (io) {
      io.emit('table_update', { table_id: id, status: 'empty' });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;