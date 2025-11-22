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
}

const clients = new Map<string, Client>();

export function initializeWebSocket(server: HTTPServer) {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: WebSocket, req) => {
    const clientId = `${Date.now()}-${Math.random()}`;
    logger.info(`WebSocket client connected: ${clientId}`);

    clients.set(clientId, { ws });

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

    ws.on('close', () => {
      logger.info(`WebSocket client disconnected: ${clientId}`);
      clients.delete(clientId);
    });

    ws.on('error', (error) => {
      logger.error(`WebSocket error for ${clientId}:`, error);
      clients.delete(clientId);
    });

    // Send initial connection message
    sendToClient(clientId, {
      event: WSEvent.CONNECT,
      data: { clientId },
    });
  });

  logger.info('WebSocket server initialized');
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
    
    logger.info(`Client ${clientId} authenticated as ${payload.username}`);
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
