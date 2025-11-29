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
import { initializeWebSocket, closeWebSocketServer } from './websocket';
import { initializeDatabase, disconnectDatabase } from './services/database';
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
  // Support multiple origins (comma-separated) or single origin
  // Localhost origins are always allowed (safe for local development/preview, even in production)
  const defaultOrigins = [
    'http://localhost:5173',  // Vite dev server
    'http://127.0.0.1:5173',  // Vite dev server (alternative)
    'http://localhost:4173',  // Vite preview server
    'http://127.0.0.1:4173',  // Vite preview server (alternative)
  ];
  
  // Merge with configured origins
  const configuredOrigins = config.server.corsOrigin
    ? config.server.corsOrigin.split(',').map(origin => origin.trim()).filter(Boolean)
    : [];
  
  const mergedOrigins = [...defaultOrigins, ...configuredOrigins];
  
  if (mergedOrigins.length === 0 && config.env === 'production') {
    logger.warn('⚠️  No CORS origins configured! Set CORS_ORIGIN in .env file for production.');
  }
  const uniqueOrigins = Array.from(new Set(mergedOrigins));
  const allowAllOrigins = uniqueOrigins.includes('*');

  // CORS middleware with support for Electron file:// protocol
  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like Electron file:// or mobile apps)
      // Electron sends null or undefined origin for file:// protocol
      if (!origin || origin === 'null' || origin === 'undefined' || origin.startsWith('file://')) {
        // Return true to allow, cors will set Access-Control-Allow-Origin: null
        // Electron accepts this
        return callback(null, true);
      }
      
      if (allowAllOrigins) {
        return callback(null, true);
      }
      
      if (uniqueOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      // Log blocked origin for debugging
      logger.warn(`CORS: Origin blocked: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    optionsSuccessStatus: 204,
    exposedHeaders: ['Content-Type', 'Authorization'],
    // For null origin, set to * (Electron will accept this)
    preflightContinue: false,
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

  // Request logging (only errors)
  // Removed verbose request logging for cleaner console output

  // Initialize database
  await initializeDatabase();

  // Initialize RSA keys
  await initializeKeys();

  // Initialize file sync service (auto-sync files from updates directory)
  if (config.env === 'production' || process.env.ENABLE_FILE_SYNC !== 'false') {
    const { initializeFileWatcher } = await import('./services/fileSyncService');
    await initializeFileWatcher();
  }

  // CLI is now started separately via "npm run cli" command
  // Do not start CLI here to avoid conflicts with server startup

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
    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║     Modern Minecraft Launcher - Backend Server            ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    console.log(`\n  ✓ Database      Connected`);
    console.log(`  ✓ RSA Keys       Loaded`);
    console.log(`  ✓ File Sync      Active`);
    console.log(`  ✓ WebSocket      Ready`);
    console.log(`\n  🌐 Server:       http://${config.server.host}:${config.server.port}`);
    console.log(`  🔌 WebSocket:    ws://${config.server.host}:${config.server.port}/ws`);
    console.log(`  📦 Environment: ${config.env}`);
    console.log(`\n╚═══════════════════════════════════════════════════════════╝\n`);
  });

  // Initialize WebSocket
  initializeWebSocket(server);

  // Graceful shutdown handler
  const gracefulShutdown = async (signal: string) => {
    console.log(`\n⚠️  ${signal} received, shutting down gracefully...`);
    
    // Set timeout for forced shutdown (10 seconds)
    const forceShutdown = setTimeout(() => {
      console.error('⚠️  Forced shutdown after timeout');
      process.exit(1);
    }, 10000);

    try {
      // Close WebSocket server
      await closeWebSocketServer();
      
      // Close HTTP server
      server.close(() => {
        console.log('✓ HTTP server closed');
      });

      // Close database connection
      await disconnectDatabase();
      
      // Clear timeout
      clearTimeout(forceShutdown);
      
      console.log('✓ Shutdown complete');
      process.exit(0);
    } catch (error) {
      console.error('Error during shutdown:', error);
      clearTimeout(forceShutdown);
      process.exit(1);
    }
  };

  // Handle shutdown signals
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

// Start the server
bootstrap().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});
