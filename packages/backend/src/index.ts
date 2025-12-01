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
  // In production мы игнорируем wildcard '*', чтобы не было глобального CORS без явного контроля
  const allowAllOrigins = config.env !== 'production' && uniqueOrigins.includes('*');

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
  
  // Serve uploaded files (skins/cloaks) with explicit security headers
  app.use('/uploads', (req, res, next) => {
    const origin = req.headers.origin as string | undefined;

    // CORS for uploads:
    // - In development: allow all origins for easier debugging
    // - In production: only allow explicitly configured origins (same policy as main CORS)
    if (config.env !== 'production') {
      res.setHeader('Access-Control-Allow-Origin', '*');
    } else if (origin && uniqueOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    // Allow Electron/other renderers to load textures cross-origin, но запрещаем им читать тело ответа
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
  let fileWatcherInitialized = false;
  if (config.env === 'production' || process.env.ENABLE_FILE_SYNC !== 'false') {
    const { initializeFileWatcher } = await import('./services/fileSyncService');
    await initializeFileWatcher();
    fileWatcherInitialized = true;
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
    logger.info(`\n⚠️  ${signal} received, shutting down gracefully...`);
    
    // Set timeout for forced shutdown (15 seconds)
    const forceShutdown = setTimeout(() => {
      logger.error('⚠️  Forced shutdown after timeout - some resources may not have closed cleanly');
      process.exit(1);
    }, 15000);

    const shutdownErrors: Array<{ component: string; error: Error }> = [];

    try {
      // Step 1: Stop accepting new connections
      logger.info('[Shutdown] Stopping HTTP server...');
      await new Promise<void>((resolve, reject) => {
        server.close((err) => {
          if (err) {
            shutdownErrors.push({ component: 'HTTP server', error: err });
            logger.error('[Shutdown] Error closing HTTP server:', err);
            reject(err);
          } else {
            logger.info('[Shutdown] ✓ HTTP server closed');
            resolve();
          }
        });
      });
    } catch (error) {
      shutdownErrors.push({ 
        component: 'HTTP server', 
        error: error instanceof Error ? error : new Error(String(error))
      });
      logger.error('[Shutdown] Error during HTTP server shutdown:', error);
    }

    try {
      // Step 2: Close WebSocket server and all connections
      logger.info('[Shutdown] Closing WebSocket server...');
      await closeWebSocketServer();
      logger.info('[Shutdown] ✓ WebSocket server closed');
    } catch (error) {
      shutdownErrors.push({ 
        component: 'WebSocket server', 
        error: error instanceof Error ? error : new Error(String(error))
      });
      logger.error('[Shutdown] Error closing WebSocket server:', error);
    }

    try {
      // Step 3: Stop file watcher
      if (fileWatcherInitialized) {
        logger.info('[Shutdown] Stopping file watcher...');
        const { stopFileWatcher } = await import('./services/fileSyncService');
        await stopFileWatcher();
        logger.info('[Shutdown] ✓ File watcher stopped');
      }
    } catch (error) {
      shutdownErrors.push({ 
        component: 'File watcher', 
        error: error instanceof Error ? error : new Error(String(error))
      });
      logger.error('[Shutdown] Error stopping file watcher:', error);
    }

    try {
      // Step 4: Close database connection
      logger.info('[Shutdown] Closing database connection...');
      await disconnectDatabase();
      logger.info('[Shutdown] ✓ Database connection closed');
    } catch (error) {
      shutdownErrors.push({ 
        component: 'Database', 
        error: error instanceof Error ? error : new Error(String(error))
      });
      logger.error('[Shutdown] Error closing database connection:', error);
    }

    // Clear timeout
    clearTimeout(forceShutdown);
    
    // Log summary
    if (shutdownErrors.length > 0) {
      logger.warn(`[Shutdown] Completed with ${shutdownErrors.length} error(s):`);
      shutdownErrors.forEach(({ component, error }) => {
        logger.warn(`[Shutdown]   - ${component}: ${error.message}`);
      });
      logger.info('[Shutdown] ⚠️  Shutdown completed with errors');
      process.exit(1);
    } else {
      logger.info('[Shutdown] ✓ Shutdown complete - all resources closed successfully');
      process.exit(0);
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
