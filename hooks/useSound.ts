'use client';

import { useCallback, useEffect, useRef } from 'react';

export function useSound(soundFile: string = '/sounds/didi_pedido.mp3') {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const audio = new Audio(soundFile);
    audio.preload = 'auto';
    audioRef.current = audio;

    const unlock = () => {
      audio.play().then(() => {
        audio.pause();
        audio.currentTime = 0;
      }).catch(() => {});
    };

    document.addEventListener('click', unlock, { once: true });
    document.addEventListener('touchstart', unlock, { once: true });

    return () => {
      document.removeEventListener('click', unlock);
      document.removeEventListener('touchstart', unlock);
      audio.src = '';
      audioRef.current = null;
    };
  }, [soundFile]);

  const play = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }, []);

  return { play };
}
