import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

import introVideo from "@/assets/app_intro-2.mp4.asset.json";

const FALLBACK_TIMEOUT_MS = 9000;
const FADE_DURATION_MS = 500;

/**
 * Full-screen intro video shown once per app open (every fresh load).
 * Plays a 9:16 portrait video, fades out when it ends, and can be skipped.
 */
export function IntroSplash() {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!visible) return;

    const dismiss = () => {
      setFading(true);
      window.setTimeout(() => setVisible(false), FADE_DURATION_MS);
    };

    const fallback = window.setTimeout(dismiss, FALLBACK_TIMEOUT_MS);

    const video = videoRef.current;
    if (video) {
      video.addEventListener("ended", dismiss);
      video.addEventListener("error", dismiss);
      // Some browsers block autoplay even when muted; bail out if it can't play.
      video.play().catch(() => dismiss);
    }

    return () => {
      window.clearTimeout(fallback);
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
        autoPlay
        muted
        playsInline
        preload="auto"
        className="h-full w-full object-cover"
      />
      <button
        type="button"
        aria-label="Skip intro"
        onClick={() => {
          setFading(true);
          window.setTimeout(() => setVisible(false), FADE_DURATION_MS);
        }}
        className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/25"
      >
        <X className="h-4 w-4" />
        Skip
      </button>
    </div>
  );
}
