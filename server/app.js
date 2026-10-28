// server/app.js
import express from 'express';
import cors from 'cors';

import partnerRoutes from './routes/partnerRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import financeRoutes from './routes/financeRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';

const app = express();

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/partners', partnerRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/analytics', analyticsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'UP', message: 'Bharat Pro Admin Panel API Operational' });
});

export default app;
