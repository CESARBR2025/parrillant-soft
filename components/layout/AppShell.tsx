'use client';

import { useState, type ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-bg-app flex">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((prev) => !prev)}
        mobileOpen={mobileDrawerOpen}
        onMobileClose={() => setMobileDrawerOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header onToggleMobile={() => setMobileDrawerOpen((prev) => !prev)} />

        <main className="flex-1 overflow-y-auto p-4 lg:p-6 lg:pb-6">
          {children}
        </main>
      </div>
    </div>
  );
}
