import { useState, useEffect } from 'react'
import axios from 'axios'

import { API } from '../config'
const CATEGORIES = ['Ana Yemek', 'Başlangıç', 'İçecek', 'Tatlı', 'Diğer']
const emptyForm = { category: 'Ana Yemek', name: '', price: '' }

export default function MenuManager() {
  const [items, setItems] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editId, setEditId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [filterCat, setFilterCat] = useState('Tümü')

  useEffect(() => { fetchMenu() }, [])

  async function fetchMenu() {
    const res = await axios.get(`${API}/menu/admin`)
    setItems(res.data)
  }

  async function handleSave() {
    if (!form.name.trim() || !form.price) return alert('Ad ve fiyat zorunlu')
    setLoading(true)
    try {
      if (editId) await axios.put(`${API}/menu/${editId}`, { ...form, is_available: true })
      else await axios.post(`${API}/menu`, form)
      setForm(emptyForm); setEditId(null); fetchMenu()
    } catch (err) { alert(err.response?.data?.error || 'Hata') }
    setLoading(false)
  }

  async function handleDelete(id) {
    if (!window.confirm('Bu ürünü silmek istiyor musunuz?')) return
    await axios.delete(`${API}/menu/${id}`)
    fetchMenu()
  }

  async function toggleAvailable(item) {
    await axios.put(`${API}/menu/${item.id}`, { ...item, is_available: !item.is_available })
    fetchMenu()
  }

  function startEdit(item) {
    setEditId(item.id)
    setForm({ category: item.category, name: item.name, price: item.price })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const filtered = filterCat === 'Tümü' ? items : items.filter(i => i.category === filterCat)

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '28px', fontWeight: '700', color: '#2C1A0E', marginBottom: '4px' }}>
          Menü Yönetimi
        </h1>
        <p style={{ color: '#9B7B6A', fontSize: '14px' }}>{items.length} ürün listeleniyor</p>
      </div>

      {/* Form */}
      <div style={{ background: '#fff', borderRadius: '20px', padding: '24px', marginBottom: '28px', boxShadow: '0 2px 12px rgba(44,26,14,0.07)' }}>
        <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#2C1A0E', marginBottom: '16px' }}>
          {editId ? '✏️ Ürün Düzenle' : '➕ Yeni Ürün Ekle'}
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr 140px', gap: '12px', marginBottom: '14px' }}>
          <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
            style={{ padding: '12px 14px', borderRadius: '12px', border: '1.5px solid #E8DDD5', fontSize: '14px', outline: 'none', background: '#FAF7F2', color: '#2C1A0E' }}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <input type="text" placeholder="Ürün adı" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
            style={{ padding: '12px 14px', borderRadius: '12px', border: '1.5px solid #E8DDD5', fontSize: '14px', outline: 'none', background: '#FAF7F2', color: '#2C1A0E' }} />
          <input type="number" placeholder="Fiyat ₺" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })}
            style={{ padding: '12px 14px', borderRadius: '12px', border: '1.5px solid #E8DDD5', fontSize: '14px', outline: 'none', background: '#FAF7F2', color: '#2C1A0E' }} />
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {editId && (
            <button onClick={() => { setEditId(null); setForm(emptyForm) }}
              style={{ background: '#F5F0EB', color: '#9B7B6A', padding: '11px 20px', borderRadius: '12px', fontSize: '14px' }}>
              İptal
            </button>
          )}
          <button onClick={handleSave} disabled={loading}
            style={{ background: '#3D2314', color: '#FAF7F2', padding: '11px 28px', borderRadius: '12px', fontSize: '14px', fontWeight: '600', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Kaydediliyor...' : editId ? 'Güncelle' : 'Ekle'}
          </button>
        </div>
      </div>

      {/* Filtre */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {['Tümü', ...CATEGORIES].map(c => (
          <button key={c} onClick={() => setFilterCat(c)} style={{
            padding: '7px 18px', borderRadius: '20px', fontSize: '13px', fontWeight: '500',
            background: filterCat === c ? '#3D2314' : '#F5F0EB',
            color: filterCat === c ? '#FAF7F2' : '#9B7B6A',
            boxShadow: filterCat === c ? '0 2px 8px rgba(61,35,20,0.2)' : 'none'
          }}>
            {c}
          </button>
        ))}
      </div>

      {/* Tablo */}
      <div style={{ background: '#fff', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(44,26,14,0.07)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 120px 200px', padding: '12px 20px', background: '#F5F0EB', fontSize: '11px', fontWeight: '600', color: '#9B7B6A', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
          <span>Ürün</span><span>Kategori</span><span>Fiyat</span><span>İşlemler</span>
        </div>
        {filtered.map((item, i) => (
          <div key={item.id} style={{
            display: 'grid', gridTemplateColumns: '1fr 140px 120px 200px',
            padding: '14px 20px', alignItems: 'center',
            borderBottom: i < filtered.length - 1 ? '1px solid #F5F0EB' : 'none',
            opacity: item.is_available ? 1 : 0.5,
            transition: 'background 0.15s'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontWeight: '500', fontSize: '15px', color: '#2C1A0E' }}>{item.name}</span>
              {!item.is_available && <span style={{ background: '#FEF0ED', color: '#C0392B', fontSize: '10px', padding: '2px 8px', borderRadius: '8px', fontWeight: '600' }}>Pasif</span>}
            </div>
            <span style={{ fontSize: '13px', color: '#9B7B6A' }}>{item.category}</span>
            <span style={{ fontWeight: '700', color: '#6B3A2A', fontSize: '15px' }}>₺{parseFloat(item.price).toFixed(2)}</span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={() => toggleAvailable(item)} style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '500', background: item.is_available ? '#FDF6E8' : '#EDF7F0', color: item.is_available ? '#C07A00' : '#1E7E34' }}>
                {item.is_available ? 'Pasif' : 'Aktif'}
              </button>
              <button onClick={() => startEdit(item)} style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '500', background: '#EEF2FF', color: '#3B4FD8' }}>
                Düzenle
              </button>
              <button onClick={() => handleDelete(item.id)} style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '500', background: '#FEF0ED', color: '#C0392B' }}>
                Sil
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}