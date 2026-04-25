import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import TableView from './pages/TableView'
import WaiterDashboard from './pages/WaiterDashboard'
import QRPage from './pages/QRPage'
import AdminDashboard from './pages/AdminDashboard'
import MenuManager from './pages/MenuManager'
import Reports from './pages/Reports'
import TableManager from './pages/TableManager'
import Login from './pages/Login'

const NAV_ITEMS = {
  patron: [
    { path: '/garson',   label: 'Garson Paneli', icon: '👨‍🍳', match: '/garson' },
    { path: '/yonetim',  label: 'Yönetim',       icon: '📊', match: '/yonetim' },
    { path: '/raporlar', label: 'Raporlar',       icon: '📈', match: '/raporlar' },
    { path: '/menu',     label: 'Menü',           icon: '📋', match: '/menu' },
    { path: '/masalar',  label: 'Masalar',        icon: '🪑', match: '/masalar' },
    { path: '/qr',       label: 'QR Kodlar',      icon: '📱', match: '/qr' },
  ],
  garson: [
    { path: '/garson', label: 'Garson Paneli', icon: '👨‍🍳', match: '/garson' },
  ]
}

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/garson" replace />
  }
  return children
}

function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const navItems = NAV_ITEMS[user?.role] || []

  return (
    <aside style={{
      width: '220px', background: 'linear-gradient(180deg, #2C1A0E 0%, #3D2314 100%)',
      display: 'flex', flexDirection: 'column', flexShrink: 0,
      position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 100,
      boxShadow: '4px 0 24px rgba(44,26,14,0.15)'
    }}>
      <div style={{ padding: '28px 24px 20px' }}>
        <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '22px', color: '#FAF7F2', fontWeight: '700' }}>
          Restoran
        </div>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginTop: '2px', letterSpacing: '1px', textTransform: 'uppercase' }}>
          {user?.role === 'patron' ? 'Patron' : 'Garson'}
        </div>
      </div>

      <div style={{ padding: '0 12px 8px' }}>
        <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '10px', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px' }}>{user?.role === 'patron' ? '👑' : '👨‍🍳'}</span>
          <span style={{ color: '#FAF7F2', fontSize: '13px', fontWeight: '500' }}>{user?.name}</span>
        </div>
      </div>

      <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '8px 0' }} />

      <nav style={{ flex: 1, padding: '8px 12px' }}>
        {navItems.map(item => {
          const isActive = location.pathname.startsWith(item.match)
          return (
            <button key={item.path} onClick={() => navigate(item.path)} style={{
              width: '100%', textAlign: 'left', padding: '11px 14px', borderRadius: '12px',
              marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '10px',
              background: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
              color: isActive ? '#FAF7F2' : 'rgba(255,255,255,0.45)',
              fontSize: '14px', fontWeight: isActive ? '600' : '400',
              borderLeft: isActive ? '3px solid #C4855A' : '3px solid transparent',
            }}>
              <span style={{ fontSize: '16px' }}>{item.icon}</span>
              {item.label}
            </button>
          )
        })}
      </nav>

      <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <button onClick={logout} style={{
          width: '100%', padding: '10px', borderRadius: '10px',
          background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)',
          fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          <span>🚪</span> Çıkış Yap
        </button>
      </div>
    </aside>
  )
}

function AppContent() {
  const location = useLocation()
  const { user, loading } = useAuth()

  if (loading) return null

  const isMusteriPage = location.pathname.startsWith('/masa/')
  const isLoginPage = location.pathname === '/login'
  const showSidebar = !isMusteriPage && !isLoginPage && user

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {showSidebar && <Sidebar />}
      <main style={{ marginLeft: showSidebar ? '220px' : '0', flex: 1, minHeight: '100vh', background: isLoginPage ? 'transparent' : '#FAF7F2' }}>
        <Routes>
          <Route path="/login" element={
            user ? <Navigate to={user.role === 'patron' ? '/yonetim' : '/garson'} replace /> : <Login />
          } />

          <Route path="/masa/:tableNumber" element={<TableView />} />

          <Route path="/garson" element={
            <ProtectedRoute allowedRoles={['patron', 'garson']}>
              <WaiterDashboard />
            </ProtectedRoute>
          } />
          <Route path="/yonetim" element={
            <ProtectedRoute allowedRoles={['patron']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/raporlar" element={
            <ProtectedRoute allowedRoles={['patron']}>
              <Reports />
            </ProtectedRoute>
          } />
          <Route path="/menu" element={
            <ProtectedRoute allowedRoles={['patron']}>
              <MenuManager />
            </ProtectedRoute>
          } />
          <Route path="/masalar" element={
            <ProtectedRoute allowedRoles={['patron']}>
              <TableManager />
            </ProtectedRoute>
          } />
          <Route path="/qr" element={
            <ProtectedRoute allowedRoles={['patron']}>
              <QRPage />
            </ProtectedRoute>
          } />

          <Route path="/" element={
            <Navigate to={user ? (user.role === 'patron' ? '/yonetim' : '/garson') : '/login'} replace />
          } />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return <AppContent />
}