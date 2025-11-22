/**
 * Server status routes
 */

import { Router } from 'express';
import { prisma } from '../services/database';
import { pingServer } from '../services/serverPing';

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

    // If cached and recent (< 1 minute), return it
    if (cached && Date.now() - cached.lastChecked.getTime() < 60000) {
      return res.json({
        success: true,
        data: {
          online: cached.online,
          players: cached.players,
          maxPlayers: cached.maxPlayers,
          version: cached.version,
          motd: cached.motd,
          ping: cached.ping,
        },
      });
    }

    // Ping server
    const status = await pingServer(address, port);

    // Update cache
    await prisma.serverStatus.upsert({
      where: { serverAddress: `${address}:${port}` },
      create: {
        serverAddress: `${address}:${port}`,
        online: status.online,
        players: status.players?.online,
        maxPlayers: status.players?.max,
        version: status.version,
        motd: status.motd,
        ping: status.ping,
      },
      update: {
        online: status.online,
        players: status.players?.online,
        maxPlayers: status.players?.max,
        version: status.version,
        motd: status.motd,
        ping: status.ping,
        lastChecked: new Date(),
      },
    });

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
