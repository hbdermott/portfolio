/**
 * Boot-sound utility — plays the retro PC startup MP3 once on load.
 *
 * Tries autoplay as soon as the browser estimates it can play through.
 * If the browser blocks it (autoplay policy), retries on the very next
 * user interaction and then detaches all listeners.
 */
export function playBootSound(src: string = '/OldPCBoot.mp3'): HTMLAudioElement {
  const audio = new Audio(src);
  audio.volume = 0.6;
  audio.preload = 'auto';

  const tryPlay = () => {
    audio.play()
      .then(() => console.log('[BootSound] Playing'))
      .catch((err) => console.warn('[BootSound] Playback blocked:', err.message));
  };

  // Try autoplay once the browser thinks it can play to the end.
  // For cached files this fires almost immediately.
  audio.addEventListener('canplaythrough', tryPlay, { once: true });

  // Log load errors (wrong path, 404, CORS, etc.)
  audio.addEventListener('error', () => {
    console.error('[BootSound] Failed to load:', src);
  }, { once: true });

  // Fallback: browsers block autoplay without user interaction.
  // Retry on the very next interaction and then clean up.
  const events = ['click', 'keydown', 'touchstart', 'mousemove'];
  const resume = () => {
    tryPlay();
    events.forEach((e) => document.removeEventListener(e, resume));
  };
  events.forEach((e) =>
    document.addEventListener(e, resume, { once: true, passive: true })
  );

  return audio;
}
