/**
 * Cyberpunk Main Layout
 * Techno-Magic Design System
 */

import { ReactNode, useState } from 'react';
import { useLocation } from 'react-router-dom';
import TitleBar from './TitleBar';
import Sidebar from './Sidebar';
import { isTauri } from '../../api/tauri';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const hideSidebar = location.pathname === '/login';

  return (
    <div className="flex flex-col h-screen bg-dark-primary text-gray-200 font-sans overflow-hidden relative selection:bg-techno-cyan selection:text-dark-primary">
      {/* System Overlay Effects */}
      <div className="fixed inset-0 pointer-events-none z-50">
         <div className="absolute inset-0 scanlines opacity-30" />
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
         {/* Corner HUD Elements */}
         <div className="absolute top-4 left-4 w-32 h-32 border-t border-l border-white/20 rounded-tl-3xl opacity-50" />
         <div className="absolute bottom-4 right-4 w-32 h-32 border-b border-r border-white/20 rounded-br-3xl opacity-50" />
         <div className="absolute bottom-4 left-4 text-[10px] font-mono text-techno-cyan/50">SYS.VER.2.0.4 // ONLINE</div>
      </div>

      {/* TitleBar - Fixed at top, full width */}
      {/* In browser: returns null (no padding needed) */}
      {/* In Tauri: renders drag region and window controls */}
      <div className="fixed top-0 left-0 right-0 z-40">
        <TitleBar />
      </div>

      {/* Main Content Area - Below TitleBar */}
      {/* Add padding only in Tauri where TitleBar exists */}
      <div className={`flex flex-1 min-w-0 ${isTauri ? 'pt-14' : ''} overflow-hidden`}>
        {!hideSidebar && <Sidebar />}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-cyber-grid relative perspective-1000 overflow-hidden">
          {/* Content */}
          <main className="flex-1 overflow-y-auto overflow-x-hidden p-8 relative scroll-smooth">
            {/* Background Ambient Elements */}
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-techno-cyan/5 to-magic-purple/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="relative z-10 animate-fade-in-up w-full max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
