/**
 * Boot-sound utility — plays the retro PC startup MP3 once on load.
 *
 * Waits for the audio to be fully buffered (canplaythrough), then attempts
 * autoplay. If the browser blocks it, the sound starts on the very next
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

  // Wait for enough audio to buffer before trying autoplay.
  // `canplaythrough` fires when the browser estimates it can play
  // to the end without further buffering.
  audio.addEventListener('canplaythrough', () => {
    console.log('[BootSound] Buffered, attempting autoplay');
    tryPlay();
  }, { once: true });

  // Log load errors so we know if the file is missing
  audio.addEventListener('error', () => {
    console.error('[BootSound] Failed to load:', src);
  }, { once: true });

  // Fallback: if autoplay was blocked, any user interaction resumes
  const events = ['click', 'keydown', 'touchstart', 'mousemove'];
  const resume = () => {
    if (audio.readyState >= 3) {
      // HAVE_FUTURE_DATA or HAVE_ENOUGH_DATA
      tryPlay();
    }
    events.forEach((e) => document.removeEventListener(e, resume));
  };
  events.forEach((e) =>
    document.addEventListener(e, resume, { once: true, passive: true })
  );

  return audio;
}
