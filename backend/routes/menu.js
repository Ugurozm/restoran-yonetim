const express = require('express');
const router = express.Router();
const db = require('../db');

// Tüm menüyü getir
router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM menu_items WHERE is_available = TRUE ORDER BY category, id'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Tüm menüyü getir (admin — müsait olmayanlar dahil)
router.get('/admin', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM menu_items ORDER BY category, id');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Yeni ürün ekle
router.post('/', async (req, res) => {
  const { category, name, price } = req.body;
  if (!category || !name || !price) return res.status(400).json({ error: 'Tüm alanlar zorunlu' });
  try {
    const result = await db.query(
      'INSERT INTO menu_items (category, name, price) VALUES ($1, $2, $3) RETURNING *',
      [category, name, parseFloat(price)]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Ürün güncelle
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { category, name, price, is_available } = req.body;
  try {
    const result = await db.query(
      'UPDATE menu_items SET category=$1, name=$2, price=$3, is_available=$4 WHERE id=$5 RETURNING *',
      [category, name, parseFloat(price), is_available, id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Ürün bulunamadı' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Ürün sil
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM menu_items WHERE id=$1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;