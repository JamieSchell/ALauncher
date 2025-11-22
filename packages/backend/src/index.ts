/**
 * Modern Minecraft Launcher - Backend Server
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { initializeWebSocket } from './websocket';
import { initializeDatabase } from './services/database';
import { initializeKeys } from './services/crypto';

// Import routes
import authRoutes from './routes/auth';
import profileRoutes from './routes/profiles';
import updateRoutes from './routes/updates';
import userRoutes from './routes/users';
import serverRoutes from './routes/servers';
import clientVersionRoutes from './routes/clientVersions';

async function bootstrap() {
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(cors({
    origin: config.server.corsOrigin || '*',
    credentials: true,
  }));

  // Body parsing middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Request logging
  app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`, {
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
    next();
  });

  // Initialize database
  await initializeDatabase();

  // Initialize RSA keys
  await initializeKeys();

  // Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/profiles', profileRoutes);
  app.use('/api/updates', updateRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/servers', serverRoutes);
  app.use('/api/client-versions', clientVersionRoutes);

  // Health check
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    });
  });

  // Error handling
  app.use(errorHandler);

  // Start HTTP server
  const server = app.listen(config.server.port, config.server.host, () => {
    logger.info(`Server started on ${config.server.host}:${config.server.port}`);
    logger.info(`Environment: ${config.env}`);
  });

  // Initialize WebSocket
  initializeWebSocket(server);

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully...');
    server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully...');
    server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
  });
}

// Start the server
bootstrap().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});
