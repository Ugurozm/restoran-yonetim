import { useState, useEffect } from 'react'
import axios from 'axios'
import { io } from 'socket.io-client'

const API = 'http://localhost:3001/api'
const socket = io('http://localhost:3001')

const STATUS_STYLE = {
  empty:    { bg: '#f5f5f5', color: '#888',    label: 'Boş',           icon: '🪑' },
  occupied: { bg: '#fef2f2', color: '#dc2626', label: 'Açık Hesap',    icon: '🔴' },
  partial:  { bg: '#fffbeb', color: '#d97706', label: 'Kısmen Ödendi', icon: '🟡' },
  closed:   { bg: '#f0fdf4', color: '#16a34a', label: 'Kapandı',       icon: '✅' },
}

export default function TableManager() {
  const [tables, setTables] = useState([])
  const [newNumber, setNewNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(null)
  const [confirmAction, setConfirmAction] = useState(null)

  useEffect(() => {
    fetchTables()
    socket.on('table_update', fetchTables)
    socket.on('payment_update', fetchTables)
    socket.on('new_order', fetchTables)
    return () => {
      socket.off('table_update')
      socket.off('payment_update')
      socket.off('new_order')
    }
  }, [])

  async function fetchTables() {
    const res = await axios.get(`${API}/tables`)
    setTables(res.data)
  }

  async function handleAddTable() {
    if (!newNumber) return alert('Masa numarası girin')
    setLoading(true)
    try {
      await axios.post(`${API}/tables`, { table_number: parseInt(newNumber) })
      setNewNumber('')
      fetchTables()
    } catch (err) {
      alert(err.response?.data?.error || 'Hata')
    }
    setLoading(false)
  }

  async function handleDelete(table) {
    try {
      await axios.delete(`${API}/tables/${table.id}`)
      setSelected(null)
      fetchTables()
    } catch (err) {
      alert(err.response?.data?.error || 'Hata')
    }
    setConfirmAction(null)
  }

  async function handleOpen(table) {
    try {
      await axios.post(`${API}/tables/${table.id}/open`)
      fetchTables()
      setSelected(prev => ({ ...prev, status: 'occupied' }))
    } catch (err) {
      alert(err.response?.data?.error || 'Hata')
    }
    setConfirmAction(null)
  }

  async function handleClose(table) {
    try {
      await axios.post(`${API}/tables/${table.id}/close`)
      fetchTables()
      setSelected(prev => ({ ...prev, status: 'empty' }))
    } catch (err) {
      alert(err.response?.data?.error || 'Hata')
    }
    setConfirmAction(null)
  }

  const totalTables = tables.length
  const occupiedTables = tables.filter(t => t.status === 'occupied' || t.status === 'partial').length
  const totalRemaining = tables.reduce((sum, t) => sum + (parseFloat(t.remaining_amount) || 0), 0)

  return (
    <div style={{ padding: '24px', maxWidth: '960px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '24px' }}>Masa Yönetimi</h1>

      {/* Özet */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <StatCard label="Toplam Masa" value={totalTables} color="#1a1a1a" bg="#f5f5f5" />
        <StatCard label="Dolu Masa" value={occupiedTables} color="#dc2626" bg="#fef2f2" />
        <StatCard label="Boş Masa" value={totalTables - occupiedTables} color="#16a34a" bg="#f0fdf4" />
        <StatCard label="Bekleyen Tahsilat" value={`₺${totalRemaining.toFixed(2)}`} color="#d97706" bg="#fffbeb" />
      </div>

      {/* Yeni masa ekle */}
      <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', marginBottom: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
        <h2 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '14px' }}>➕ Yeni Masa Ekle</h2>
        <div style={{ display: 'flex', gap: '12px' }}>
          <input
            type="number"
            placeholder="Masa numarası (ör: 6)"
            value={newNumber}
            onChange={e => setNewNumber(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddTable()}
            style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1.5px solid #e5e5e5', fontSize: '15px', outline: 'none' }}
          />
          <button
            onClick={handleAddTable}
            disabled={loading}
            style={{ background: '#1a1a1a', color: '#fff', padding: '12px 28px', opacity: loading ? 0.7 : 1 }}
          >
            Ekle
          </button>
        </div>
      </div>

      {/* Masa kartları */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '14px', marginBottom: selected ? '24px' : 0 }}>
        {tables.map(table => {
          const s = STATUS_STYLE[table.status] || STATUS_STYLE.empty
          return (
            <div
              key={table.id}
              onClick={() => setSelected(selected?.id === table.id ? null : table)}
              style={{
                background: s.bg, borderRadius: '14px', padding: '20px',
                cursor: 'pointer', textAlign: 'center',
                border: selected?.id === table.id ? `2px solid ${s.color}` : '2px solid transparent',
                transition: 'all 0.2s',
                boxShadow: selected?.id === table.id ? `0 0 0 3px ${s.color}22` : 'none'
              }}
            >
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>{s.icon}</div>
              <div style={{ fontWeight: '700', fontSize: '17px', marginBottom: '4px' }}>
                Masa {table.table_number}
              </div>
              <div style={{ color: s.color, fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
                {s.label}
              </div>
              {table.remaining_amount && parseFloat(table.remaining_amount) > 0 && (
                <div style={{ color: s.color, fontSize: '14px', fontWeight: '700', marginTop: '4px' }}>
                  ₺{parseFloat(table.remaining_amount).toFixed(2)}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Seçili masa işlemleri */}
      {selected && (
        <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginTop: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700' }}>
              Masa {selected.table_number} — İşlemler
            </h2>
            <button onClick={() => setSelected(null)} style={{ background: '#f5f5f5', color: '#666', padding: '6px 14px', fontSize: '13px' }}>
              Kapat
            </button>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <div style={{ background: (STATUS_STYLE[selected.status] || STATUS_STYLE.empty).bg, borderRadius: '10px', padding: '10px 18px' }}>
              <span style={{ fontSize: '13px', color: '#888' }}>Durum: </span>
              <span style={{ fontWeight: '700', color: (STATUS_STYLE[selected.status] || STATUS_STYLE.empty).color }}>
                {(STATUS_STYLE[selected.status] || STATUS_STYLE.empty).label}
              </span>
            </div>
            {selected.remaining_amount && parseFloat(selected.remaining_amount) > 0 && (
              <div style={{ background: '#fffbeb', borderRadius: '10px', padding: '10px 18px' }}>
                <span style={{ fontSize: '13px', color: '#888' }}>Kalan: </span>
                <span style={{ fontWeight: '700', color: '#d97706' }}>₺{parseFloat(selected.remaining_amount).toFixed(2)}</span>
              </div>
            )}
          </div>

          {!confirmAction ? (
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {selected.status === 'empty' && (
                <button onClick={() => setConfirmAction('open')} style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 20px', fontSize: '14px' }}>
                  🔴 Manuel Hesap Aç
                </button>
              )}
              {(selected.status === 'occupied' || selected.status === 'partial') && (
                <button onClick={() => setConfirmAction('close')} style={{ background: '#f0fdf4', color: '#16a34a', padding: '10px 20px', fontSize: '14px' }}>
                  ✅ Hesabı Kapat
                </button>
              )}
              {selected.status === 'empty' && (
                <button onClick={() => setConfirmAction('delete')} style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 20px', fontSize: '14px' }}>
                  🗑️ Masayı Sil
                </button>
              )}
            </div>
          ) : (
            <div style={{ background: '#fffbeb', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '14px', color: '#92400e', flex: 1 }}>
                {confirmAction === 'open' && `Masa ${selected.table_number} için manuel hesap açılacak. Emin misiniz?`}
                {confirmAction === 'close' && `Masa ${selected.table_number} hesabı kapatılacak. Emin misiniz?`}
                {confirmAction === 'delete' && `Masa ${selected.table_number} silinecek. Bu işlem geri alınamaz!`}
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setConfirmAction(null)} style={{ background: '#f5f5f5', color: '#666', padding: '8px 16px', fontSize: '13px' }}>
                  İptal
                </button>
                <button
                  onClick={() => {
                    if (confirmAction === 'open') handleOpen(selected)
                    if (confirmAction === 'close') handleClose(selected)
                    if (confirmAction === 'delete') handleDelete(selected)
                  }}
                  style={{ background: '#dc2626', color: '#fff', padding: '8px 16px', fontSize: '13px' }}
                >
                  Onayla
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, color, bg }) {
  return (
    <div style={{ background: bg, borderRadius: '14px', padding: '20px' }}>
      <div style={{ fontSize: '12px', color: '#888', marginBottom: '6px' }}>{label}</div>
      <div style={{ fontSize: '26px', fontWeight: '800', color }}>{value}</div>
    </div>
  )
}