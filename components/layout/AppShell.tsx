'use client';

import { useState, type ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { UserMenu } from './UserMenu';
import { Menu } from 'lucide-react';
import { useHeaderActions } from '@/components/providers/HeaderActionsProvider';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const { headerCenter } = useHeaderActions();

  return (
    <div className="min-h-screen bg-bg-app flex">
      {/* Sidebar (desktop) */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((prev) => !prev)}
      />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top header */}
        <header className="h-16 bg-card border-b-2 border-[#F6F6F6] flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarCollapsed((prev) => !prev)}
              className="lg:hidden p-2 rounded-xl text-muted hover:text-body hover:bg-bg-base transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold tracking-tight hidden sm:block">
              <span className="text-text-primary">Parrilla </span>
              <span className="bg-gradient-to-r from-accent to-amber-400 bg-clip-text text-transparent">
                Norteña Soft
              </span>
            </h1>
          </div>
          <div className="flex-1 max-w-md mx-4 hidden md:block">
            {headerCenter}
          </div>
          <UserMenu />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 pb-20 lg:pb-6">
          {children}
        </main>
      </div>

      {/* Bottom navigation (mobile) */}
      <BottomNav />
    </div>
  );
}
