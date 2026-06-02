/**
 * Boot-sound utility — plays the retro PC startup MP3 once on load.
 *
 * Tries autoplay immediately.  If the browser blocks it, the sound
 * starts on the very next user interaction (click, key, touch, or
 * mouse movement) and then detaches all listeners.
 */
export function playBootSound(src: string = '/OldPCBoot.mp3'): HTMLAudioElement {
  const audio = new Audio(src);
  audio.volume = 0.6;
  audio.preload = 'auto';

  const tryPlay = () => {
    audio.play().catch(() => {});
  };

  // Attempt immediately
  tryPlay();

  // If blocked, retry aggressively on first interaction
  const events = ['click', 'keydown', 'touchstart', 'mousemove'];
  const resume = () => {
    tryPlay();
    events.forEach(e => document.removeEventListener(e, resume));
  };
  events.forEach(e => document.addEventListener(e, resume, { once: true, passive: true }));

  return audio;
}
