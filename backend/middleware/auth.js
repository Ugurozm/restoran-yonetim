const jwt = require('jsonwebtoken')
const SECRET = process.env.JWT_SECRET || 'restoran_secret_key'

function authMiddleware(...allowedRoles) {
  return (req, res, next) => {
    const auth = req.headers.authorization
    if (!auth) return res.status(401).json({ error: 'Giriş yapmanız gerekiyor' })
    try {
      const token = auth.split(' ')[1]
      const user = jwt.verify(token, SECRET)
      if (allowedRoles.length && !allowedRoles.includes(user.role)) {
        return res.status(403).json({ error: 'Bu işlem için yetkiniz yok' })
      }
      req.user = user
      next()
    } catch {
      res.status(401).json({ error: 'Geçersiz veya süresi dolmuş oturum' })
    }
  }
}

module.exports = authMiddleware