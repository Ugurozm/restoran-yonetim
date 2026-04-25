import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'

const API = 'http://localhost:3001/api'

// Font ve global stiller
const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');

    .table-view * { box-sizing: border-box; }

    .table-view {
      font-family: 'DM Sans', sans-serif;
      background: #FAF7F2;
      min-height: 100vh;
      color: #2C1A0E;
    }

    .tv-hero {
      background: linear-gradient(160deg, #3D2314 0%, #6B3A2A 60%, #8B5E3C 100%);
      padding: 36px 24px 48px;
      position: relative;
      overflow: hidden;
    }

    .tv-hero::before {
      content: '';
      position: absolute;
      top: -40px; right: -40px;
      width: 180px; height: 180px;
      background: rgba(255,255,255,0.04);
      border-radius: 50%;
    }

    .tv-hero::after {
      content: '';
      position: absolute;
      bottom: -60px; left: -30px;
      width: 220px; height: 220px;
      background: rgba(255,255,255,0.03);
      border-radius: 50%;
    }

    .tv-tab-btn {
      flex: 1;
      padding: 11px;
      border-radius: 10px;
      font-size: 14px;
      font-family: 'DM Sans', sans-serif;
      font-weight: 500;
      border: none;
      cursor: pointer;
      transition: all 0.25s ease;
    }

    .tv-tab-btn.active {
      background: #3D2314;
      color: #FAF7F2;
      box-shadow: 0 2px 8px rgba(61,35,20,0.25);
    }

    .tv-tab-btn.inactive {
      background: transparent;
      color: #9B7B6A;
    }

    .tv-menu-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 16px;
      background: #fff;
      border-radius: 14px;
      margin-bottom: 10px;
      box-shadow: 0 1px 4px rgba(61,35,20,0.07);
      transition: all 0.2s ease;
      cursor: pointer;
    }

    .tv-menu-item:active {
      transform: scale(0.98);
    }

    .tv-qty-btn {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: none;
      cursor: pointer;
      font-size: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s;
      font-family: 'DM Sans', sans-serif;
    }

    .tv-qty-btn:active { transform: scale(0.9); }

    .tv-cart-bar {
      position: sticky;
      bottom: 20px;
      margin: 0 0 8px;
      background: #3D2314;
      border-radius: 18px;
      padding: 16px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 8px 32px rgba(61,35,20,0.35);
      animation: slideUp 0.3s ease;
    }

    @keyframes slideUp {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .tv-fade { animation: fadeIn 0.35s ease; }

    .tv-order-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 13px 0;
      border-bottom: 1px solid #F0E8DF;
    }

    .tv-pay-mode-btn {
      flex: 1;
      background: #fff;
      border: 2px solid #E8DDD5;
      border-radius: 14px;
      padding: 16px 12px;
      cursor: pointer;
      text-align: center;
      transition: all 0.2s;
      font-family: 'DM Sans', sans-serif;
    }

    .tv-pay-mode-btn:hover {
      border-color: #8B5E3C;
      background: #FDF9F5;
    }

    .tv-input {
      width: 100%;
      padding: 14px 16px;
      border-radius: 12px;
      border: 1.5px solid #E8DDD5;
      font-size: 15px;
      font-family: 'DM Sans', sans-serif;
      outline: none;
      background: #fff;
      color: #2C1A0E;
      transition: border-color 0.2s;
      margin-bottom: 12px;
    }

    .tv-input:focus { border-color: #8B5E3C; }

    .tv-btn-primary {
      background: #3D2314;
      color: #FAF7F2;
      border: none;
      border-radius: 14px;
      padding: 15px 28px;
      font-size: 15px;
      font-weight: 600;
      font-family: 'DM Sans', sans-serif;
      cursor: pointer;
      transition: all 0.2s;
    }

    .tv-btn-primary:hover { background: #5C3520; }
    .tv-btn-primary:active { transform: scale(0.97); }
    .tv-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

    .tv-btn-secondary {
      background: #F0E8DF;
      color: #6B3A2A;
      border: none;
      border-radius: 14px;
      padding: 15px 20px;
      font-size: 15px;
      font-weight: 500;
      font-family: 'DM Sans', sans-serif;
      cursor: pointer;
      transition: all 0.2s;
    }

    .tv-btn-secondary:hover { background: #E8DDD5; }

    .tv-success {
      min-height: 80vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      padding: 40px 24px;
      animation: fadeIn 0.5s ease;
      text-align: center;
    }

    .tv-success-icon {
      width: 88px;
      height: 88px;
      background: linear-gradient(135deg, #6B3A2A, #8B5E3C);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 40px;
      margin-bottom: 8px;
      box-shadow: 0 8px 32px rgba(107,58,42,0.3);
    }

    .tv-cat-label {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 1.2px;
      text-transform: uppercase;
      color: #9B7B6A;
      margin: 20px 0 10px;
      padding-left: 4px;
    }
  `}</style>
)

export default function TableView() {
  const { tableNumber } = useParams()
  const [tab, setTab] = useState('order')
  const [data, setData] = useState(null)
  const [menu, setMenu] = useState([])
  const [cart, setCart] = useState([])
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [mode, setMode] = useState(null)
  const [selectedItems, setSelectedItems] = useState([])
  const [customAmount, setCustomAmount] = useState('')
  const [payerName, setPayerName] = useState('')
  const [loading, setLoading] = useState(false)
  const [paySuccess, setPaySuccess] = useState(false)

  useEffect(() => {
    fetchData()
    axios.get(`${API}/menu`).then(res => setMenu(res.data))
  }, [])

  async function fetchData() {
    const res = await axios.get(`${API}/tables/${tableNumber}`)
    setData(res.data)
  }

  function addToCart(item) {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id)
      if (existing) return prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c)
      return [...prev, { ...item, qty: 1 }]
    })
  }

  function removeFromCart(id) {
    setCart(prev => {
      const existing = prev.find(c => c.id === id)
      if (existing.qty === 1) return prev.filter(c => c.id !== id)
      return prev.map(c => c.id === id ? { ...c, qty: c.qty - 1 } : c)
    })
  }

  function cartTotal() {
    return cart.reduce((sum, c) => sum + c.price * c.qty, 0)
  }

  async function handleOrder() {
    if (cart.length === 0) return
    setLoading(true)
    try {
      const items = cart.flatMap(c =>
        Array.from({ length: c.qty }, () => ({ name: c.name, price: c.price }))
      )
      await axios.post(`${API}/orders/add-items`, { table_number: parseInt(tableNumber), items })
      setCart([])
      setOrderSuccess(true)
      fetchData()
    } catch (err) {
      alert(err.response?.data?.error || 'Hata oluştu')
    }
    setLoading(false)
  }

  function toggleItem(item) {
    if (item.is_paid) return
    setSelectedItems(prev =>
      prev.includes(item.id) ? prev.filter(i => i !== item.id) : [...prev, item.id]
    )
  }

  function selectedTotal() {
    if (!data) return 0
    return data.items
      .filter(i => selectedItems.includes(i.id))
      .reduce((sum, i) => sum + parseFloat(i.price), 0)
  }

  async function handlePay() {
    if (!payerName.trim()) return alert('Adınızı girin')
    const amount = mode === 'item' ? selectedTotal() : parseFloat(customAmount)
    if (!amount || amount <= 0) return alert('Geçerli bir tutar girin')
    setLoading(true)
    try {
      await axios.post(`${API}/pay`, {
        order_id: data.order.id,
        payment_type: mode === 'item' ? 'item_based' : 'amount_based',
        amount,
        item_ids: mode === 'item' ? selectedItems : [],
        payer_name: payerName
      })
      setPaySuccess(true)
      fetchData()
    } catch (err) {
      alert(err.response?.data?.error || 'Hata oluştu')
    }
    setLoading(false)
  }

  if (!data) return (
    <div className="table-view" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <GlobalStyle />
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>🍽️</div>
        <div style={{ fontFamily: 'DM Sans, sans-serif', color: '#9B7B6A' }}>Yükleniyor...</div>
      </div>
    </div>
  )

  const categories = [...new Set(menu.map(m => m.category))]

  return (
    <div className="table-view">
      <GlobalStyle />

      {/* Hero Header */}
      <div className="tv-hero">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <span style={{ background: 'rgba(255,255,255,0.15)', color: '#F5D9C8', fontSize: '12px', fontWeight: '500', padding: '4px 12px', borderRadius: '20px', fontFamily: 'DM Sans, sans-serif' }}>
              Masa {tableNumber}
            </span>
          </div>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '30px', fontWeight: '700', color: '#FAF7F2', margin: '0 0 6px', lineHeight: 1.2 }}>
            {tab === 'order' ? 'Sipariş Ver' : 'Hesabı Öde'}
          </h1>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: 'rgba(255,255,255,0.55)', margin: 0 }}>
            {tab === 'order' ? 'Menüden istediğinizi seçin' : 'Hesabınızı kolayca ödeyin'}
          </p>
        </div>
      </div>

      {/* Tab seçici */}
      <div style={{ padding: '0 16px', marginTop: '-20px', position: 'relative', zIndex: 2 }}>
        <div style={{ background: '#F0E8DF', borderRadius: '14px', padding: '5px', display: 'flex', gap: '4px', boxShadow: '0 4px 16px rgba(61,35,20,0.12)' }}>
          <button className={`tv-tab-btn ${tab === 'order' ? 'active' : 'inactive'}`} onClick={() => setTab('order')}>
            🍽️ Sipariş
          </button>
          <button className={`tv-tab-btn ${tab === 'pay' ? 'active' : 'inactive'}`} onClick={() => setTab('pay')}>
            💳 Ödeme
          </button>
        </div>
      </div>

      {/* SİPARİŞ SEKMESİ */}
      {tab === 'order' && (
        <div className="tv-fade" style={{ padding: '20px 16px' }}>

          {orderSuccess && (
            <div style={{ background: 'linear-gradient(135deg, #3D2314, #6B3A2A)', borderRadius: '16px', padding: '16px 20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <span style={{ fontSize: '28px' }}>✅</span>
              <div>
                <div style={{ color: '#FAF7F2', fontWeight: '600', fontSize: '15px', fontFamily: 'DM Sans, sans-serif' }}>Siparişiniz alındı!</div>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', fontFamily: 'DM Sans, sans-serif' }}>Kısa süre içinde hazırlanacak</div>
              </div>
              <button onClick={() => setOrderSuccess(false)} style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.15)', border: 'none', color: '#FAF7F2', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                Tamam
              </button>
            </div>
          )}

          {categories.map(cat => (
            <div key={cat}>
              <div className="tv-cat-label">{cat}</div>
              {menu.filter(m => m.category === cat).map(item => {
                const inCart = cart.find(c => c.id === item.id)
                return (
                  <div key={item.id} className="tv-menu-item">
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', fontSize: '15px', fontFamily: 'DM Sans, sans-serif', color: '#2C1A0E', marginBottom: '2px' }}>
                        {item.name}
                      </div>
                      <div style={{ fontWeight: '700', fontSize: '15px', color: '#8B5E3C', fontFamily: 'DM Sans, sans-serif' }}>
                        ₺{parseFloat(item.price).toFixed(2)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {inCart ? (
                        <>
                          <button className="tv-qty-btn" onClick={() => removeFromCart(item.id)} style={{ background: '#F0E8DF', color: '#3D2314' }}>−</button>
                          <span style={{ fontWeight: '700', minWidth: '18px', textAlign: 'center', fontSize: '16px', color: '#3D2314', fontFamily: 'DM Sans, sans-serif' }}>{inCart.qty}</span>
                          <button className="tv-qty-btn" onClick={() => addToCart(item)} style={{ background: '#3D2314', color: '#FAF7F2' }}>+</button>
                        </>
                      ) : (
                        <button className="tv-qty-btn" onClick={() => addToCart(item)} style={{ background: '#3D2314', color: '#FAF7F2' }}>+</button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}

          {cart.length > 0 && (
            <div className="tv-cart-bar">
              <div>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', fontFamily: 'DM Sans, sans-serif' }}>
                  {cart.reduce((s, c) => s + c.qty, 0)} ürün seçildi
                </div>
                <div style={{ color: '#FAF7F2', fontWeight: '700', fontSize: '20px', fontFamily: 'Playfair Display, serif' }}>
                  ₺{cartTotal().toFixed(2)}
                </div>
              </div>
              <button onClick={handleOrder} disabled={loading} className="tv-btn-primary" style={{ background: '#8B5E3C', padding: '12px 24px' }}>
                {loading ? 'Gönderiliyor...' : 'Siparişi Gönder →'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ÖDEME SEKMESİ */}
      {tab === 'pay' && (
        <div className="tv-fade" style={{ padding: '20px 16px' }}>
          {!data.order ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9B7B6A', fontFamily: 'DM Sans, sans-serif' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🍽️</div>
              <div style={{ fontSize: '16px' }}>Bu masada açık hesap yok.</div>
            </div>
          ) : paySuccess ? (
            <div className="tv-success">
              <div className="tv-success-icon">✅</div>
              <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '28px', color: '#2C1A0E', margin: 0 }}>
                Ödeme Başarılı!
              </h2>
              <p style={{ color: '#9B7B6A', fontFamily: 'DM Sans, sans-serif', fontSize: '15px', lineHeight: 1.6, margin: 0 }}>
                Afiyet olsun!<br />Dijital fişiniz e-posta adresinize gönderildi.
              </p>
              {parseFloat(data.order.remaining_amount) > 0 && (
                <div style={{ background: '#F0E8DF', borderRadius: '12px', padding: '12px 20px', fontFamily: 'DM Sans, sans-serif', color: '#6B3A2A', fontSize: '14px' }}>
                  Kalan tutar: <strong>₺{parseFloat(data.order.remaining_amount).toFixed(2)}</strong>
                </div>
              )}
              <button onClick={() => { setPaySuccess(false); setMode(null); setSelectedItems([]); setCustomAmount(''); fetchData() }} className="tv-btn-primary" style={{ marginTop: '8px' }}>
                Geri Dön
              </button>
            </div>
          ) : (
            <>
              {/* Hesap özeti */}
              <div style={{ background: 'linear-gradient(135deg, #3D2314, #6B3A2A)', borderRadius: '20px', padding: '24px', marginBottom: '20px' }}>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>Toplam Hesap</div>
                <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '36px', color: '#FAF7F2', marginBottom: '12px' }}>
                  ₺{parseFloat(data.order.total_amount).toFixed(2)}
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ flex: 1, background: 'rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px' }}>
                    <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginBottom: '2px' }}>Ödendi</div>
                    <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '16px', fontWeight: '700', color: '#A8D5A2' }}>
                      ₺{(parseFloat(data.order.total_amount) - parseFloat(data.order.remaining_amount)).toFixed(2)}
                    </div>
                  </div>
                  <div style={{ flex: 1, background: 'rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px' }}>
                    <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginBottom: '2px' }}>Kalan</div>
                    <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '16px', fontWeight: '700', color: '#F5D9C8' }}>
                      ₺{parseFloat(data.order.remaining_amount).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Ürün listesi */}
              <div style={{ background: '#fff', borderRadius: '20px', padding: '20px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(61,35,20,0.08)' }}>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', fontWeight: '600', color: '#9B7B6A', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: '12px' }}>
                  Siparişler
                </div>
                {data.items.map(item => (
                  <div key={item.id} className="tv-order-item"
                    onClick={() => mode === 'item' && toggleItem(item)}
                    style={{ cursor: mode === 'item' && !item.is_paid ? 'pointer' : 'default', opacity: item.is_paid ? 0.45 : 1, background: selectedItems.includes(item.id) ? '#FDF5EE' : 'transparent', borderRadius: '8px', padding: '13px 8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {mode === 'item' && !item.is_paid && (
                        <div style={{ width: '22px', height: '22px', borderRadius: '50%', border: selectedItems.includes(item.id) ? '2px solid #8B5E3C' : '2px solid #E8DDD5', background: selectedItems.includes(item.id) ? '#8B5E3C' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                          {selectedItems.includes(item.id) && <span style={{ color: '#fff', fontSize: '12px' }}>✓</span>}
                        </div>
                      )}
                      <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '15px', color: '#2C1A0E' }}>
                        {item.is_paid ? '✅ ' : ''}{item.item_name}
                      </span>
                    </div>
                    <span style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: '600', fontSize: '15px', color: '#6B3A2A' }}>
                      ₺{parseFloat(item.price).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Mod seçimi */}
              {!mode && (
                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                  <button className="tv-pay-mode-btn" onClick={() => setMode('item')}>
                    <div style={{ fontSize: '24px', marginBottom: '6px' }}>🍽️</div>
                    <div style={{ fontWeight: '600', fontSize: '14px', color: '#2C1A0E' }}>Ürün Seç</div>
                    <div style={{ fontSize: '12px', color: '#9B7B6A', marginTop: '2px' }}>Ürün bazlı öde</div>
                  </button>
                  <button className="tv-pay-mode-btn" onClick={() => setMode('amount')}>
                    <div style={{ fontSize: '24px', marginBottom: '6px' }}>💰</div>
                    <div style={{ fontWeight: '600', fontSize: '14px', color: '#2C1A0E' }}>Tutar Gir</div>
                    <div style={{ fontSize: '12px', color: '#9B7B6A', marginTop: '2px' }}>İstediğin kadar öde</div>
                  </button>
                </div>
              )}

              {/* Ödeme formu */}
              {mode && (
                <div className="tv-fade" style={{ background: '#fff', borderRadius: '20px', padding: '20px', boxShadow: '0 2px 8px rgba(61,35,20,0.08)' }}>
                  <input className="tv-input" type="text" placeholder="Adınız" value={payerName} onChange={e => setPayerName(e.target.value)} />
                  {mode === 'amount' && (
                    <input className="tv-input" type="number" placeholder="Tutar (₺)" value={customAmount} onChange={e => setCustomAmount(e.target.value)} />
                  )}
                  {mode === 'item' && selectedItems.length > 0 && (
                    <div style={{ background: '#FDF5EE', borderRadius: '12px', padding: '14px 16px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontFamily: 'DM Sans, sans-serif', color: '#6B3A2A', fontSize: '14px' }}>Seçilen toplam</span>
                      <span style={{ fontFamily: 'Playfair Display, serif', color: '#3D2314', fontWeight: '700', fontSize: '20px' }}>₺{selectedTotal().toFixed(2)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="tv-btn-secondary" onClick={() => { setMode(null); setSelectedItems([]); setCustomAmount('') }}>
                      İptal
                    </button>
                    <button className="tv-btn-primary" onClick={handlePay} disabled={loading} style={{ flex: 1 }}>
                      {loading ? 'İşleniyor...' : '💳 Ödemeyi Tamamla'}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}