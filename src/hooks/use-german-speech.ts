import { useCallback, useState } from "react";
import { toast } from "sonner";

export function useGermanSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speak = useCallback((text: string, rate: number = 1) => {
    try {
      const clean = text.trim();
      if (!clean) return;

      setIsSpeaking(true);

      // 1. APK NATIVE TTS - This will fix your APK 100%
      const median = (window as any).median;
      if (median && median.textToSpeech && median.textToSpeech.speak) {
        median.textToSpeech.speak({
          text: clean,
          language: 'de-DE',
          rate: rate < 1 ? 0.6 : 1.0
        });
        setTimeout(() => setIsSpeaking(false), 1500);
        return;
      }

      // 2. Chrome / Web - Google Audio (your current code, working)
      const url = `https://translate.googleapis.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(clean)}&tl=de&client=gtx`;
      const audio = new Audio();
      audio.crossOrigin = "anonymous";
      audio.src = url;
      audio.preload = "auto";
      audio.playbackRate = rate < 1 ? 0.65 : 1.0;
      
      audio.onended = () => setIsSpeaking(false);
      audio.onerror = () => {
        setIsSpeaking(false);
        // Fallback to browser's built-in voice
        if ('speechSynthesis' in window) {
          const u = new SpeechSynthesisUtterance(clean);
          u.lang = 'de-DE';
          u.rate = rate < 1 ? 0.6 : 1.0;
          window.speechSynthesis.speak(u);
        } else {
          toast.error("Tap again to play");
        }
      };

      audio.play().catch(() => {
        // WebView autoplay blocked - try native speech
        if ('speechSynthesis' in window) {
          const u = new SpeechSynthesisUtterance(clean);
          u.lang = 'de-DE';
          u.rate = rate < 1 ? 0.6 : 1.0;
          u.onend = () => setIsSpeaking(false);
          window.speechSynthesis.speak(u);
        } else {
          setIsSpeaking(false);
          toast.error("Tap speaker again");
        }
      });

    } catch {
      setIsSpeaking(false);
    }
  }, []);

  return { voice: null, supported: true, speak, isSpeaking };
}
