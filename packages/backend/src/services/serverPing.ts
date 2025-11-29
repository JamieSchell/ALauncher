/**
 * Minecraft server ping service
 * Uses minecraft-server-util library for reliable server pinging
 */

import { status } from 'minecraft-server-util';
import axios from 'axios';
import { ServerStatus } from '@modern-launcher/shared';

/**
 * Fallback method: Use external API to check server status
 * This is useful when direct connection is blocked by firewall
 */
async function pingServerViaAPI(address: string, port: number): Promise<ServerStatus> {
  try {
    // Use mcstatus.io API (free, no API key required)
    const response = await axios.get(`https://api.mcstatus.io/v2/status/java/${address}:${port}`, {
      timeout: 5000,
    });
    
    if (response.data && response.data.online) {
      return {
        online: true,
        players: {
          online: response.data.players?.online || 0,
          max: response.data.players?.max || 0,
        },
        version: response.data.version?.name || '',
        motd: response.data.motd?.clean || response.data.motd?.html || '',
        ping: response.data.round_trip_latency_ms || 0,
      };
    }
    
    return {
      online: false,
      players: { online: 0, max: 0 },
      version: '',
      motd: '',
      ping: 0,
    };
  } catch (error: any) {
    // If external API fails, throw error
    throw error;
  }
}

/**
 * Main function to ping a Minecraft server
 * Uses minecraft-server-util library first, then falls back to external API
 */
export async function pingServer(address: string, port: number = 25565): Promise<ServerStatus> {
  // Try using minecraft-server-util library first
  try {
    const result = await status(address, port, {
      timeout: 5000,
      enableSRV: true, // Enable SRV record lookup
    });
    
    // Convert to our ServerStatus format
    return {
      online: true,
      players: {
        online: result.players.online,
        max: result.players.max,
      },
      version: result.version.name,
      motd: result.motd.clean || result.motd.html || '',
      ping: result.roundTripLatency || 0,
    };
  } catch (error: any) {
    // Fallback to external API if library fails (silent)
  }
  
  // Fallback to external API if library fails
  try {
    const externalStatus = await pingServerViaAPI(address, port);
    if (externalStatus.online) {
      return externalStatus;
    }
  } catch (error: any) {
    // External API fallback failed (silent)
  }
  
  // If all methods failed, return offline status
  return {
    online: false,
    players: { online: 0, max: 0 },
    version: '',
    motd: '',
    ping: 0,
  };
}
