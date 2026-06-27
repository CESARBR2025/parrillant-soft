'use client';

import { Menu } from 'lucide-react';
import { UserMenu } from './UserMenu';
import { useHeaderActions } from '@/components/providers/HeaderActionsProvider';

interface HeaderProps {
  onToggleMobile?: () => void;
}

export function Header({ onToggleMobile }: HeaderProps) {
  const { headerCenter } = useHeaderActions();

  return (
    <header className="h-20 bg-card border-b-2 border-[#F6F6F6] flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobile}
          className="lg:hidden p-2 rounded-lg text-muted hover:text-body hover:bg-bg-base transition-colors"
          aria-label="Abrir menú de navegación"
        >
          <Menu className="w-6 h-6" />
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
  );
}
