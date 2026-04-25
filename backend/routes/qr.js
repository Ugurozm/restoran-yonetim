const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');

router.get('/:tableNumber', async (req, res) => {
  const { tableNumber } = req.params;
  const url = `http://localhost:5173/masa/${tableNumber}`;

  try {
    const qrDataUrl = await QRCode.toDataURL(url, {
      width: 300,
      margin: 2,
      color: { dark: '#1a1a1a', light: '#ffffff' }
    });
    res.json({ table: tableNumber, url, qr: qrDataUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;