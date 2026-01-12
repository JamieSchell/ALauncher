import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { HashRouter } from 'react-router-dom';
import App from './App';
import { queryClient } from './config/queryClient';
import { ToastProvider } from './providers/ToastProvider';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

// Hotkey for DevTools (works in both dev and production)
if (typeof window !== 'undefined') {
  window.addEventListener('keydown', async (e) => {
    // F12 or Ctrl+Shift+I to open DevTools
    if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
      e.preventDefault();
      // Try to open DevTools through Tauri API
      if ((window as any).__TAURI_INTERNALS__ || (window as any).__TAURI__) {
        try {
          // Пробуем несколько способов открытия DevTools
          const { getCurrentWebviewWindow, WebviewWindow } = await import('@tauri-apps/api/webviewWindow');
          
          // Способ 1: getCurrentWebviewWindow (рекомендуемый)
          try {
            const currentWindow = getCurrentWebviewWindow();
            if (currentWindow) {
              await currentWindow.openDevtools();
              console.log('DevTools opened via getCurrentWebviewWindow');
              return;
            }
          } catch (e) {
            console.log('getCurrentWebviewWindow failed, trying alternatives...', e);
          }
          
          // Способ 2: WebviewWindow.getCurrent() (старый API)
          try {
            const currentWindow = WebviewWindow.getCurrent();
            if (currentWindow) {
              await currentWindow.openDevtools();
              console.log('DevTools opened via WebviewWindow.getCurrent()');
              return;
            }
          } catch (e) {
            console.log('WebviewWindow.getCurrent() failed, trying getByLabel...', e);
          }
          
          // Способ 3: Получить окно по label
          try {
            const window = await WebviewWindow.getByLabel('main');
            if (window) {
              await window.openDevtools();
              console.log('DevTools opened via getByLabel("main")');
              return;
            }
          } catch (e) {
            console.log('getByLabel failed:', e);
          }
          
          console.error('All DevTools opening methods failed');
        } catch (error) {
          console.error('Failed to import or use DevTools API:', error);
        }
      }
    }
  });
}


ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <HashRouter>
          <ToastProvider>
            <App />
          </ToastProvider>
        </HashRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
