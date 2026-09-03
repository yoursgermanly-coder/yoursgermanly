import { useEffect, useRef, useState } from "react";

import introVideo from "@/assets/app_intro-2.mp4.asset.json";

const FALLBACK_TIMEOUT_MS = 9000;
const FADE_DURATION_MS = 500;

/**
 * Full-screen intro video shown once on every fresh app open.
 * Plays start to finish with no controls, then fades out.
 * Tries autoplay with sound first; falls back to muted autoplay
 * when the browser blocks audio before any user interaction.
 */
export function IntroSplash() {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const dismissedRef = useRef(false);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!visible || dismissedRef.current) return;

    const dismiss = () => {
      if (dismissedRef.current) return;
      dismissedRef.current = true;
      setFading(true);
      window.setTimeout(() => setVisible(false), FADE_DURATION_MS);
    };

    const fallback = window.setTimeout(dismiss, FALLBACK_TIMEOUT_MS);

    const video = videoRef.current;
    // Browsers block autoplay with sound before any interaction: fall back to
    // muted playback and bring the audio in on the very first touch/tap.
    const unmute = () => {
      if (!video) return;
      video.muted = false;
      video.volume = 1;
      void video.play().catch(() => undefined);
    };

    if (video && !startedRef.current) {
      startedRef.current = true;
      video.addEventListener("ended", dismiss);
      video.addEventListener("error", dismiss);
      video.muted = false;
      video.volume = 1;
      video.play().catch(() => {
        video.muted = true;
        video.play().catch(() => dismiss());
        window.addEventListener("pointerdown", unmute, { once: true });
        window.addEventListener("touchstart", unmute, { once: true });
        window.addEventListener("keydown", unmute, { once: true });
      });
    }

    return () => {
      window.clearTimeout(fallback);
      window.removeEventListener("pointerdown", unmute);
      window.removeEventListener("touchstart", unmute);
      window.removeEventListener("keydown", unmute);
      if (video) {
        video.removeEventListener("ended", dismiss);
        video.removeEventListener("error", dismiss);
      }
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Yours Germanly intro"
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-[#12111A] transition-opacity duration-500 ${
        fading ? "opacity-0" : "opacity-100"
      }`}
    >
      <video
        ref={videoRef}
        src={introVideo.url}
        playsInline
        preload="auto"
        className="h-full w-full object-cover"
      />
    </div>
  );
}
