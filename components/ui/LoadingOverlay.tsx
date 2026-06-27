'use client';

import Image from 'next/image';

interface LoadingOverlayProps {
  show: boolean;
}

export function LoadingOverlay({ show }: LoadingOverlayProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
      <Image
        src="/parrillalogo.png"
        alt="Parrilla Norteña Soft"
        width={120}
        height={120}
        priority
        unoptimized
        className="drop-shadow-[0_0_30px_rgba(249,115,22,0.15)]"
      />
      <h1 className="mt-3 text-xl font-bold tracking-tight text-white">
        Parrilla Norteña Soft
      </h1>
      <div className="mt-5 flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-accent [animation-delay:0ms]" />
        <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-accent [animation-delay:150ms]" />
        <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-accent [animation-delay:300ms]" />
      </div>
    </div>
  );
}
