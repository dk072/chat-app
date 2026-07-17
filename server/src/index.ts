import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import messageRoutes from './routes/messageRoutes';
import adminRoutes from './routes/adminRoutes';
import callRoutes from './routes/callRoutes';
import { initializeSocket } from './services/socketService';
import { errorHandler, notFound } from './middlewares/errorMiddleware';

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

// Setup Socket lifecycle handlers
initializeSocket(io);

// Core Middlewares
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
app.use('/api/calls', callRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`  Server is actively listening on port ${PORT}`);
  console.log(`  Running in [${process.env.NODE_ENV || 'development'}] mode`);
  console.log(`  WebSocket Server is active and operational`);
  console.log(`==================================================`);
});
