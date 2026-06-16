'use client';

import { useEffect, useState } from 'react';

interface OrderTimerProps {
  created_at: string;
  now: number;
}

export function OrderTimer({ created_at, now }: OrderTimerProps) {
  const [display, setDisplay] = useState('');

  useEffect(() => {
    function update() {
      const diff = now - new Date(created_at).getTime();
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setDisplay(`${mins}:${secs.toString().padStart(2, '0')}`);
    }
    update();
  }, [created_at, now]);

  return (
    <span className="tabular-nums text-sm font-mono">{display}</span>
  );
}
