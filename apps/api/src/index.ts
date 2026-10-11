import 'dotenv/config';
import compression from 'compression';
import cors from 'cors';
import express, { type ErrorRequestHandler } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

const app = express();
const port = Number(process.env.API_PORT ?? 4000);
const businessName = process.env.BUSINESS_NAME ?? 'Bharat Pro Expert Home Services';
app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: (process.env.CORS_ORIGIN ?? 'http://localhost:3000').split(',').map((v) => v.trim()), credentials: true }));
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.get('/health', (_req, res) => res.status(200).json({ status: 'ok', service: 'bharat-pro-expert-api', businessName, timestamp: new Date().toISOString() }));
app.get('/api/v1', (_req, res) => res.status(200).json({ name: businessName, version: '1.0.0', status: 'operational', endpoints: { health: '/health' } }));
app.use((_req, res) => res.status(404).json({ error: 'NOT_FOUND', message: 'The requested API route does not exist.' }));
const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  const status = typeof error?.status === 'number' ? error.status : 500;
  if (status >= 500) console.error('Unhandled API error:', error);
  res.status(status).json({ error: status >= 500 ? 'INTERNAL_SERVER_ERROR' : 'REQUEST_ERROR', message: status >= 500 ? 'An unexpected server error occurred.' : String(error.message ?? 'Request failed') });
};
app.use(errorHandler);
const server = app.listen(port, '0.0.0.0', () => console.log(`Bharat Pro Expert API listening on port ${port}`));
const shutdown = (signal: string) => { console.log(`${signal} received; shutting down API`); server.close((error) => { if (error) { console.error(error); process.exitCode = 1; } }); };
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
