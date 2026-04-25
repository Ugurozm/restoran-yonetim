require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { startDailyReset } = require('./jobs/dailyReset');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: 'http://localhost:5173' }
});

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

io.on('connection', (socket) => {
  console.log('Baglanti:', socket.id);
  socket.on('disconnect', () => console.log('Koptu:', socket.id));
});

app.set('io', io);

app.use('/api/auth',      require('./routes/auth'));
app.use('/api/tables',    require('./routes/tables'));
app.use('/api/menu',      require('./routes/menu'));
app.use('/api/orders',    require('./routes/orders'));
app.use('/api/pay',       require('./routes/payments'));
app.use('/api/qr',        require('./routes/qr'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/reports',   require('./routes/reports'));

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log('Sunucu calisiyor: http://localhost:' + PORT);
  startDailyReset(io);
}); 