/**
 * Boot-sound utility — plays the retro PC startup MP3 once on load.
 */
export function playBootSound(src: string = '/OldPCBoot.mp3'): HTMLAudioElement {
  const audio = new Audio(src);
  audio.volume = 0.6;
  // Attempt autoplay; browsers may block until user interaction.
  audio.play().catch(() => {
    // Defer to first click if autoplay is blocked
    const resume = () => {
      audio.play().catch(() => {});
      document.removeEventListener('click', resume);
    };
    document.addEventListener('click', resume);
  });
  return audio;
}
