import { useCallback, useState } from "react";
import { toast } from "sonner";

export function useGermanSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speak = useCallback((text: string, rate: number = 1) => {
    try {
      setIsSpeaking(true);
      const clean = text.trim();
      if (!clean) {
        setIsSpeaking(false);
        return;
      }
      // This URL works inside Median APK + Chrome + iOS
      const url = `https://translate.googleapis.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(clean)}&tl=de&client=gtx`;
      const audio = new Audio(url);
      audio.crossOrigin = "anonymous";
      // Slow mode for turtle button
      audio.playbackRate = rate < 1 ? 0.65 : 1.0;
      
      audio.onended = () => setIsSpeaking(false);
      audio.onerror = () => {
        setIsSpeaking(false);
        toast.error("Tap again to play");
      };

      audio.play().catch(() => {
        setIsSpeaking(false);
        // second attempt for WebView autoplay block
        const a2 = new Audio(url);
        a2.play().catch(() => toast.error("Tap the speaker again"));
      });
    } catch {
      setIsSpeaking(false);
    }
  }, []);

  return { voice: null, supported: true, speak, isSpeaking };
}
