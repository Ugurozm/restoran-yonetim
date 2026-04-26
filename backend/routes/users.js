const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

// Tüm kullanıcıları getir (sadece patron)
router.get('/', auth('patron'), async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, name, username, role, created_at FROM users ORDER BY role, name'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Yeni kullanıcı ekle
router.post('/', auth('patron'), async (req, res) => {
  const { name, username, password, role } = req.body;
  if (!name || !username || !password || !role) {
    return res.status(400).json({ error: 'Tum alanlar zorunlu' });
  }
  if (!['patron', 'garson'].includes(role)) {
    return res.status(400).json({ error: 'Gecersiz rol' });
  }
  try {
    const existing = await db.query('SELECT id FROM users WHERE username = $1', [username]);
    if (existing.rows.length) {
      return res.status(400).json({ error: 'Bu kullanici adi zaten kullaniliyor' });
    }
    const result = await db.query(
      'INSERT INTO users (name, username, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, username, role',
      [name, username, password, role]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Kullanıcı güncelle
router.put('/:id', auth('patron'), async (req, res) => {
  const { id } = req.params;
  const { name, username, password, role } = req.body;
  if (!name || !username || !role) {
    return res.status(400).json({ error: 'Ad, kullanici adi ve rol zorunlu' });
  }
  try {
    const existing = await db.query(
      'SELECT id FROM users WHERE username = $1 AND id != $2', [username, id]
    );
    if (existing.rows.length) {
      return res.status(400).json({ error: 'Bu kullanici adi zaten kullaniliyor' });
    }

    let result;
    if (password) {
      result = await db.query(
        'UPDATE users SET name=$1, username=$2, password=$3, role=$4 WHERE id=$5 RETURNING id, name, username, role',
        [name, username, password, role, id]
      );
    } else {
      result = await db.query(
        'UPDATE users SET name=$1, username=$2, role=$3 WHERE id=$4 RETURNING id, name, username, role',
        [name, username, role, id]
      );
    }

    if (!result.rows.length) return res.status(404).json({ error: 'Kullanici bulunamadi' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Kullanıcı sil
router.delete('/:id', auth('patron'), async (req, res) => {
  const { id } = req.params;
  try {
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'Kendinizi silemezsiniz' });
    }
    await db.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;