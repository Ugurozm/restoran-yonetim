import { useState, useEffect } from 'react'
import axios from 'axios'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, ArcElement,
  Title, Tooltip, Legend, Filler
} from 'chart.js'
import { Bar, Line, Doughnut } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, ArcElement,
  Title, Tooltip, Legend, Filler
)

import { API } from '../config'

export default function Reports() {
  const [summary, setSummary] = useState(null)
  const [daily, setDaily] = useState([])
  const [monthly, setMonthly] = useState([])
  const [topItems, setTopItems] = useState([])
  const [paymentTypes, setPaymentTypes] = useState([])
  const [tableStats, setTableStats] = useState([])
  const [period, setPeriod] = useState('daily')
  const [tablePeriod, setTablePeriod] = useState('all')

  useEffect(() => {
    axios.get(`${API}/reports/summary`).then(r => setSummary(r.data))
    axios.get(`${API}/reports/daily`).then(r => setDaily(r.data))
    axios.get(`${API}/reports/monthly`).then(r => setMonthly(r.data))
    axios.get(`${API}/reports/top-items`).then(r => setTopItems(r.data))
    axios.get(`${API}/reports/payment-types`).then(r => setPaymentTypes(r.data))
  }, [])

  useEffect(() => {
    axios.get(`${API}/reports/tables?period=${tablePeriod}`).then(r => setTableStats(r.data))
  }, [tablePeriod])

  if (!summary) return (
    <div style={{ padding: '40px', textAlign: 'center', color: '#9B7B6A' }}>Yükleniyor...</div>
  )

  const periodData = period === 'daily' ? daily : monthly

  const lineChartData = {
    labels: periodData.map(d => d.label),
    datasets: [{
      label: 'Ciro (₺)',
      data: periodData.map(d => parseFloat(d.total)),
      borderColor: '#6B3A2A',
      backgroundColor: 'rgba(107,58,42,0.08)',
      tension: 0.4, fill: true,
      pointBackgroundColor: '#6B3A2A', pointRadius: 5,
    }]
  }

  const barChartData = {
    labels: topItems.map(i => i.item_name),
    datasets: [{
      label: 'Adet',
      data: topItems.map(i => parseInt(i.sold_count)),
      backgroundColor: ['#3D2314','#6B3A2A','#8B5E3C','#C4855A','#D4A97A','#E8DDD5','#9B7B6A','#2C1A0E'],
      borderRadius: 8,
    }]
  }

  const doughnutData = {
    labels: paymentTypes.map(p => p.payment_type === 'item_based' ? 'Ürün Bazlı' : 'Tutar Bazlı'),
    datasets: [{
      data: paymentTypes.map(p => parseFloat(p.total)),
      backgroundColor: ['#3D2314', '#C4855A'],
      borderWidth: 0,
    }]
  }

  const tableBarData = {
    labels: tableStats.map(t => `Masa ${t.table_number}`),
    datasets: [{
      label: 'Ciro (₺)',
      data: tableStats.map(t => parseFloat(t.revenue)),
      backgroundColor: '#6B3A2A',
      borderRadius: 8,
    }]
  }

  const chartOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } }
  }

  const tablePeriodLabels = { all: 'Tüm Zamanlar', day: 'Bugün', month: 'Bu Ay' }

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '28px', fontWeight: '700', color: '#2C1A0E', marginBottom: '4px' }}>
          Raporlar
        </h1>
        <p style={{ color: '#9B7B6A', fontSize: '14px' }}>Satış ve ciro istatistikleri</p>
      </div>

      {/* Özet kartlar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {[
          { label: 'Bugün', value: `₺${summary.today.total.toFixed(2)}`, sub: `${summary.today.count} işlem`, color: '#3D2314', bg: '#FAF7F2' },
          { label: 'Bu Hafta', value: `₺${summary.week.total.toFixed(2)}`, sub: `${summary.week.count} işlem`, color: '#6B3A2A', bg: '#F5F0EB' },
          { label: 'Bu Ay', value: `₺${summary.month.total.toFixed(2)}`, sub: `${summary.month.count} işlem`, color: '#8B5E3C', bg: '#F0E8DF' },
          { label: 'Ort. Adisyon', value: `₺${summary.avg_order.toFixed(2)}`, sub: 'tüm zamanlar', color: '#C4855A', bg: '#FDF9F5' },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, borderRadius: '16px', padding: '20px', boxShadow: '0 1px 4px rgba(44,26,14,0.06)' }}>
            <div style={{ fontSize: '11px', color: '#9B7B6A', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{s.label}</div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '26px', fontWeight: '700', color: s.color, marginBottom: '4px' }}>{s.value}</div>
            <div style={{ fontSize: '12px', color: '#9B7B6A' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Ciro grafiği */}
      <div style={{ background: '#fff', borderRadius: '20px', padding: '24px', marginBottom: '24px', boxShadow: '0 2px 12px rgba(44,26,14,0.07)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '18px', color: '#2C1A0E' }}>Ciro Grafiği</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['daily', 'monthly'].map(p => (
              <button key={p} onClick={() => setPeriod(p)} style={{
                padding: '6px 16px', borderRadius: '20px', fontSize: '13px',
                background: period === p ? '#3D2314' : '#F5F0EB',
                color: period === p ? '#FAF7F2' : '#9B7B6A', fontWeight: period === p ? '600' : '400'
              }}>
                {p === 'daily' ? 'Günlük' : 'Aylık'}
              </button>
            ))}
          </div>
        </div>
        {periodData.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#9B7B6A', padding: '40px', fontSize: '14px' }}>
            Henüz yeterli veri yok.
          </div>
        ) : (
          <Line data={lineChartData} options={chartOptions} />
        )}
      </div>

      {/* Alt satır */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        <div style={{ background: '#fff', borderRadius: '20px', padding: '24px', boxShadow: '0 2px 12px rgba(44,26,14,0.07)' }}>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '18px', color: '#2C1A0E', marginBottom: '16px' }}>En Çok Satanlar</h2>
          {topItems.length === 0 ? (
            <div style={{ color: '#9B7B6A', fontSize: '14px' }}>Henüz ürün bazlı ödeme yok.</div>
          ) : (
            <Bar data={barChartData} options={chartOptions} />
          )}
        </div>

        <div style={{ background: '#fff', borderRadius: '20px', padding: '24px', boxShadow: '0 2px 12px rgba(44,26,14,0.07)' }}>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '18px', color: '#2C1A0E', marginBottom: '16px' }}>Ödeme Tipi Dağılımı</h2>
          {paymentTypes.length === 0 ? (
            <div style={{ color: '#9B7B6A', fontSize: '14px' }}>Henüz işlem yok.</div>
          ) : (
            <div style={{ maxWidth: '220px', margin: '0 auto 16px' }}>
              <Doughnut data={doughnutData} options={{ plugins: { legend: { position: 'bottom' } } }} />
            </div>
          )}
          {paymentTypes.map(p => (
            <div key={p.payment_type} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid #F5F0EB' }}>
              <span style={{ fontSize: '14px', color: '#2C1A0E' }}>{p.payment_type === 'item_based' ? 'Ürün Bazlı' : 'Tutar Bazlı'}</span>
              <span style={{ fontWeight: '700', color: '#6B3A2A', fontSize: '14px' }}>₺{parseFloat(p.total).toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Masa bazlı ciro — filtreli */}
      <div style={{ background: '#fff', borderRadius: '20px', padding: '24px', boxShadow: '0 2px 12px rgba(44,26,14,0.07)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '18px', color: '#2C1A0E' }}>Masa Bazlı Ciro</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['day', 'month', 'all'].map(p => (
              <button key={p} onClick={() => setTablePeriod(p)} style={{
                padding: '6px 14px', borderRadius: '20px', fontSize: '12px',
                background: tablePeriod === p ? '#3D2314' : '#F5F0EB',
                color: tablePeriod === p ? '#FAF7F2' : '#9B7B6A', fontWeight: tablePeriod === p ? '600' : '400'
              }}>
                {tablePeriodLabels[p]}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '12px', marginBottom: '24px' }}>
          {tableStats.map(t => (
            <div key={t.table_number} style={{ background: '#FAF7F2', borderRadius: '14px', padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#9B7B6A', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Masa {t.table_number}</div>
              <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '20px', fontWeight: '700', color: parseFloat(t.revenue) > 0 ? '#3D2314' : '#C4C0BB' }}>
                ₺{parseFloat(t.revenue).toFixed(2)}
              </div>
              <div style={{ fontSize: '11px', color: '#9B7B6A', marginTop: '4px' }}>{t.order_count} adisyon</div>
            </div>
          ))}
        </div>

        {tableStats.some(t => parseFloat(t.revenue) > 0) ? (
          <Bar data={tableBarData} options={chartOptions} />
        ) : (
          <div style={{ textAlign: 'center', color: '#9B7B6A', padding: '20px', fontSize: '14px' }}>
            {tablePeriod === 'day' ? 'Bugün henüz ciro yok.' : tablePeriod === 'month' ? 'Bu ay henüz ciro yok.' : 'Henüz ciro yok.'}
          </div>
        )}
      </div>
    </div>
  )
}