/**
 * Modern Minecraft Launcher - Backend Server
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import multer from 'multer';
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
import crashRoutes from './routes/crashes';
import statisticsRoutes from './routes/statistics';
import notificationRoutes from './routes/notifications';
import launcherRoutes from './routes/launcher';

async function bootstrap() {
  const app = express();

  // CORS middleware (must be before helmet for static files)
  app.use(cors({
    origin: config.server.corsOrigin || '*',
    credentials: true,
  }));

  // Security middleware
  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false, // Disable CSP for static files, we handle it in Electron
  }));

  // Body parsing middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // Serve uploaded files with explicit CORS headers
  app.use('/uploads', (req, res, next) => {
    // Set CORS headers explicitly
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  }, express.static(path.join(process.cwd(), 'uploads'), {
    setHeaders: (res, filePath) => {
      // Set content type for images
      if (filePath.endsWith('.png')) {
        res.setHeader('Content-Type', 'image/png');
      } else if (filePath.endsWith('.gif')) {
        res.setHeader('Content-Type', 'image/gif');
      }
    },
  }));

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
  app.use('/api/crashes', crashRoutes);
  app.use('/api/statistics', statisticsRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/launcher', launcherRoutes);

  // Health check
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    });
  });

  // Multer error handling middleware (must be before general error handler)
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    // Log error for debugging
    if (req.path.includes('cloak')) {
      console.log('[Cloak Upload Error]', {
        path: req.path,
        errorType: err.constructor?.name,
        errorMessage: err.message,
        errorCode: err.code,
      });
    }
    
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        const maxSize = req.path.includes('cloak') ? '5MB for cloaks' : '2MB for skins';
        return res.status(400).json({
          success: false,
          error: `File size exceeds the maximum allowed (${maxSize})`,
        });
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({
          success: false,
          error: 'Unexpected file field',
        });
      }
    }
    // Handle fileFilter errors (these are regular Error objects, not MulterError)
    if (err && err.message) {
      // Check if it's a cloak route FIRST
      if (req.path.includes('/cloak') || req.path.includes('cloak')) {
        console.log('[Error Handler] Cloak route detected, error:', err.message);
        // For cloak routes, always return the correct message
        if (err.message.includes('Only PNG') || err.message.includes('Only PNG or GIF')) {
          return res.status(400).json({
            success: false,
            error: 'Only PNG or GIF images are allowed for cloaks',
          });
        }
      }
      // For skin routes
      if (err.message.includes('Only PNG')) {
        return res.status(400).json({
          success: false,
          error: err.message,
        });
      }
    }
    next(err);
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
