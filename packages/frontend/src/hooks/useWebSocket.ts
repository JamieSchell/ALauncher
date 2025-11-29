import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';
import { WSEvent, UpdateProgress, ClientFilesUpdate } from '@modern-launcher/shared';
import { API_CONFIG } from '../config/api';
import { useQueryClient } from '@tanstack/react-query';

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { accessToken } = useAuthStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!accessToken) return;

    console.log('[WebSocket] Connecting to:', API_CONFIG.wsUrl);
    const ws = new WebSocket(API_CONFIG.wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[WebSocket] Connected successfully to:', API_CONFIG.wsUrl);
      setIsConnected(true);
      
      // Authenticate
      ws.send(JSON.stringify({
        event: WSEvent.AUTH,
        token: accessToken,
      }));
      console.log('[WebSocket] Authentication message sent');
    };

    ws.onclose = (event) => {
      console.log('[WebSocket] Disconnected:', {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean,
        url: API_CONFIG.wsUrl,
      });
      setIsConnected(false);
    };

    ws.onerror = (error) => {
      console.error('[WebSocket] Connection error:', {
        error,
        url: API_CONFIG.wsUrl,
        readyState: ws.readyState,
      });
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Обработка обновления файлов клиента
        if (data.event === WSEvent.CLIENT_FILES_UPDATED) {
          const update: ClientFilesUpdate = data.data;
          console.log('[WebSocket] Client files updated:', update);
          
          // Инвалидировать кэш для версии клиента
          queryClient.invalidateQueries({ 
            queryKey: ['client-versions', 'version', update.version] 
          });
          queryClient.invalidateQueries({ 
            queryKey: ['client-versions', update.versionId] 
          });
          queryClient.invalidateQueries({ 
            queryKey: ['client-versions'] 
          });
          
          // Также инвалидировать запросы, которые используют версию
          queryClient.invalidateQueries({ 
            queryKey: ['client-versions', 'version', update.version, 'files'] 
          });
        }
      } catch (error) {
        // Ignore parsing errors for other messages
        console.error('[WebSocket] Error parsing message:', error);
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
