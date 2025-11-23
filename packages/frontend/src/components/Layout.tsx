/**
 * Main Layout Component
 */

import { ReactNode } from 'react';
import TitleBar from './TitleBar';
import Sidebar from './Sidebar';
import Breadcrumbs from './Breadcrumbs';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <TitleBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto p-6">
          <Breadcrumbs />
          {children}
        </main>
      </div>
    </div>
  );
}
