import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import authRouter from './routes/auth';
import conversationRouter from './routes/conversations';
import userRoutes from './routes/user';
import messageRoutes from './routes/message';
import { initializeSocket } from './socket';

dotenv.config();

const app = express();
const httpServer = createServer(app);

initializeSocket(httpServer);

const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000,http://localhost:3001')
  .split(',')
  .map(origin => origin.trim());

app.set('trust proxy', 1);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json());
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRouter);
app.use('/api/conversations', conversationRouter);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((
  err: any,
  _req: express.Request,
  res: express.Response,
  _next: express.NextFunction,
) => {
  if (err?.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'Origin not allowed' });
  }

  console.error('Unhandled error:', err);

  const isProd = process.env.NODE_ENV === 'production';
  res.status(err?.status || 500).json({
    error: isProd ? 'Internal server error' : (err?.message ?? 'Internal server error'),
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
