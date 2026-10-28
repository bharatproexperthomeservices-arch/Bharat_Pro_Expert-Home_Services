// server/routes/auditRoutes.js
import express from 'express';
import { getAuditLogs } from '../logic/auditLogger.js';

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const { actor, action, targetType, targetId, startDate, endDate } = req.query;
    const logs = getAuditLogs({ actor, action, targetType, targetId, startDate, endDate });
    res.json({ success: true, count: logs.length, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
