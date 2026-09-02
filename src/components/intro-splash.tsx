import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX, X } from "lucide-react";

import introVideo from "@/assets/app_intro-2.mp4.asset.json";

const FALLBACK_TIMEOUT_MS = 9000;
const FADE_DURATION_MS = 500;

/**
 * Full-screen intro video shown once per app open (every fresh load).
 * Plays a 9:16 portrait video with sound when the browser allows it;
 * falls back to muted autoplay with an unmute button when it doesn't.
 */
export function IntroSplash() {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);
  const [muted, setMuted] = useState(false);
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
      // Try autoplay with sound first; most browsers block it, so fall back to muted.
      video.muted = false;
      video.play().catch(() => {
        video.muted = true;
        setMuted(true);
        video.play().catch(() => dismiss);
      });
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

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
  };

  const dismiss = () => {
    setFading(true);
    window.setTimeout(() => setVisible(false), FADE_DURATION_MS);
  };

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
        playsInline
        preload="auto"
        className="h-full w-full object-cover"
      />
      <div className="absolute right-4 top-4 flex items-center gap-2">
        <button
          type="button"
          aria-label={muted ? "Unmute intro" : "Mute intro"}
          onClick={toggleMute}
          className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/25"
        >
          {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          {muted ? "Unmute" : "Mute"}
        </button>
        <button
          type="button"
          aria-label="Skip intro"
          onClick={dismiss}
          className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/25"
        >
          <X className="h-4 w-4" />
          Skip
        </button>
      </div>
    </div>
  );
}
