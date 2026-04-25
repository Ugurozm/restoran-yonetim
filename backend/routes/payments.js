const express = require('express');
const router = express.Router();
const db = require('../db');

// Ödeme al
router.post('/', async (req, res) => {
  const { order_id, payment_type, amount, item_ids, payer_name } = req.body;

  try {
    // 1. Adisyonu getir
    const orderResult = await db.query('SELECT * FROM orders WHERE id = $1', [order_id]);
    if (!orderResult.rows.length) return res.status(404).json({ error: 'Adisyon bulunamadı' });
    const order = orderResult.rows[0];

    // 2. Ödeme miktarı kontrolü
    if (amount > parseFloat(order.remaining_amount)) {
      return res.status(400).json({ error: 'Ödeme miktarı kalan tutardan fazla olamaz' });
    }

    // 3. İşlemi kaydet
    await db.query(
      'INSERT INTO transactions (order_id, amount, payment_type, payer_name) VALUES ($1, $2, $3, $4)',
      [order_id, amount, payment_type, payer_name || 'Misafir']
    );

    // 4. Ürün bazlı ödeme: ilgili kalemleri kapat
    if (payment_type === 'item_based' && item_ids && item_ids.length > 0) {
      await db.query(
        'UPDATE order_items SET is_paid = TRUE WHERE id = ANY($1) AND order_id = $2',
        [item_ids, order_id]
      );
    }

    // 5. Kalan tutarı güncelle
    const newRemaining = parseFloat(order.remaining_amount) - parseFloat(amount);
    const newStatus = newRemaining <= 0 ? 'closed' : 'partial';

    await db.query(
      'UPDATE orders SET remaining_amount = $1, status = $2 WHERE id = $3',
      [newRemaining, newStatus, order_id]
    );

    // 6. Masa durumunu güncelle
    const tableStatus = newRemaining <= 0 ? 'empty' : 'partial';
    await db.query(
      'UPDATE tables SET status = $1 WHERE id = $2',
      [tableStatus, order.table_id]
    );

    // 7. WebSocket ile tüm bağlı ekranlara bildir
    const io = req.app.get('io');
    io.emit('payment_update', {
      order_id,
      table_id: order.table_id,
      paid_amount: amount,
      remaining_amount: newRemaining,
      status: newStatus,
      payer_name: payer_name || 'Misafir'
    });

    res.json({
      success: true,
      message: newRemaining <= 0 ? 'Hesap kapandı' : 'Ödeme alındı',
      remaining_amount: newRemaining,
      status: newStatus
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;