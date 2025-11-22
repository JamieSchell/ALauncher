/**
 * Server status routes
 */

import { Router } from 'express';
import { prisma } from '../services/database';
import { pingServer } from '../services/serverPing';
import { saveServerStatistics, getServerStatistics24h } from '../services/serverStatistics';

const router = Router();

/**
 * GET /api/servers/:address/status
 * Get server status
 */
router.get('/:address/status', async (req, res, next) => {
  try {
    const { address } = req.params;
    const port = parseInt(req.query.port as string) || 25565;

    // Check cache first
    const cached = await prisma.serverStatus.findUnique({
      where: { serverAddress: `${address}:${port}` },
    });

    // If cached and recent (< 10 seconds), return it
    // Reduced cache time to ensure fresh data
    const cacheAge = cached ? Date.now() - cached.lastChecked.getTime() : Infinity;
    if (cached && cacheAge < 10000) {
      console.log(`[Server Status] Returning cached status for ${address}:${port} (age: ${Math.round(cacheAge / 1000)}s)`);
      return res.json({
        success: true,
        data: {
          online: cached.online,
          players: {
            online: cached.players || 0,
            max: cached.maxPlayers || 0,
          },
          version: cached.version || '',
          motd: cached.motd || '',
          ping: cached.ping || 0,
        },
      });
    }
    
    // If cache is stale (offline status), force refresh
    if (cached && !cached.online && cacheAge < 60000) {
      console.log(`[Server Status] Cached offline status for ${address}:${port} is ${Math.round(cacheAge / 1000)}s old, but forcing refresh`);
    }

    // Ping server
    const status = await pingServer(address, port);
    
    console.log(`[Server Status] ${address}:${port} - Online: ${status.online}, Players: ${status.players?.online}/${status.players?.max}`);

    const serverAddress = `${address}:${port}`;

    // Update cache
    await prisma.serverStatus.upsert({
      where: { serverAddress },
      create: {
        serverAddress,
        online: status.online,
        players: status.players?.online || 0,
        maxPlayers: status.players?.max || 0,
        version: status.version || null,
        motd: status.motd || null,
        ping: status.ping || null,
      },
      update: {
        online: status.online,
        players: status.players?.online || 0,
        maxPlayers: status.players?.max || 0,
        version: status.version || null,
        motd: status.motd || null,
        ping: status.ping || null,
        lastChecked: new Date(),
      },
    });

    // Сохранить статистику (даже если сервер офлайн, чтобы видеть историю)
    const onlineCount = status.online && status.players?.online !== undefined ? status.players.online : 0;
    await saveServerStatistics(serverAddress, onlineCount);

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/servers/:address/statistics
 * Get server statistics for last 24 hours
 */
router.get('/:address/statistics', async (req, res, next) => {
  try {
    const { address } = req.params;
    const port = parseInt(req.query.port as string) || 25565;
    const serverAddress = `${address}:${port}`;

    const statistics = await getServerStatistics24h(serverAddress);

    res.json({
      success: true,
      data: statistics,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
