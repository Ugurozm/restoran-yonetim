const express = require('express');
const router = express.Router();
const db = require('../db');

// Adisyon detayı
router.get('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await db.query('SELECT * FROM orders WHERE id = $1', [orderId]);
    if (!order.rows.length) return res.status(404).json({ error: 'Adisyon bulunamadı' });

    const items = await db.query(
      'SELECT * FROM order_items WHERE order_id = $1',
      [orderId]
    );
    const transactions = await db.query(
      'SELECT * FROM transactions WHERE order_id = $1 ORDER BY created_at DESC',
      [orderId]
    );

    res.json({
      order: order.rows[0],
      items: items.rows,
      transactions: transactions.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Yeni sipariş ekle
router.post('/add-items', async (req, res) => {
  const { table_number, items } = req.body;
  // items: [{ name, price }]

  try {
    // Masayı bul
    const tableResult = await db.query(
      'SELECT * FROM tables WHERE table_number = $1',
      [table_number]
    );
    if (!tableResult.rows.length) return res.status(404).json({ error: 'Masa bulunamadı' });
    const table = tableResult.rows[0];

    // Açık adisyon var mı?
    let orderResult = await db.query(
      "SELECT * FROM orders WHERE table_id = $1 AND status != 'closed' ORDER BY created_at DESC LIMIT 1",
      [table.id]
    );

    let orderId;
    const itemsTotal = items.reduce((sum, i) => sum + parseFloat(i.price), 0);

    if (orderResult.rows.length === 0) {
      // Yoksa yeni adisyon aç
      const newOrder = await db.query(
        'INSERT INTO orders (table_id, total_amount, remaining_amount, status) VALUES ($1, $2, $2, $3) RETURNING *',
        [table.id, itemsTotal, 'open']
      );
      orderId = newOrder.rows[0].id;
      await db.query(
        "UPDATE tables SET status = 'occupied' WHERE id = $1",
        [table.id]
      );
    } else {
      // Varsa üstüne ekle
      orderId = orderResult.rows[0].id;
      await db.query(
        'UPDATE orders SET total_amount = total_amount + $1, remaining_amount = remaining_amount + $1 WHERE id = $2',
        [itemsTotal, orderId]
      );
    }

    // Ürünleri ekle
    for (const item of items) {
      await db.query(
        'INSERT INTO order_items (order_id, item_name, price) VALUES ($1, $2, $3)',
        [orderId, item.name, item.price]
      );
    }

    // WebSocket ile garson paneline bildir
    const io = req.app.get('io');
    io.emit('new_order', {
      table_number,
      items,
      total: itemsTotal
    });

    res.json({ success: true, order_id: orderId, added_items: items.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;