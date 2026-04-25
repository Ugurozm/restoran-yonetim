const cron = require('node-cron')
const db = require('../db')

function startDailyReset(io) {
  // Her gece 00:00'da çalışır
  cron.schedule('0 0 * * *', async () => {
    console.log('Günlük reset başlıyor:', new Date().toISOString())
    try {
      // Açık masaları kapat
      await db.query(`
        UPDATE orders SET status = 'closed'
        WHERE status IN ('open', 'partial')
      `)
      await db.query(`
        UPDATE tables SET status = 'empty'
        WHERE status IN ('occupied', 'partial')
      `)

      // Günlük özeti kaydet
      await db.query(`
        INSERT INTO daily_summary (date, total_revenue, total_orders)
        SELECT 
          CURRENT_DATE - INTERVAL '1 day',
          COALESCE(SUM(amount), 0),
          COUNT(DISTINCT order_id)
        FROM transactions
        WHERE DATE(created_at) = CURRENT_DATE - INTERVAL '1 day'
      `)

      console.log('Günlük reset tamamlandı')

      // Garson paneline bildir
      if (io) io.emit('daily_reset', { date: new Date().toISOString() })
    } catch (err) {
      console.error('Reset hatası:', err.message)
    }
  }, { timezone: 'Europe/Istanbul' })

  console.log('Günlük reset job başlatıldı (her gece 00:00)')
}

module.exports = { startDailyReset }