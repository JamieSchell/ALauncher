/**
 * WebSocket server for real-time updates
 */

import { Server as HTTPServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { URL } from 'url';
import { logger } from '../utils/logger';
import { AuthService } from '../services/auth';
import { WSEvent, UpdateProgress, LaunchStatus } from '@modern-launcher/shared';
import { prisma } from '../services/database';

interface Client {
  ws: WebSocket;
  userId?: string;
  username?: string;
  role?: 'USER' | 'ADMIN';
  isAuthenticated: boolean;
  isAlive: boolean;
  authTimeout?: NodeJS.Timeout;
}

const clients = new Map<string, Client>();
const UNAUTHENTICATED_TIMEOUT = 30000; // 30 seconds to authenticate
let wss: WebSocketServer | null = null;
let heartbeatInterval: NodeJS.Timeout | null = null;

export function initializeWebSocket(server: HTTPServer) {
  wss = new WebSocketServer({ 
    server, 
    path: '/ws',
    // Allow connections from any origin (including null for Electron file://)
    verifyClient: () => {
      // Accept all connections, including null origin (Electron file://)
      return true;
    },
  });

  wss.on('connection', (ws: WebSocket, req) => {
    const clientId = `${Date.now()}-${Math.random()}`;
    const client: Client = { ws, isAlive: true, isAuthenticated: false };
    clients.set(clientId, client);

    // Extract token from query params if provided during connection
    const { searchParams } = new URL(req.url || '', `http://${req.headers.host}`);
    const initialToken = searchParams.get('token');

    // Set authentication timeout
    client.authTimeout = setTimeout(() => {
      if (!client.isAuthenticated) {
        logger.warn(`[WebSocket] Client ${clientId} did not authenticate in time, disconnecting`);
        ws.close(4001, 'Authentication timeout');
      }
    }, UNAUTHENTICATED_TIMEOUT);

    ws.on('message', async (message: Buffer) => {
      try {
        const data = JSON.parse(message.toString());

        switch (data.event) {
          case WSEvent.AUTH:
            await handleAuth(clientId, data.token);
            break;
          default:
            // Only allow messages after authentication
            if (!client.isAuthenticated) {
              ws.close(4003, 'Not authenticated');
              return;
            }
            logger.warn(`Unknown WS event: ${data.event}`);
        }
      } catch (error) {
        logger.error('WebSocket message error:', error);
      }
    });

    ws.on('pong', () => {
      const currentClient = clients.get(clientId);
      if (currentClient) {
        currentClient.isAlive = true;
      }
    });

    ws.on('close', () => {
      // Clear authentication timeout if exists
      if (client.authTimeout) {
        clearTimeout(client.authTimeout);
      }
      clients.delete(clientId);
    });

    ws.on('error', (error) => {
      // Clear authentication timeout if exists
      if (client.authTimeout) {
        clearTimeout(client.authTimeout);
      }
      logger.error(`WebSocket error for ${clientId}:`, {
        error: error.message,
        stack: error.stack,
        origin: req.headers.origin || 'null',
      });
      clients.delete(clientId);
    });

    // Send initial connection message
    sendToClient(clientId, {
      event: WSEvent.CONNECT,
      data: { clientId },
    });
  });

  // Heartbeat / ping-pong to detect dead connections
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
  }

  heartbeatInterval = setInterval(() => {
    for (const [clientId, client] of clients.entries()) {
      if (client.ws.readyState !== WebSocket.OPEN) {
        clients.delete(clientId);
        continue;
      }

      if (!client.isAlive) {
        logger.warn(`WebSocket heartbeat: terminating stale client ${clientId}`);
        client.ws.terminate();
        clients.delete(clientId);
        continue;
      }

      client.isAlive = false;
      try {
        client.ws.ping();
      } catch {
        // ignore ping errors; connection will be cleaned up on next tick
      }
    }
  }, 30000);
}

/**
 * Close all WebSocket connections gracefully
 */
export function closeWebSocketServer(): Promise<void> {
  return new Promise((resolve) => {
    if (!wss) {
      logger.info('WebSocket server not initialized, skipping close...');
      resolve();
      return;
    }

    // Check if server has clients
    const clientCount = wss.clients.size;
    if (clientCount === 0) {
      logger.info('WebSocket server has no clients, closing...');
    } else {
      logger.info(`WebSocket server has ${clientCount} client(s), closing...`);
    }

    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      heartbeatInterval = null;
    }

    // Close all client connections
    let closedClients = 0;
    clients.forEach((client) => {
      try {
        if (client.ws.readyState === WebSocket.OPEN || client.ws.readyState === WebSocket.CONNECTING) {
          client.ws.close();
          closedClients++;
        }
      } catch (error) {
        // Ignore errors when closing
      }
    });
    clients.clear();
    logger.info(`Closed ${closedClients} WebSocket clients`);

    // Close WebSocket server
    try {
      wss.close((err) => {
        if (err) {
          // Server may already be closing or closed
          logger.warn('WebSocket server close warning:', err.message);
        } else {
          logger.info('WebSocket server closed');
        }
        wss = null;
        resolve();
      });
    } catch (error) {
      logger.warn('WebSocket server close error:', (error as Error).message);
      wss = null;
      resolve();
    }
  });
}



async function handleAuth(clientId: string, token: string) {
  const client = clients.get(clientId);
  if (!client) return;

  if (!token) {
    sendToClient(clientId, {
      event: WSEvent.AUTH,
      data: { success: false, error: 'Token is required' },
    });
    return;
  }

  const payload = await AuthService.validateSession(token);

  if (payload) {
    // Check if user is banned
    try {
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { banned: true, username: true },
      });

      if (!user) {
        sendToClient(clientId, {
          event: WSEvent.AUTH,
          data: { success: false, error: 'User not found' },
        });
        return;
      }

      if (user.banned) {
        logger.warn(`[WebSocket] Banned user attempted to connect: ${user.username}`);
        sendToClient(clientId, {
          event: WSEvent.AUTH,
          data: { success: false, error: 'User is banned' },
        });
        client.ws.close(4003, 'User is banned');
        return;
      }

      // Authentication successful
      client.isAuthenticated = true;
      client.userId = payload.userId;
      client.username = user.username;
      client.role = payload.role;

      // Clear authentication timeout
      if (client.authTimeout) {
        clearTimeout(client.authTimeout);
        client.authTimeout = undefined;
      }

      sendToClient(clientId, {
        event: WSEvent.AUTH,
        data: { success: true, username: user.username, role: payload.role },
      });

      logger.info(`[WebSocket] Client authenticated: ${user.username} (${payload.role})`);
    } catch (error) {
      logger.error('[WebSocket] Error checking user ban status:', error);
      sendToClient(clientId, {
        event: WSEvent.AUTH,
        data: { success: false, error: 'Authentication error' },
      });
    }
  } else {
    sendToClient(clientId, {
      event: WSEvent.AUTH,
      data: { success: false, error: 'Invalid token' },
    });
  }
}

function sendToClient(clientId: string, data: any) {
  const client = clients.get(clientId);
  if (client && client.ws.readyState === WebSocket.OPEN) {
    client.ws.send(JSON.stringify(data));
  }
}

export function broadcastToUser(userId: string, data: any) {
  for (const [clientId, client] of clients.entries()) {
    if (client.userId === userId && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(data));
    }
  }
}

export function broadcastToAll(data: any) {
  for (const [clientId, client] of clients.entries()) {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(data));
    }
  }
}

export function sendUpdateProgress(userId: string, progress: UpdateProgress) {
  broadcastToUser(userId, {
    event: WSEvent.UPDATE_PROGRESS,
    data: progress,
  });
}

export function sendLaunchStatus(userId: string, status: LaunchStatus) {
  broadcastToUser(userId, {
    event: WSEvent.LAUNCH_STATUS,
    data: status,
  });
}
