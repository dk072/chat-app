import express from 'express';
import http from 'http';
import { createClient } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import compression from 'compression';

import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import messageRoutes from './routes/messageRoutes';
import adminRoutes from './routes/adminRoutes';
import advancedAdminRoutes from './routes/advancedAdminRoutes';
import callRoutes from './routes/callRoutes';
import { initializeSocket } from './services/socketService';
import { errorHandler, notFound } from './middlewares/errorMiddleware';
import { getPerformanceMetrics, recordApiLatency } from './services/performanceService';
import prisma from './config/db';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: [process.env.CLIENT_URL || 'http://localhost:5173', 'http://localhost:5174'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

// Expose Socket instance to Express controllers via req.app.get('io')
app.set('io', io);

// Redis Adapter Setup for Horizontal Scaling
if (process.env.REDIS_URL) {
  const pubClient = createClient({ url: process.env.REDIS_URL });
  const subClient = pubClient.duplicate();

  Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
    io.adapter(createAdapter(pubClient, subClient));
    console.log(`[Redis] Connected and Socket.io adapter attached.`);
  }).catch((err) => {
    console.error(`[Redis] Failed to connect:`, err);
  });
} else {
  console.log(`[Redis] REDIS_URL not set. Falling back to local memory adapter.`);
}

// Setup Socket lifecycle handlers
initializeSocket(io);

// Real-Time Telemetry Broadcast Loop for Admin Dashboard (every 3 seconds)
setInterval(async () => {
  try {
    const onlineUsersCount = await prisma.user.count({ where: { isOnline: true } });
    const metrics = await getPerformanceMetrics(0, onlineUsersCount);
    io.to('admin_metrics_room').emit('admin_metrics_update', metrics);
  } catch (err) {
    // Silent fail in telemetry ticker
  }
}, 3000);

// Core Middlewares
app.use(compression());
app.use(
  helmet({
    crossOriginResourcePolicy: false, // Ensures local uploads can be loaded cross-origin
  })
);

app.use(
  cors({
    origin: [process.env.CLIENT_URL || 'http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Latency recording middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    recordApiLatency(duration);
  });
  next();
});

// Resolve and create uploads fallback directories if they don't exist
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
// Host the uploads folder statically
app.use('/uploads', express.static(uploadsDir));

// Route definitions
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/advanced', advancedAdminRoutes);
app.use('/api/calls', callRoutes);


// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(Number(PORT), () => {
  console.log(`==================================================`);
  console.log(`  Server is actively listening on port ${PORT}`);
  console.log(`  Running in [${process.env.NODE_ENV || 'development'}] mode`);
  console.log(`  WebSocket Server is active and operational`);
  console.log(`==================================================`);
});
