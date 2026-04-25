import { useState, useEffect } from 'react'
import axios from 'axios'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale,
  BarElement, Title, Tooltip, Legend
} from 'chart.js'
import { Bar } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const API = 'http://localhost:3001/api'

export default function AdminDashboard() {
  const [data, setData] = useState(null)

  useEffect(() => {
    axios.get(`${API}/dashboard`).then(res => setData(res.data))
  }, [])

  if (!data) return (
    <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>
      Yükleniyor...
    </div>
  )

  const chartData = {
    labels: data.table_revenue.map(t => `Masa ${t.table_number}`),
    datasets: [{
      label: 'Ciro (₺)',
      data: data.table_revenue.map(t => parseFloat(t.revenue)),
      backgroundColor: '#16a34a',
      borderRadius: 8,
    }]
  }

  const chartOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } }
  }

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '24px' }}>
        Yönetim Paneli
      </h1>

      {/* Özet kartlar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <StatCard label="Bugün Toplanan" value={`₺${data.today_total.toFixed(2)}`} color="#16a34a" bg="#f0fdf4" />
        <StatCard label="Toplam Ciro" value={`₺${data.all_total.toFixed(2)}`} color="#1d4ed8" bg="#eff6ff" />
        <StatCard label="Aktif Masa" value={data.table_revenue.filter(t => t.status === 'open' || t.status === 'partial').length} color="#d97706" bg="#fffbeb" />
      </div>

      {/* Grafik */}
      <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', marginBottom: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>Masa Bazlı Ciro</h2>
        <Bar data={chartData} options={chartOptions} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Ürün satışları */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '14px' }}>Ödenen Ürünler</h2>
          {data.item_sales.length === 0 ? (
            <p style={{ color: '#888', fontSize: '14px' }}>Henüz ürün bazlı ödeme yok.</p>
          ) : data.item_sales.map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
              <span style={{ fontSize: '14px' }}>{item.item_name}</span>
              <span style={{ fontWeight: '700', fontSize: '14px', color: '#16a34a' }}>
                ₺{parseFloat(item.total).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        {/* Son ödemeler */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '14px' }}>Son Ödemeler</h2>
          {data.recent_transactions.length === 0 ? (
            <p style={{ color: '#888', fontSize: '14px' }}>Henüz ödeme yok.</p>
          ) : data.recent_transactions.map(tx => (
            <div key={tx.id} style={{ padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '14px', fontWeight: '600' }}>
                  👤 {tx.payer_name} — Masa {tx.table_number}
                </span>
                <span style={{ fontWeight: '700', color: '#16a34a', fontSize: '14px' }}>
                  ₺{parseFloat(tx.amount).toFixed(2)}
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>
                {new Date(tx.created_at).toLocaleTimeString('tr-TR')}
                {' · '}{tx.payment_type === 'item_based' ? 'Ürün bazlı' : 'Tutar bazlı'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, color, bg }) {
  return (
    <div style={{ background: bg, borderRadius: '14px', padding: '20px' }}>
      <div style={{ fontSize: '12px', color: '#888', marginBottom: '6px' }}>{label}</div>
      <div style={{ fontSize: '24px', fontWeight: '800', color }}>{value}</div>
    </div>
  )
}