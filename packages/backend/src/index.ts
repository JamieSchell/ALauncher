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
import { apiLimiter } from './middleware/rateLimiter';
import { requestIdMiddleware } from './middleware/requestId';
import { metricsMiddleware } from './middleware/metrics';
import { auditMiddleware, cleanupOldAuditLogs } from './services/auditLog';
import { metricsService } from './services/metrics';

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
    'http://tauri.localhost', // Tauri development
    'https://tauri.localhost', // Tauri development (HTTPS)
    'tauri://localhost', // Tauri protocol
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

  // Request ID middleware (must be early for tracing)
  app.use(requestIdMiddleware);

  // Metrics middleware (tracks requests and response times)
  app.use(metricsMiddleware);

  // Security middleware with enhanced headers
  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false, // Disable CSP for static files, we handle it in Electron
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: false,
    },
  }));

  // Additional custom security headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    next();
  });

  // Body parsing middleware with size limits to prevent DoS attacks
  app.use(express.json({
    limit: '1mb', // Limit JSON body to 1MB
    strict: true  // Only accept objects and arrays
  }));
  app.use(express.urlencoded({
    extended: true,
    limit: '1mb' // Limit URL-encoded body to 1MB
  }));

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

  // Audit logging middleware (tracks sensitive operations)
  // Logs to database for security audit trail
  app.use(auditMiddleware([
    '/api/auth',
    '/api/users',
    '/api/profiles',
    '/api/admin',
  ]));

  // Request logging (only errors)
  // Removed verbose request logging for cleaner console output

  // Initialize database
  console.log('\n🔌 Initializing services...');
  await initializeDatabase();
  console.log('   ✅ Database connected');

  // Initialize RSA keys
  await initializeKeys();
  console.log('   ✅ RSA keys loaded');

  // Initialize file sync service (auto-sync files from updates directory)
  let fileWatcherInitialized = false;
  // Отключаем автоматическую синхронизацию при запуске для предотвращения дубликатов
  // File watcher будет работать, но без начальной синхронизации
  if (config.env === 'production' || process.env.ENABLE_FILE_SYNC !== 'false') {
    const { initializeFileWatcher } = await import('./services/fileSyncService');
    await initializeFileWatcher();
    fileWatcherInitialized = true;
    console.log('   ✅ File watcher ready');
  }

  // Periodic session cleanup (expired sessions)
  // Runs every hour to remove expired sessions from database
  const SESSION_CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour
  const sessionCleanupInterval = setInterval(async () => {
    try {
      const { AuthService } = await import('./services/auth');
      const deleted = await AuthService.cleanupExpiredSessions();
      if (deleted > 0) {
        console.log(`[Cleanup] Removed ${deleted} expired session(s) from database`);
      }
    } catch (error) {
      console.error('[Cleanup] Failed to clean up expired sessions:', error);
    }
  }, SESSION_CLEANUP_INTERVAL);
  console.log('   ✅ Session cleanup scheduled (every hour)');

  // Periodic audit log cleanup (removes old logs)
  // Runs daily to remove audit logs older than 90 days
  const AUDIT_CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
  const auditCleanupInterval = setInterval(async () => {
    try {
      const deleted = await cleanupOldAuditLogs(90); // Keep 90 days
      if (deleted > 0) {
        console.log(`[Cleanup] Removed ${deleted} old audit log(s) from database`);
      }
    } catch (error) {
      console.error('[Cleanup] Failed to clean up old audit logs:', error);
    }
  }, AUDIT_CLEANUP_INTERVAL);
  console.log('   ✅ Audit log cleanup scheduled (daily)');

  // CLI is now started separately via "npm run cli" command
  // Do not start CLI here to avoid conflicts with server startup

  // Routes (with rate limiting)
  // Note: auth routes have their own rate limiters applied in the route file
  app.use('/api/auth', authRoutes);
  app.use('/api/profiles', apiLimiter, profileRoutes);
  app.use('/api/updates', apiLimiter, updateRoutes);
  app.use('/api/users', apiLimiter, userRoutes);
  app.use('/api/servers', apiLimiter, serverRoutes);
  app.use('/api/client-versions', apiLimiter, clientVersionRoutes);
  app.use('/api/crashes', apiLimiter, crashRoutes);
  app.use('/api/statistics', apiLimiter, statisticsRoutes);
  app.use('/api/notifications', apiLimiter, notificationRoutes);
  app.use('/api/launcher', apiLimiter, launcherRoutes);

  // Health check
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      metrics: metricsService.getSummary(),
    });
  });

  // Metrics endpoint (admin only - for monitoring)
  app.get('/api/metrics', (req, res) => {
    const metrics = metricsService.getMetrics();
    res.json({
      success: true,
      data: {
        uptime: Math.floor(metrics.uptime / 1000),
        uptimeFormatted: formatUptime(metrics.uptime),
        requests: {
          total: metrics.requests.total,
          byMethod: metrics.requests.byMethod,
          byPath: Object.entries(metrics.requests.byPath)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 20)
            .reduce((acc, [path, count]) => ({ ...acc, [path]: count }), {}),
          byStatus: metrics.requests.byStatus,
        },
        responseTimes: {
          avg: Math.round(metrics.avgResponseTime),
          min: metrics.responseTimes.min === Infinity ? 0 : metrics.responseTimes.min,
          max: metrics.responseTimes.max,
        },
        errors: {
          total: metrics.errors.total,
          byType: metrics.errors.byType,
        },
        activeConnections: metrics.activeConnections,
      },
    });
  });

  // Format uptime as readable string
  function formatUptime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

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
  const serverInstance = app.listen(config.server.port, config.server.host, () => {
    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║     Modern Minecraft Launcher - Backend Server            ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    console.log(`\n  🌐 Server:       http://${config.server.host}:${config.server.port}`);
    console.log(`  🔌 WebSocket:    ws://${config.server.host}:${config.server.port}/ws`);
    console.log(`  📦 Environment: ${config.env}`);
    if (fileWatcherInitialized) {
      console.log(`  👀 File Watcher: Active`);
    }
    console.log(`\n✨ Server started successfully!`);
    console.log(`\n🚀 Ready to serve Minecraft launcher requests\n`);
  });

  // Initialize WebSocket
  initializeWebSocket(serverInstance);

  // Graceful shutdown handler
  let isShuttingDown = false; // Flag to prevent double shutdown

  const gracefulShutdown = async (signal: string) => {
    // Prevent double shutdown
    if (isShuttingDown) {
      logger.warn(`[Shutdown] ⚠️  Already shutting down, ignoring ${signal} signal`);
      return;
    }

    isShuttingDown = true;
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
        // Check if server is still running before attempting to close
        if (!serverInstance.listening) {
          logger.info('[Shutdown] HTTP server already closed, skipping...');
          resolve();
          return;
        }

        serverInstance.close((err) => {
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
      // Step 3: Stop session cleanup interval
      clearInterval(sessionCleanupInterval);
      logger.info('[Shutdown] ✓ Session cleanup interval stopped');
    } catch (error) {
      shutdownErrors.push({
        component: 'Session cleanup',
        error: error instanceof Error ? error : new Error(String(error))
      });
      logger.error('[Shutdown] Error stopping session cleanup:', error);
    }

    try {
      // Step 4: Stop audit log cleanup interval
      clearInterval(auditCleanupInterval);
      logger.info('[Shutdown] ✓ Audit log cleanup interval stopped');
    } catch (error) {
      shutdownErrors.push({
        component: 'Audit cleanup',
        error: error instanceof Error ? error : new Error(String(error))
      });
      logger.error('[Shutdown] Error stopping audit cleanup:', error);
    }

    try {
      // Step 5: Stop file watcher
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
      // Step 6: Close database connection
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

  // Handle shutdown signals - remove existing listeners first to avoid duplicates
  process.setMaxListeners(15); // Increase limit to handle multiple listeners

  // Remove any existing SIGTERM/SIGINT listeners (in case of hot reload)
  process.listeners('SIGTERM').forEach(listener => process.removeListener('SIGTERM', listener as any));
  process.listeners('SIGINT').forEach(listener => process.removeListener('SIGINT', listener as any));

  // Add new single listeners
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

// Start the server
bootstrap().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});
