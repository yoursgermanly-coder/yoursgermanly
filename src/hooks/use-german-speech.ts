import { useCallback, useState } from "react";
import { toast } from "sonner";

export function useGermanSpeech() {
  const [supported] = useState(true);
  const [voice] = useState<SpeechSynthesisVoice | null>(null);

  const speak = useCallback((text: string) => {
    try {
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=de&client=tw-ob`;
      const audio = new Audio(url);
      audio.play().catch(() => {
        toast.error("Audio play failed. Tap again.");
      });
    } catch (e) {
      toast.error("Audio isn't supported on this device.");
    }
  }, []);

  return { voice, supported, speak, isSpeaking: false };
}
