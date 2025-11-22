/**
 * Minecraft server ping service
 */

import net from 'net';
import { ServerStatus } from '@modern-launcher/shared';

export async function pingServer(address: string, port: number = 25565): Promise<ServerStatus> {
  return new Promise((resolve) => {
    const start = Date.now();
    const socket = new net.Socket();
    
    const timeout = setTimeout(() => {
      socket.destroy();
      resolve({
        online: false,
        players: { online: 0, max: 0 },
        version: '',
        motd: '',
        ping: 0,
      });
    }, 5000);

    socket.connect(port, address, () => {
      // Create handshake packet
      const handshake = Buffer.concat([
        Buffer.from([0x00]), // Packet ID
        writeVarInt(47), // Protocol version (1.8.x)
        writeString(address),
        Buffer.from([port >> 8, port & 0xFF]),
        writeVarInt(1), // Next state (status)
      ]);

      // Send handshake
      socket.write(createPacket(handshake));

      // Send status request
      socket.write(createPacket(Buffer.from([0x00])));
    });

    let buffer = Buffer.alloc(0);
    socket.on('data', (data) => {
      buffer = Buffer.concat([buffer, data]);

      try {
        // Parse packet
        const length = readVarInt(buffer);
        if (buffer.length < length.value + length.size) {
          return; // Wait for more data
        }

        const packetData = buffer.slice(length.size, length.size + length.value);
        const response = JSON.parse(packetData.slice(1).toString('utf8'));

        const ping = Date.now() - start;

        clearTimeout(timeout);
        socket.destroy();

        resolve({
          online: true,
          players: {
            online: response.players?.online || 0,
            max: response.players?.max || 0,
          },
          version: response.version?.name || '',
          motd: response.description?.text || response.description || '',
          ping,
        });
      } catch (error) {
        clearTimeout(timeout);
        socket.destroy();
        resolve({
          online: false,
          players: { online: 0, max: 0 },
          version: '',
          motd: '',
          ping: 0,
        });
      }
    });

    socket.on('error', () => {
      clearTimeout(timeout);
      socket.destroy();
      resolve({
        online: false,
        players: { online: 0, max: 0 },
        version: '',
        motd: '',
        ping: 0,
      });
    });
  });
}

function createPacket(data: Buffer): Buffer {
  const length = writeVarInt(data.length);
  return Buffer.concat([length, data]);
}

function writeVarInt(value: number): Buffer {
  const bytes: number[] = [];
  do {
    let temp = value & 0x7F;
    value >>>= 7;
    if (value !== 0) {
      temp |= 0x80;
    }
    bytes.push(temp);
  } while (value !== 0);
  return Buffer.from(bytes);
}

function writeString(str: string): Buffer {
  const strBuf = Buffer.from(str, 'utf8');
  return Buffer.concat([writeVarInt(strBuf.length), strBuf]);
}

function readVarInt(buffer: Buffer): { value: number; size: number } {
  let numRead = 0;
  let result = 0;
  let read: number;

  do {
    if (numRead >= buffer.length) {
      throw new Error('VarInt is too big');
    }
    read = buffer[numRead];
    const value = read & 0x7F;
    result |= value << (7 * numRead);
    numRead++;
    if (numRead > 5) {
      throw new Error('VarInt is too big');
    }
  } while ((read & 0x80) !== 0);

  return { value: result, size: numRead };
}
