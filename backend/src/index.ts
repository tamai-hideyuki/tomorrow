import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import memosRoutes from './routes/memos.js';

const app = new Hono();

// ミドルウェア
app.use('*', logger());
app.use(
  '*',
  cors({
    origin: 'http://localhost:3000',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowHeaders: ['Content-Type'],
  })
);

// ルート
app.route('/api/memos', memosRoutes);

// ヘルスチェック
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const port = 8080;
console.log(`Backend server running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});
