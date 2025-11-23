import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';
import { WSEvent, UpdateProgress } from '@modern-launcher/shared';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:7240/ws';

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { accessToken } = useAuthStore();

  useEffect(() => {
    if (!accessToken) return;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      
      // Authenticate
      ws.send(JSON.stringify({
        event: WSEvent.AUTH,
        token: accessToken,
      }));
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        // Handle other WebSocket events here if needed
      } catch (error) {
        // Ignore parsing errors for other messages
      }
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [accessToken]);

  const sendMessage = useCallback((event: WSEvent, data: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ event, ...data }));
    }
  }, []);

  return { ws: wsRef.current, isConnected, sendMessage };
}

export function useDownloadProgress(
  onProgress: (progress: UpdateProgress) => void,
  onFileList?: (files: Array<{ filePath: string; fileHash: string; fileSize: number | string; fileType: string }>) => void
) {
  const { ws, isConnected } = useWebSocket();

  useEffect(() => {
    if (!ws || !isConnected) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.event === WSEvent.UPDATE_PROGRESS) {
          onProgress(data.data);
        } else if (data.event === WSEvent.DOWNLOAD_CLIENT && data.data.files) {
          // Получен список файлов для загрузки
          if (onFileList) {
            onFileList(data.data.files);
          }
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.addEventListener('message', handleMessage);

    return () => {
      ws.removeEventListener('message', handleMessage);
    };
  }, [ws, isConnected, onProgress, onFileList]);
}

export function useClientDownload() {
  const { ws, isConnected, sendMessage } = useWebSocket();

  const downloadClient = useCallback((versionId: string) => {
    if (!isConnected) {
      throw new Error('WebSocket not connected');
    }
    sendMessage(WSEvent.DOWNLOAD_CLIENT, { versionId });
  }, [isConnected, sendMessage]);

  return { downloadClient, isConnected };
}
