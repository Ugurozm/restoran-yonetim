import { useState, useEffect } from 'react'
import axios from 'axios'

import { API, SOCKET_URL } from '../config'

const STATUS = {
  empty:    { bg: '#F5F0EB', border: '#E8DDD5', color: '#9B7B6A', label: 'Bos',           icon: '🪑' },
  occupied: { bg: '#FEF0ED', border: '#F5C4B8', color: '#C0392B', label: 'Acik Hesap',    icon: '🔴' },
  partial:  { bg: '#FDF6E8', border: '#F0D89A', color: '#C07A00', label: 'Kismen Odendi', icon: '🟡' },
  closed:   { bg: '#EDF7F0', border: '#A8DDB8', color: '#1E7E34', label: 'Kapandi',       icon: '✅' },
}

export default function WaiterDashboard() {
  const [tables, setTables] = useState([])
  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState(null)
  const [notification, setNotification] = useState(null)
  const [activeTab, setActiveTab] = useState('items') // 'items' | 'payments' | 'add'
  const [menu, setMenu] = useState([])
  const [editItem, setEditItem] = useState(null)
  const [editForm, setEditForm] = useState({ item_name: '', price: '' })
  const [addForm, setAddForm] = useState({ item_name: '', price: '' })
  const [addMode, setAddMode] = useState('menu') // 'menu' | 'manual'
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchTables()
    axios.get(`${API}/menu`).then(r => setMenu(r.data))

    let socket
    import('socket.io-client').then(({ io }) => {
      socket = io('http://localhost:3001')
      socket.on('payment_update', data => {
        showNotification('payment', `💳 ${data.payer_name} odeme yapti`)
        fetchTables()
        if (selected) refreshDetail(selected)
      })
      socket.on('new_order', data => {
        showNotification('order', `🍽️ Masa ${data.table_number} siparis verdi`)
        fetchTables()
      })
      socket.on('order_updated', () => {
        fetchTables()
        if (selected) refreshDetail(selected)
      })
    })
    return () => { if (socket) socket.disconnect() }
  }, [])

  function showNotification(type, text) {
    setNotification({ type, text })
    setTimeout(() => setNotification(null), 4000)
  }

  async function fetchTables() {
    const res = await axios.get(`${API}/tables`)
    setTables(res.data)
  }

  async function refreshDetail(table) {
    if (table.order_id) {
      const res = await axios.get(`${API}/orders/${table.order_id}`)
      setDetail(res.data)
    }
  }

  async function selectTable(table) {
    setSelected(table)
    setActiveTab('items')
    setEditItem(null)
    setAddForm({ item_name: '', price: '' })
    if (table.order_id) {
      const res = await axios.get(`${API}/orders/${table.order_id}`)
      setDetail(res.data)
    } else {
      setDetail(null)
    }
  }

  async function handleDeleteItem(itemId) {
    if (!window.confirm('Bu urunu silmek istiyor musunuz?')) return
    try {
      await axios.delete(`${API}/orders/item/${itemId}`)
      refreshDetail(selected)
      fetchTables()
    } catch (err) {
      alert(err.response?.data?.error || 'Hata')
    }
  }

  async function handleEditItem() {
    if (!editForm.item_name || !editForm.price) return alert('Tum alanlari doldurun')
    setLoading(true)
    try {
      await axios.put(`${API}/orders/item/${editItem.id}`, editForm)
      setEditItem(null)
      refreshDetail(selected)
      fetchTables()
    } catch (err) {
      alert(err.response?.data?.error || 'Hata')
    }
    setLoading(false)
  }

  async function handleAddItem() {
    if (!addForm.item_name || !addForm.price) return alert('Tum alanlari doldurun')
    setLoading(true)
    try {
      await axios.post(`${API}/orders/${detail.order.id}/add-item`, addForm)
      setAddForm({ item_name: '', price: '' })
      refreshDetail(selected)
      fetchTables()
    } catch (err) {
      alert(err.response?.data?.error || 'Hata')
    }
    setLoading(false)
  }

  async function handleAddFromMenu(menuItem) {
    setLoading(true)
    try {
      await axios.post(`${API}/orders/${detail.order.id}/add-item`, {
        item_name: menuItem.name,
        price: menuItem.price
      })
      refreshDetail(selected)
      fetchTables()
      showNotification('order', `${menuItem.name} eklendi`)
    } catch (err) {
      alert(err.response?.data?.error || 'Hata')
    }
    setLoading(false)
  }

  const stats = {
    total: tables.length,
    occupied: tables.filter(t => t.status === 'occupied' || t.status === 'partial').length,
    pending: tables.reduce((s, t) => s + (parseFloat(t.remaining_amount) || 0), 0)
  }

  const menuCategories = [...new Set(menu.map(m => m.category))]

  return (
    <div style={{ padding: '32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '28px', fontWeight: '700', color: '#2C1A0E', marginBottom: '4px' }}>
            Garson Paneli
          </h1>
          <p style={{ color: '#9B7B6A', fontSize: '14px' }}>
            {new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        {notification && (
          <div style={{
            background: notification.type === 'order' ? '#FDF6E8' : '#EDF7F0',
            border: `1px solid ${notification.type === 'order' ? '#F0D89A' : '#A8DDB8'}`,
            borderRadius: '12px', padding: '10px 16px', fontSize: '13px',
            color: notification.type === 'order' ? '#8B6914' : '#1E7E34', maxWidth: '280px'
          }}>
            {notification.text}
          </div>
        )}
      </div>

      {/* Özet */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
        {[
          { label: 'Toplam Masa', value: stats.total, color: '#2C1A0E', bg: '#fff' },
          { label: 'Dolu Masa', value: stats.occupied, color: '#C0392B', bg: '#FEF0ED' },
          { label: 'Bekleyen', value: `₺${stats.pending.toFixed(2)}`, color: '#C07A00', bg: '#FDF6E8' },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, borderRadius: '16px', padding: '20px', boxShadow: '0 1px 4px rgba(44,26,14,0.06)' }}>
            <div style={{ fontSize: '12px', color: '#9B7B6A', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{s.label}</div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '28px', fontWeight: '700', color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 420px' : '1fr', gap: '24px' }}>
        {/* Masa grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '14px', alignContent: 'start' }}>
          {tables.map(table => {
            const s = STATUS[table.status] || STATUS.empty
            const isSelected = selected?.id === table.id
            return (
              <div key={table.id} onClick={() => selectTable(table)} style={{
                background: s.bg, borderRadius: '16px', padding: '20px',
                cursor: 'pointer', textAlign: 'center',
                border: `2px solid ${isSelected ? s.color : s.border}`,
                boxShadow: isSelected ? `0 4px 20px ${s.color}30` : '0 1px 4px rgba(44,26,14,0.06)',
                transition: 'all 0.2s ease'
              }}>
                <div style={{ fontSize: '30px', marginBottom: '8px' }}>{s.icon}</div>
                <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '18px', fontWeight: '600', color: '#2C1A0E', marginBottom: '4px' }}>
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

        {/* Detay paneli */}
        {selected && (
          <div style={{ background: '#fff', borderRadius: '20px', padding: '24px', boxShadow: '0 2px 16px rgba(44,26,14,0.08)', height: 'fit-content', position: 'sticky', top: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '20px', color: '#2C1A0E' }}>
                Masa {selected.table_number}
              </h2>
              <button onClick={() => setSelected(null)} style={{ background: '#F5F0EB', color: '#9B7B6A', padding: '6px 12px', borderRadius: '8px', fontSize: '13px' }}>✕</button>
            </div>

            {!detail ? (
              <p style={{ color: '#9B7B6A', fontSize: '14px', textAlign: 'center', padding: '40px 0' }}>Bu masada acik hesap yok.</p>
            ) : (
              <>
                {/* Özet */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
                  {[
                    { label: 'Toplam', value: `₺${parseFloat(detail.order.total_amount).toFixed(2)}`, color: '#2C1A0E', bg: '#F5F0EB' },
                    { label: 'Kalan', value: `₺${parseFloat(detail.order.remaining_amount).toFixed(2)}`, color: '#C0392B', bg: '#FEF0ED' },
                    { label: 'Odendi', value: `₺${(parseFloat(detail.order.total_amount) - parseFloat(detail.order.remaining_amount)).toFixed(2)}`, color: '#1E7E34', bg: '#EDF7F0' },
                  ].map(s => (
                    <div key={s.label} style={{ background: s.bg, borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
                      <div style={{ fontSize: '10px', color: '#9B7B6A', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
                      <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '15px', fontWeight: '700', color: s.color }}>{s.value}</div>
                    </div>
                  ))}
                </div>

                {/* Sekmeler */}
                <div style={{ display: 'flex', background: '#F5F0EB', borderRadius: '10px', padding: '4px', gap: '4px', marginBottom: '16px' }}>
                  {[
                    { key: 'items', label: '🍽️ Urunler' },
                    { key: 'add', label: '➕ Ekle' },
                    { key: 'payments', label: '💳 Odemeler' },
                  ].map(t => (
                    <button key={t.key} onClick={() => { setActiveTab(t.key); setEditItem(null) }} style={{
                      flex: 1, padding: '8px 4px', borderRadius: '8px', fontSize: '12px', fontWeight: '500',
                      background: activeTab === t.key ? '#fff' : 'transparent',
                      color: activeTab === t.key ? '#2C1A0E' : '#9B7B6A',
                      boxShadow: activeTab === t.key ? '0 1px 3px rgba(44,26,14,0.1)' : 'none'
                    }}>
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* ÜRÜNLER SEKMESİ */}
                {activeTab === 'items' && (
                  <div>
                    {detail.items.length === 0 ? (
                      <p style={{ color: '#9B7B6A', fontSize: '14px', textAlign: 'center', padding: '20px' }}>Henuz urun yok.</p>
                    ) : detail.items.map(item => (
                      <div key={item.id}>
                        {editItem?.id === item.id ? (
                          // Düzenleme formu
                          <div style={{ background: '#FDF6E8', borderRadius: '12px', padding: '12px', marginBottom: '8px' }}>
                            <input
                              value={editForm.item_name}
                              onChange={e => setEditForm({ ...editForm, item_name: e.target.value })}
                              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #E8DDD5', fontSize: '14px', marginBottom: '8px', outline: 'none', boxSizing: 'border-box' }}
                            />
                            <input
                              type="number"
                              value={editForm.price}
                              onChange={e => setEditForm({ ...editForm, price: e.target.value })}
                              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #E8DDD5', fontSize: '14px', marginBottom: '10px', outline: 'none', boxSizing: 'border-box' }}
                            />
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button onClick={() => setEditItem(null)} style={{ flex: 1, background: '#F5F0EB', color: '#9B7B6A', padding: '8px', borderRadius: '8px', fontSize: '13px' }}>Iptal</button>
                              <button onClick={handleEditItem} disabled={loading} style={{ flex: 1, background: '#3D2314', color: '#FAF7F2', padding: '8px', borderRadius: '8px', fontSize: '13px', fontWeight: '600' }}>Kaydet</button>
                            </div>
                          </div>
                        ) : (
                          // Normal satır
                          <div style={{ display: 'flex', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #F5F0EB', opacity: item.is_paid ? 0.45 : 1 }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '14px', color: '#2C1A0E' }}>{item.is_paid ? '✅ ' : ''}{item.item_name}</div>
                              <div style={{ fontSize: '13px', fontWeight: '700', color: '#6B3A2A' }}>₺{parseFloat(item.price).toFixed(2)}</div>
                            </div>
                            {!item.is_paid && (
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button
                                  onClick={() => { setEditItem(item); setEditForm({ item_name: item.item_name, price: item.price }) }}
                                  style={{ background: '#EEF2FF', color: '#3B4FD8', padding: '5px 10px', borderRadius: '7px', fontSize: '12px' }}
                                >
                                  Duzenle
                                </button>
                                <button
                                  onClick={() => handleDeleteItem(item.id)}
                                  style={{ background: '#FEF0ED', color: '#C0392B', padding: '5px 10px', borderRadius: '7px', fontSize: '12px' }}
                                >
                                  Sil
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* EKLE SEKMESİ */}
                {activeTab === 'add' && (
                  <div>
                    {/* Mod seçici */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                      <button onClick={() => setAddMode('menu')} style={{ flex: 1, padding: '8px', borderRadius: '8px', fontSize: '13px', background: addMode === 'menu' ? '#3D2314' : '#F5F0EB', color: addMode === 'menu' ? '#FAF7F2' : '#9B7B6A' }}>
                        Menudan Sec
                      </button>
                      <button onClick={() => setAddMode('manual')} style={{ flex: 1, padding: '8px', borderRadius: '8px', fontSize: '13px', background: addMode === 'manual' ? '#3D2314' : '#F5F0EB', color: addMode === 'manual' ? '#FAF7F2' : '#9B7B6A' }}>
                        Manuel Gir
                      </button>
                    </div>

                    {addMode === 'menu' ? (
                      // Menüden seç
                      <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        {menuCategories.map(cat => (
                          <div key={cat}>
                            <div style={{ fontSize: '11px', color: '#9B7B6A', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.8px', margin: '10px 0 6px' }}>{cat}</div>
                            {menu.filter(m => m.category === cat).map(item => (
                              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: '#FAF7F2', borderRadius: '10px', marginBottom: '6px' }}>
                                <div>
                                  <div style={{ fontSize: '14px', color: '#2C1A0E', fontWeight: '500' }}>{item.name}</div>
                                  <div style={{ fontSize: '13px', color: '#6B3A2A', fontWeight: '700' }}>₺{parseFloat(item.price).toFixed(2)}</div>
                                </div>
                                <button
                                  onClick={() => handleAddFromMenu(item)}
                                  disabled={loading}
                                  style={{ background: '#3D2314', color: '#FAF7F2', padding: '6px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '600' }}
                                >
                                  + Ekle
                                </button>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    ) : (
                      // Manuel gir
                      <div>
                        <input
                          placeholder="Urun adi"
                          value={addForm.item_name}
                          onChange={e => setAddForm({ ...addForm, item_name: e.target.value })}
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #E8DDD5', fontSize: '14px', marginBottom: '10px', outline: 'none', background: '#FAF7F2', boxSizing: 'border-box' }}
                        />
                        <input
                          type="number"
                          placeholder="Fiyat (₺)"
                          value={addForm.price}
                          onChange={e => setAddForm({ ...addForm, price: e.target.value })}
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #E8DDD5', fontSize: '14px', marginBottom: '12px', outline: 'none', background: '#FAF7F2', boxSizing: 'border-box' }}
                        />
                        <button
                          onClick={handleAddItem}
                          disabled={loading}
                          style={{ width: '100%', background: '#3D2314', color: '#FAF7F2', padding: '12px', borderRadius: '12px', fontSize: '14px', fontWeight: '600', opacity: loading ? 0.7 : 1 }}
                        >
                          {loading ? 'Ekleniyor...' : 'Adisyona Ekle'}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* ÖDEMELER SEKMESİ */}
                {activeTab === 'payments' && (
                  <div>
                    {detail.transactions.length === 0 ? (
                      <p style={{ color: '#9B7B6A', fontSize: '14px', textAlign: 'center', padding: '20px' }}>Henuz odeme yok.</p>
                    ) : detail.transactions.map(tx => (
                      <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', background: '#EDF7F0', borderRadius: '10px', padding: '10px 14px', marginBottom: '6px' }}>
                        <div>
                          <div style={{ fontSize: '13px', color: '#1E7E34', fontWeight: '600' }}>👤 {tx.payer_name}</div>
                          <div style={{ fontSize: '11px', color: '#9B7B6A', marginTop: '2px' }}>
                            {tx.payment_type === 'item_based' ? 'Urun bazli' : 'Tutar bazli'} · {new Date(tx.created_at).toLocaleTimeString('tr-TR')}
                          </div>
                        </div>
                        <span style={{ fontWeight: '700', color: '#1E7E34', fontSize: '15px' }}>₺{parseFloat(tx.amount).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}