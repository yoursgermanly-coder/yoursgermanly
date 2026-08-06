import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

/** German text-to-speech with a native-voice preference and slow replay. */
export function useGermanSpeech() {
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setSupported(false);
      return;
    }
    const pickVoice = () => {
      const germanVoices = window.speechSynthesis
        .getVoices()
        .filter((item) => item.lang.startsWith("de"));
      if (germanVoices.length > 0) {
        setVoice(germanVoices.find((item) => item.localService) ?? germanVoices[0] ?? null);
      }
    };
    pickVoice();
    window.speechSynthesis.addEventListener("voiceschanged", pickVoice);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", pickVoice);
  }, []);

  const speak = useCallback(
    (text: string, rate = 1) => {
      if (!supported) {
        toast.error("Audio isn't supported on this device.");
        return;
      }
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "de-DE";
      utterance.rate = rate;
      if (voice) utterance.voice = voice;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    },
    [supported, voice],
  );

  return { speak, supported, voiceName: voice?.name ?? null };
}
