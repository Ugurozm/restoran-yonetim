import { useState, useEffect } from 'react'
import axios from 'axios'

const API = 'http://localhost:3001/api'

const STATUS = {
  empty:    { bg: '#F5F0EB', border: '#E8DDD5', color: '#9B7B6A', label: 'Boş',           icon: '🪑' },
  occupied: { bg: '#FEF0ED', border: '#F5C4B8', color: '#C0392B', label: 'Açık Hesap',    icon: '🔴' },
  partial:  { bg: '#FDF6E8', border: '#F0D89A', color: '#C07A00', label: 'Kısmen Ödendi', icon: '🟡' },
  closed:   { bg: '#EDF7F0', border: '#A8DDB8', color: '#1E7E34', label: 'Kapandı',       icon: '✅' },
}

export default function TableManager() {
  const [tables, setTables] = useState([])
  const [newNumber, setNewNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(null)
  const [confirmAction, setConfirmAction] = useState(null)
  const [qrMap, setQrMap] = useState({})

  useEffect(() => {
    fetchTables()
  }, [])

  async function fetchTables() {
    const res = await axios.get(`${API}/tables`)
    setTables(res.data)
  }

  async function fetchQr(tableNumber) {
    if (qrMap[tableNumber]) return
    const res = await axios.get(`${API}/qr/${tableNumber}`)
    setQrMap(prev => ({ ...prev, [tableNumber]: res.data.qr }))
  }

  async function handleAddTable() {
    if (!newNumber) return alert('Masa numarası girin')
    setLoading(true)
    try {
      const res = await axios.post(`${API}/tables`, { table_number: parseInt(newNumber) })
      setNewNumber('')
      await fetchTables()
      setSelected(res.data)
      fetchQr(res.data.table_number)
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

  function handleSelectTable(table) {
    const isSame = selected?.id === table.id
    setSelected(isSame ? null : table)
    setConfirmAction(null)
    if (!isSame) fetchQr(table.table_number)
  }

  const stats = {
    total: tables.length,
    occupied: tables.filter(t => t.status === 'occupied' || t.status === 'partial').length,
    empty: tables.filter(t => t.status === 'empty').length,
    pending: tables.reduce((s, t) => s + (parseFloat(t.remaining_amount) || 0), 0)
  }

  return (
    <div style={{ padding: '32px', position: 'relative', zIndex: 0 }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '28px', fontWeight: '700', color: '#2C1A0E', marginBottom: '4px' }}>
          Masa Yönetimi
        </h1>
        <p style={{ color: '#9B7B6A', fontSize: '14px' }}>{tables.length} masa tanımlı</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
        {[
          { label: 'Toplam', value: stats.total, color: '#2C1A0E', bg: '#fff' },
          { label: 'Dolu', value: stats.occupied, color: '#C0392B', bg: '#FEF0ED' },
          { label: 'Boş', value: stats.empty, color: '#1E7E34', bg: '#EDF7F0' },
          { label: 'Bekleyen', value: `₺${stats.pending.toFixed(2)}`, color: '#C07A00', bg: '#FDF6E8' },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, borderRadius: '16px', padding: '20px', boxShadow: '0 1px 4px rgba(44,26,14,0.06)' }}>
            <div style={{ fontSize: '11px', color: '#9B7B6A', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{s.label}</div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '28px', fontWeight: '700', color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: '20px', padding: '20px 24px', marginBottom: '24px', boxShadow: '0 2px 12px rgba(44,26,14,0.07)' }}>
        <h2 style={{ fontSize: '14px', fontWeight: '600', color: '#9B7B6A', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '14px' }}>
          Yeni Masa Ekle
        </h2>
        <div style={{ display: 'flex', gap: '12px' }}>
          <input
            type="number"
            placeholder="Masa numarası (ör: 6)"
            value={newNumber}
            onChange={e => setNewNumber(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddTable()}
            style={{ flex: 1, padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #E8DDD5', fontSize: '15px', outline: 'none', background: '#FAF7F2', color: '#2C1A0E' }}
          />
          <button onClick={handleAddTable} disabled={loading}
            style={{ background: '#3D2314', color: '#FAF7F2', padding: '12px 28px', borderRadius: '12px', fontSize: '14px', fontWeight: '600', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Ekleniyor...' : '+ Ekle'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 340px' : '1fr', gap: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '14px', alignContent: 'start' }}>
          {tables.map(table => {
            const s = STATUS[table.status] || STATUS.empty
            const isSelected = selected?.id === table.id
            return (
              <div key={table.id} onClick={() => handleSelectTable(table)} style={{
                background: s.bg, borderRadius: '16px', padding: '20px',
                cursor: 'pointer', textAlign: 'center',
                border: `2px solid ${isSelected ? s.color : s.border}`,
                boxShadow: isSelected ? `0 4px 20px ${s.color}30` : '0 1px 4px rgba(44,26,14,0.06)',
                transition: 'all 0.2s ease'
              }}>
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>{s.icon}</div>
                <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '20px', fontWeight: '600', color: '#2C1A0E', marginBottom: '4px' }}>
                  {table.table_number}
                </div>
                <div style={{ fontSize: '11px', color: s.color, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {s.label}
                </div>
                {table.remaining_amount && parseFloat(table.remaining_amount) > 0 && (
                  <div style={{ marginTop: '8px', background: 'rgba(255,255,255,0.7)', borderRadius: '8px', padding: '4px 8px', fontSize: '13px', fontWeight: '700', color: s.color }}>
                    ₺{parseFloat(table.remaining_amount).toFixed(2)}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {selected && (
          <div style={{ background: '#fff', borderRadius: '20px', padding: '24px', boxShadow: '0 2px 16px rgba(44,26,14,0.08)', height: 'fit-content', position: 'sticky', top: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '20px', color: '#2C1A0E' }}>
                Masa {selected.table_number}
              </h2>
              <button onClick={() => { setSelected(null); setConfirmAction(null) }}
                style={{ background: '#F5F0EB', color: '#9B7B6A', padding: '6px 12px', borderRadius: '8px', fontSize: '13px' }}>
                ✕
              </button>
            </div>

            <div style={{ background: (STATUS[selected.status] || STATUS.empty).bg, borderRadius: '12px', padding: '12px 16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '20px' }}>{(STATUS[selected.status] || STATUS.empty).icon}</span>
              <div>
                <div style={{ fontSize: '11px', color: '#9B7B6A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Durum</div>
                <div style={{ fontWeight: '600', color: (STATUS[selected.status] || STATUS.empty).color, fontSize: '14px' }}>
                  {(STATUS[selected.status] || STATUS.empty).label}
                </div>
              </div>
              {selected.remaining_amount && parseFloat(selected.remaining_amount) > 0 && (
                <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: '#9B7B6A' }}>Kalan</div>
                  <div style={{ fontWeight: '700', color: '#C07A00', fontFamily: 'Playfair Display, serif', fontSize: '18px' }}>
                    ₺{parseFloat(selected.remaining_amount).toFixed(2)}
                  </div>
                </div>
              )}
            </div>

            <div style={{ background: '#FAF7F2', borderRadius: '16px', padding: '20px', marginBottom: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#9B7B6A', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '14px' }}>QR Kod</div>
              {qrMap[selected.table_number] ? (
                <>
                  <img src={qrMap[selected.table_number]} alt={`Masa ${selected.table_number} QR`}
                    style={{ width: '160px', height: '160px', borderRadius: '12px', border: '4px solid #fff', boxShadow: '0 2px 12px rgba(44,26,14,0.1)' }} />
                  <div style={{ fontSize: '12px', color: '#9B7B6A', marginTop: '10px' }}>
                    localhost:5173/masa/{selected.table_number}
                  </div>
                </>
              ) : (
                <div style={{ padding: '30px', color: '#9B7B6A', fontSize: '14px' }}>Yükleniyor...</div>
              )}
            </div>

            {!confirmAction ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {selected.status === 'empty' && (
                  <button onClick={() => setConfirmAction('open')}
                    style={{ background: '#FEF0ED', color: '#C0392B', padding: '12px', borderRadius: '12px', fontSize: '14px', fontWeight: '500' }}>
                    🔴 Manuel Hesap Aç
                  </button>
                )}
                {(selected.status === 'occupied' || selected.status === 'partial') && (
                  <button onClick={() => setConfirmAction('close')}
                    style={{ background: '#EDF7F0', color: '#1E7E34', padding: '12px', borderRadius: '12px', fontSize: '14px', fontWeight: '500' }}>
                    ✅ Hesabı Kapat
                  </button>
                )}
                {selected.status === 'empty' && (
                  <button onClick={() => setConfirmAction('delete')}
                    style={{ background: '#FEF0ED', color: '#C0392B', padding: '12px', borderRadius: '12px', fontSize: '14px', fontWeight: '500' }}>
                    🗑️ Masayı Sil
                  </button>
                )}
              </div>
            ) : (
              <div style={{ background: '#FDF6E8', borderRadius: '14px', padding: '16px' }}>
                <div style={{ fontSize: '14px', color: '#8B6914', marginBottom: '14px', lineHeight: 1.5 }}>
                  {confirmAction === 'open' && `Masa ${selected.table_number} için manuel hesap açılacak. Emin misiniz?`}
                  {confirmAction === 'close' && `Masa ${selected.table_number} hesabı kapatılacak. Emin misiniz?`}
                  {confirmAction === 'delete' && `Masa ${selected.table_number} silinecek. Bu işlem geri alınamaz!`}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => setConfirmAction(null)}
                    style={{ flex: 1, background: '#F5F0EB', color: '#9B7B6A', padding: '10px', borderRadius: '10px', fontSize: '13px' }}>
                    İptal
                  </button>
                  <button onClick={() => {
                    if (confirmAction === 'open') handleOpen(selected)
                    if (confirmAction === 'close') handleClose(selected)
                    if (confirmAction === 'delete') handleDelete(selected)
                  }} style={{ flex: 1, background: '#C0392B', color: '#fff', padding: '10px', borderRadius: '10px', fontSize: '13px', fontWeight: '600' }}>
                    Onayla
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}