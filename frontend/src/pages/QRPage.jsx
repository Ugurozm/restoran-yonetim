import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import axios from 'axios'

import { API } from '../config'

export default function QRPage() {
  const [tables, setTables] = useState([])
  const [qrMap, setQrMap] = useState({})
  const [loading, setLoading] = useState(true)
  const location = useLocation()

  useEffect(() => {
    setLoading(true)
    setQrMap({})
    async function fetchAll() {
      const tablesRes = await axios.get(`${API}/tables`)
      setTables(tablesRes.data)
      const map = {}
      for (const table of tablesRes.data) {
        const res = await axios.get(`${API}/qr/${table.table_number}`)
        map[table.table_number] = res.data.qr
      }
      setQrMap(map)
      setLoading(false)
    }
    fetchAll()
  }, [location.key])

  if (loading) return (
    <div style={{ padding: '40px', textAlign: 'center', color: '#9B7B6A', fontFamily: 'DM Sans, sans-serif' }}>
      QR kodlar üretiliyor...
    </div>
  )

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '28px', fontWeight: '700', color: '#2C1A0E', marginBottom: '4px' }}>
          QR Kodlar
        </h1>
        <p style={{ color: '#9B7B6A', fontSize: '14px' }}>
          Her masaya yazdırılacak QR kodlar. Müşteri okutunca direkt hesabı görür.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
        {tables.map(table => (
          <div key={table.table_number} style={{
            background: '#fff', borderRadius: '20px', padding: '24px',
            boxShadow: '0 2px 12px rgba(44,26,14,0.08)', textAlign: 'center'
          }}>
            {qrMap[table.table_number] ? (
              <img
                src={qrMap[table.table_number]}
                alt={`Masa ${table.table_number} QR`}
                style={{ width: '100%', maxWidth: '160px', borderRadius: '12px', border: '4px solid #FAF7F2' }}
              />
            ) : (
              <div style={{ height: '160px', background: '#FAF7F2', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9B7B6A', fontSize: '13px' }}>
                Yükleniyor...
              </div>
            )}
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '18px', fontWeight: '600', marginTop: '14px', color: '#2C1A0E' }}>
              Masa {table.table_number}
            </div>
            <div style={{ fontSize: '11px', color: '#9B7B6A', marginTop: '4px' }}>
              /masa/{table.table_number}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}