"use client";

import { useCallback, useEffect, useRef } from "react";

export function useSound(soundFile: string = "/sounds/didi_pedido.mp3") {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const audio = new Audio(soundFile);
    audio.preload = "auto";
    audioRef.current = audio;
    console.log(`[useSound] Audio creado para ${soundFile}`);

    const unlock = () => {
      audio
        .play()
        .then(() => {
          audio.pause();
          audio.currentTime = 0;
          console.log(`[useSound] Unlock exitoso para ${soundFile}`);
        })
        .catch((e) => {
          console.warn(`[useSound] Unlock falló para ${soundFile}:`, e.message);
        });
    };

    unlock();
    document.addEventListener("click", unlock, { once: true });
    document.addEventListener("touchstart", unlock, { once: true });

    return () => {
      document.removeEventListener("click", unlock);
      document.removeEventListener("touchstart", unlock);
      audio.src = "";
      audioRef.current = null;
    };
  }, [soundFile]);

  const play = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) {
      console.warn("[useSound] play() llamado pero audioRef es null");
      return;
    }
    console.log("[useSound] play() ejecutándose");
    audio.currentTime = 0;
    audio
      .play()
      .then(() => {
        console.log("[useSound] play() exitoso");
      })
      .catch((e) => {
        console.error("[useSound] play() falló:", e.message);
      });
  }, []);

  return { play };
}
