/**
 * WebSocket server for real-time updates
 */

import { Server as HTTPServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { logger } from '../utils/logger';
import { AuthService } from '../services/auth';
import { WSEvent, UpdateProgress, LaunchStatus } from '@modern-launcher/shared';

interface Client {
  ws: WebSocket;
  userId?: string;
  username?: string;
  isAlive: boolean;
}

const clients = new Map<string, Client>();
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
    const client: Client = { ws, isAlive: true };
    clients.set(clientId, client);

    ws.on('message', async (message: Buffer) => {
      try {
        const data = JSON.parse(message.toString());
        
        switch (data.event) {
          case WSEvent.AUTH:
            await handleAuth(clientId, data.token);
            break;
          default:
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
      clients.delete(clientId);
    });

    ws.on('error', (error) => {
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
      resolve();
      return;
    }

    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      heartbeatInterval = null;
    }

    // Close all client connections
    clients.forEach((client) => {
      try {
        client.ws.close();
      } catch (error) {
        // Ignore errors when closing
      }
    });
    clients.clear();

    // Close WebSocket server
    wss.close(() => {
      wss = null;
      logger.info('WebSocket server closed');
      resolve();
    });
  });
}



async function handleAuth(clientId: string, token: string) {
  const client = clients.get(clientId);
  if (!client) return;

  const payload = await AuthService.validateSession(token);
  
  if (payload) {
    client.userId = payload.userId;
    client.username = payload.username;
    
    sendToClient(clientId, {
      event: WSEvent.AUTH,
      data: { success: true, username: payload.username },
    });
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
