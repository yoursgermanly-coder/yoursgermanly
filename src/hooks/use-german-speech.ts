import { useCallback, useState } from "react";
import { toast } from "sonner";

export function useGermanSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speak = useCallback((text: string, rate: number = 1) => {
    try {
      setIsSpeaking(true);
      // This URL works inside Median APK
      const url = `https://translate.googleapis.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=de&client=gtx`;
      const audio = new Audio(url);
      
      audio.playbackRate = rate < 1 ? 0.7 : 1.0;
      
      audio.onended = () => setIsSpeaking(false);
      audio.onerror = () => {
        setIsSpeaking(false);
        toast.error("Tap again - audio loading");
      };

      audio.play().catch(() => {
        setIsSpeaking(false);
        // Fallback 2
        const audio2 = new Audio(url);
        audio2.play().catch(() => {
          toast.error("Audio blocked by browser - try tapping again");
        });
      });
    } catch (e) {
      setIsSpeaking(false);
      toast.error("Audio error, try again");
    }
  }, []);

  return { voice: null, supported: true, speak, isSpeaking };
}
