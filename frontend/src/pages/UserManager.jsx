import { useState, useEffect } from 'react'
import axios from 'axios'
import { API } from '../config'

const emptyForm = { name: '', username: '', password: '', role: 'garson' }

export default function UserManager() {
  const [users, setUsers] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editId, setEditId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => { fetchUsers() }, [])

  async function fetchUsers() {
    try {
      const token = localStorage.getItem('restoran_token')
      const res = await axios.get(`${API}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setUsers(res.data)
    } catch (err) {
      alert(err.response?.data?.error || 'Hata')
    }
  }

  async function handleSave() {
    if (!form.name || !form.username) return alert('Ad ve kullanici adi zorunlu')
    if (!editId && !form.password) return alert('Yeni kullanici icin sifre zorunlu')
    setLoading(true)
    try {
      const token = localStorage.getItem('restoran_token')
      const headers = { Authorization: `Bearer ${token}` }
      if (editId) {
        await axios.put(`${API}/users/${editId}`, form, { headers })
      } else {
        await axios.post(`${API}/users`, form, { headers })
      }
      setForm(emptyForm)
      setEditId(null)
      fetchUsers()
    } catch (err) {
      alert(err.response?.data?.error || 'Hata')
    }
    setLoading(false)
  }

  async function handleDelete(id) {
    if (!window.confirm('Bu kullaniciyi silmek istiyor musunuz?')) return
    try {
      const token = localStorage.getItem('restoran_token')
      await axios.delete(`${API}/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchUsers()
    } catch (err) {
      alert(err.response?.data?.error || 'Hata')
    }
  }

  function startEdit(user) {
    setEditId(user.id)
    setForm({ name: user.name, username: user.username, password: '', role: user.role })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const patrons = users.filter(u => u.role === 'patron')
  const garsonlar = users.filter(u => u.role === 'garson')

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '28px', fontWeight: '700', color: '#2C1A0E', marginBottom: '4px' }}>
          Kullanici Yonetimi
        </h1>
        <p style={{ color: '#9B7B6A', fontSize: '14px' }}>{users.length} kullanici kayitli</p>
      </div>

      {/* Form */}
      <div style={{ background: '#fff', borderRadius: '20px', padding: '24px', marginBottom: '28px', boxShadow: '0 2px 12px rgba(44,26,14,0.07)' }}>
        <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#2C1A0E', marginBottom: '16px' }}>
          {editId ? '✏️ Kullanici Duzenle' : '➕ Yeni Kullanici Ekle'}
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 140px', gap: '12px', marginBottom: '14px' }}>
          <input
            placeholder="Ad Soyad"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            style={{ padding: '12px 14px', borderRadius: '12px', border: '1.5px solid #E8DDD5', fontSize: '14px', outline: 'none', background: '#FAF7F2' }}
          />
          <input
            placeholder="Kullanici adi"
            value={form.username}
            onChange={e => setForm({ ...form, username: e.target.value })}
            style={{ padding: '12px 14px', borderRadius: '12px', border: '1.5px solid #E8DDD5', fontSize: '14px', outline: 'none', background: '#FAF7F2' }}
          />
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder={editId ? 'Yeni sifre (bos birak = degistirme)' : 'Sifre'}
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              style={{ width: '100%', padding: '12px 40px 12px 14px', borderRadius: '12px', border: '1.5px solid #E8DDD5', fontSize: '14px', outline: 'none', background: '#FAF7F2', boxSizing: 'border-box' }}
            />
            <button
              onClick={() => setShowPassword(!showPassword)}
              style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', color: '#9B7B6A', fontSize: '16px', padding: '0' }}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
          <select
            value={form.role}
            onChange={e => setForm({ ...form, role: e.target.value })}
            style={{ padding: '12px 14px', borderRadius: '12px', border: '1.5px solid #E8DDD5', fontSize: '14px', outline: 'none', background: '#FAF7F2', color: '#2C1A0E' }}
          >
            <option value="garson">Garson</option>
            <option value="patron">Patron</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {editId && (
            <button onClick={() => { setEditId(null); setForm(emptyForm) }}
              style={{ background: '#F5F0EB', color: '#9B7B6A', padding: '11px 20px', borderRadius: '12px', fontSize: '14px' }}>
              Iptal
            </button>
          )}
          <button onClick={handleSave} disabled={loading}
            style={{ background: '#3D2314', color: '#FAF7F2', padding: '11px 28px', borderRadius: '12px', fontSize: '14px', fontWeight: '600', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Kaydediliyor...' : editId ? 'Guncelle' : 'Ekle'}
          </button>
        </div>
      </div>

      {/* Patron listesi */}
      {patrons.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '12px', color: '#9B7B6A', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '12px' }}>
            Patronlar
          </div>
          <div style={{ background: '#fff', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(44,26,14,0.07)' }}>
            {patrons.map((user, i) => (
              <UserRow key={user.id} user={user} i={i} total={patrons.length}
                onEdit={startEdit} onDelete={handleDelete} />
            ))}
          </div>
        </div>
      )}

      {/* Garson listesi */}
      {garsonlar.length > 0 && (
        <div>
          <div style={{ fontSize: '12px', color: '#9B7B6A', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '12px' }}>
            Garsonlar
          </div>
          <div style={{ background: '#fff', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(44,26,14,0.07)' }}>
            {garsonlar.map((user, i) => (
              <UserRow key={user.id} user={user} i={i} total={garsonlar.length}
                onEdit={startEdit} onDelete={handleDelete} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function UserRow({ user, i, total, onEdit, onDelete }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', padding: '14px 20px',
      borderBottom: i < total - 1 ? '1px solid #F5F0EB' : 'none'
    }}>
      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: user.role === 'patron' ? '#FDF6E8' : '#F5F0EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', marginRight: '14px', flexShrink: 0 }}>
        {user.role === 'patron' ? '👑' : '👨‍🍳'}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: '600', fontSize: '15px', color: '#2C1A0E' }}>{user.name}</div>
        <div style={{ fontSize: '13px', color: '#9B7B6A' }}>@{user.username}</div>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={() => onEdit(user)}
          style={{ background: '#EEF2FF', color: '#3B4FD8', padding: '6px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '500' }}>
          Duzenle
        </button>
        <button onClick={() => onDelete(user.id)}
          style={{ background: '#FEF0ED', color: '#C0392B', padding: '6px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '500' }}>
          Sil
        </button>
      </div>
    </div>
  )
}