import { useState } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

import { API } from '../config'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleLogin() {
    if (!username || !password) return setError('Tüm alanları doldurun')
    setLoading(true)
    setError('')
    try {
      const res = await axios.post(`${API}/auth/login`, { username, password })
      login(res.data.user, res.data.token)
      navigate(res.data.user.role === 'patron' ? '/yonetim' : '/garson')
    } catch (err) {
      setError(err.response?.data?.error || 'Giriş başarısız')
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(160deg, #2C1A0E 0%, #3D2314 50%, #6B3A2A 100%)'
    }}>
      <div style={{ width: '100%', maxWidth: '380px', padding: '0 24px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '36px', color: '#FAF7F2', fontWeight: '700' }}>
            Restoran
          </div>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginTop: '6px', letterSpacing: '2px', textTransform: 'uppercase' }}>
            Yönetim Sistemi
          </div>
        </div>

        {/* Kart */}
        <div style={{ background: '#FAF7F2', borderRadius: '24px', padding: '32px' }}>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '22px', color: '#2C1A0E', marginBottom: '24px', textAlign: 'center' }}>
            Giriş Yap
          </h2>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#9B7B6A', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>
              Kullanıcı Adı
            </label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="patron / garson1"
              style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1.5px solid #E8DDD5', fontSize: '15px', outline: 'none', background: '#fff', color: '#2C1A0E', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#9B7B6A', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>
              Şifre
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="••••"
              style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1.5px solid #E8DDD5', fontSize: '15px', outline: 'none', background: '#fff', color: '#2C1A0E', boxSizing: 'border-box' }}
            />
          </div>

          {error && (
            <div style={{ background: '#FEF0ED', border: '1px solid #F5C4B8', borderRadius: '10px', padding: '10px 14px', marginBottom: '16px', fontSize: '14px', color: '#C0392B' }}>
              {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            style={{ width: '100%', background: '#3D2314', color: '#FAF7F2', padding: '15px', borderRadius: '14px', fontSize: '15px', fontWeight: '600', opacity: loading ? 0.7 : 1, fontFamily: 'DM Sans, sans-serif' }}
          >
            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>

          <div style={{ marginTop: '20px', padding: '14px', background: '#F5F0EB', borderRadius: '12px', fontSize: '12px', color: '#9B7B6A' }}>
            <div style={{ fontWeight: '600', marginBottom: '6px', color: '#6B3A2A' }}>Demo hesaplar:</div>
            <div>👑 patron / 1234 → Tam erişim</div>
            <div>👨‍🍳 garson1 / 1234 → Garson paneli</div>
          </div>
        </div>
      </div>
    </div>
  )
}