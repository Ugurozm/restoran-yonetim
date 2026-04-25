const express = require('express');
const router = express.Router();
const db = require('../db');

// Adisyon detayı
router.get('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await db.query('SELECT * FROM orders WHERE id = $1', [orderId]);
    if (!order.rows.length) return res.status(404).json({ error: 'Adisyon bulunamadi' });

    const items = await db.query('SELECT * FROM order_items WHERE order_id = $1', [orderId]);
    const transactions = await db.query(
      'SELECT * FROM transactions WHERE order_id = $1 ORDER BY created_at DESC',
      [orderId]
    );

    res.json({ order: order.rows[0], items: items.rows, transactions: transactions.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Müşteri: yeni sipariş ekle
router.post('/add-items', async (req, res) => {
  const { table_number, items } = req.body;
  try {
    const tableResult = await db.query(
      'SELECT * FROM tables WHERE table_number = $1', [table_number]
    );
    if (!tableResult.rows.length) return res.status(404).json({ error: 'Masa bulunamadi' });
    const table = tableResult.rows[0];

    let orderResult = await db.query(
      "SELECT * FROM orders WHERE table_id = $1 AND status != 'closed' ORDER BY created_at DESC LIMIT 1",
      [table.id]
    );

    let orderId;
    const itemsTotal = items.reduce((sum, i) => sum + parseFloat(i.price), 0);

    if (orderResult.rows.length === 0) {
      const newOrder = await db.query(
        'INSERT INTO orders (table_id, total_amount, remaining_amount, status) VALUES ($1, $2, $2, $3) RETURNING *',
        [table.id, itemsTotal, 'open']
      );
      orderId = newOrder.rows[0].id;
      await db.query("UPDATE tables SET status = 'occupied' WHERE id = $1", [table.id]);
    } else {
      orderId = orderResult.rows[0].id;
      await db.query(
        'UPDATE orders SET total_amount = total_amount + $1, remaining_amount = remaining_amount + $1 WHERE id = $2',
        [itemsTotal, orderId]
      );
    }

    for (const item of items) {
      await db.query(
        'INSERT INTO order_items (order_id, item_name, price) VALUES ($1, $2, $3)',
        [orderId, item.name, item.price]
      );
    }

    const io = req.app.get('io');
    io.emit('new_order', { table_number, items, total: itemsTotal });

    res.json({ success: true, order_id: orderId, added_items: items.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Garson: adisyona ürün ekle
router.post('/:orderId/add-item', async (req, res) => {
  const { orderId } = req.params;
  const { item_name, price } = req.body;
  if (!item_name || !price) return res.status(400).json({ error: 'Urun adi ve fiyat zorunlu' });

  try {
    const order = await db.query('SELECT * FROM orders WHERE id = $1', [orderId]);
    if (!order.rows.length) return res.status(404).json({ error: 'Adisyon bulunamadi' });

    await db.query(
      'INSERT INTO order_items (order_id, item_name, price) VALUES ($1, $2, $3)',
      [orderId, item_name, parseFloat(price)]
    );
    await db.query(
      'UPDATE orders SET total_amount = total_amount + $1, remaining_amount = remaining_amount + $1 WHERE id = $2',
      [parseFloat(price), orderId]
    );

    const io = req.app.get('io');
    io.emit('order_updated', { order_id: orderId, table_id: order.rows[0].table_id });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Garson: ürün güncelle
router.put('/item/:itemId', async (req, res) => {
  const { itemId } = req.params;
  const { item_name, price } = req.body;

  try {
    const item = await db.query('SELECT * FROM order_items WHERE id = $1', [itemId]);
    if (!item.rows.length) return res.status(404).json({ error: 'Urun bulunamadi' });
    if (item.rows[0].is_paid) return res.status(400).json({ error: 'Odenmis urun duzenlenemez' });

    const oldPrice = parseFloat(item.rows[0].price);
    const newPrice = parseFloat(price);
    const diff = newPrice - oldPrice;

    await db.query(
      'UPDATE order_items SET item_name = $1, price = $2 WHERE id = $3',
      [item_name, newPrice, itemId]
    );
    await db.query(
      'UPDATE orders SET total_amount = total_amount + $1, remaining_amount = remaining_amount + $1 WHERE id = $2',
      [diff, item.rows[0].order_id]
    );

    const order = await db.query('SELECT * FROM orders WHERE id = $1', [item.rows[0].order_id]);
    const io = req.app.get('io');
    io.emit('order_updated', { order_id: item.rows[0].order_id, table_id: order.rows[0].table_id });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Garson: ürün sil
router.delete('/item/:itemId', async (req, res) => {
  const { itemId } = req.params;

  try {
    const item = await db.query('SELECT * FROM order_items WHERE id = $1', [itemId]);
    if (!item.rows.length) return res.status(404).json({ error: 'Urun bulunamadi' });
    if (item.rows[0].is_paid) return res.status(400).json({ error: 'Odenmis urun silinemez' });

    const price = parseFloat(item.rows[0].price);
    const orderId = item.rows[0].order_id;

    await db.query('DELETE FROM order_items WHERE id = $1', [itemId]);
    await db.query(
      'UPDATE orders SET total_amount = total_amount - $1, remaining_amount = remaining_amount - $1 WHERE id = $2',
      [price, orderId]
    );

    const order = await db.query('SELECT * FROM orders WHERE id = $1', [orderId]);
    const io = req.app.get('io');
    io.emit('order_updated', { order_id: orderId, table_id: order.rows[0].table_id });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;