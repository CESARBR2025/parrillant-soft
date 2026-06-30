'use client';

import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';

interface NavigationContextType {
  startNavigation: () => void;
}

export const NavigationContext = createContext<NavigationContextType>({
  startNavigation: () => {},
});

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [isNavigating, setIsNavigating] = useState(false);
  const navTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathname = usePathname();
  const prevPathname = useRef(pathname);

  useEffect(() => {
    if (prevPathname.current !== pathname) {
      setIsNavigating(false);
      prevPathname.current = pathname;
    }
  }, [pathname]);

  const startNavigation = useCallback(() => {
    if (navTimerRef.current) clearTimeout(navTimerRef.current);
    navTimerRef.current = setTimeout(() => setIsNavigating(true), 300);
  }, []);

  return (
    <NavigationContext.Provider value={{ startNavigation }}>
      <LoadingOverlay show={isNavigating} />
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigate() {
  const { startNavigation } = useContext(NavigationContext);
  const router = useRouter();

  return {
    push: (href: string, options?: any) => {
      startNavigation();
      router.push(href, options);
    },
    replace: (href: string, options?: any) => {
      startNavigation();
      router.replace(href, options);
    },
    back: () => router.back(),
    forward: () => router.forward(),
    refresh: () => router.refresh(),
    prefetch: (href: string) => router.prefetch(href),
  };
}
