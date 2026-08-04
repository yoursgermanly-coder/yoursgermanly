/** Browser mic capture (PCM → WAV) plus simple pronunciation scoring helpers. */

const TARGET_SAMPLE_RATE = 16000;

export type Recorder = {
  stop: () => Promise<Blob>;
  cancel: () => void;
};

function downsample(input: Float32Array, fromRate: number, toRate: number): Float32Array {
  if (toRate >= fromRate) return input;
  const ratio = fromRate / toRate;
  const length = Math.floor(input.length / ratio);
  const output = new Float32Array(length);
  for (let index = 0; index < length; index += 1) {
    output[index] = input[Math.floor(index * ratio)] ?? 0;
  }
  return output;
}

function encodeWav(chunks: Float32Array[], sampleRate: number): Blob {
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const merged = new Float32Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }
  const samples = downsample(merged, sampleRate, TARGET_SAMPLE_RATE);

  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const writeString = (position: number, text: string) => {
    for (let index = 0; index < text.length; index += 1) {
      view.setUint8(position + index, text.charCodeAt(index));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, TARGET_SAMPLE_RATE, true);
  view.setUint32(28, TARGET_SAMPLE_RATE * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, samples.length * 2, true);

  let position = 44;
  for (const sample of samples) {
    const clamped = Math.max(-1, Math.min(1, sample));
    view.setInt16(position, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
    position += 2;
  }

  return new Blob([buffer], { type: "audio/wav" });
}

/** Starts recording the microphone; resolve the returned `stop()` for a complete WAV file. */
export async function startRecording(): Promise<Recorder> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const context = new AudioContext();
  const source = context.createMediaStreamSource(stream);
  const processor = context.createScriptProcessor(4096, 1, 1);
  const chunks: Float32Array[] = [];

  processor.onaudioprocess = (event) => {
    chunks.push(new Float32Array(event.inputBuffer.getChannelData(0)));
  };
  source.connect(processor);
  processor.connect(context.destination);

  const teardown = () => {
    stream.getTracks().forEach((track) => track.stop());
    processor.disconnect();
    source.disconnect();
  };

  return {
    stop: async () => {
      teardown();
      const blob = encodeWav(chunks, context.sampleRate);
      await context.close();
      return blob;
    },
    cancel: () => {
      teardown();
      void context.close();
    },
  };
}

export async function transcribeGerman(audio: Blob): Promise<string> {
  const body = new FormData();
  body.append("audio", audio, "recording.wav");

  const response = await fetch("/api/transcribe", { method: "POST", body });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(detail || "We couldn't hear that. Please try again.");
  }
  const data = (await response.json()) as { text?: string };
  return (data.text ?? "").trim();
}

export function normalizeGerman(text: string): string {
  return text
    .toLowerCase()
    .replaceAll("ß", "ss")
    .replaceAll("ä", "a")
    .replaceAll("ö", "o")
    .replaceAll("ü", "u")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function editDistance(a: string, b: string): number {
  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    let diagonal = previous[0] ?? 0;
    previous[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const temp = previous[j] ?? 0;
      previous[j] = Math.min(
        (previous[j] ?? 0) + 1,
        (previous[j - 1] ?? 0) + 1,
        diagonal + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      diagonal = temp;
    }
  }
  return previous[b.length] ?? 0;
}

/** 0–100 similarity between what the learner said and the target phrase. */
export function scoreAttempt(target: string, spoken: string): number {
  const a = normalizeGerman(target);
  const b = normalizeGerman(spoken);
  if (!a || !b) return 0;
  const distance = editDistance(a, b);
  return Math.max(0, Math.round((1 - distance / Math.max(a.length, b.length)) * 100));
}

export function feedbackForScore(score: number): { label: string; message: string } {
  if (score >= 85) {
    return { label: "Ausgezeichnet!", message: "That sounded really natural. Keep going!" };
  }
  if (score >= 65) {
    return { label: "Gut gemacht!", message: "Very close — listen once more and polish the ending sounds." };
  }
  if (score >= 40) {
    return { label: "Fast!", message: "You're getting there. Play the slow audio and try again." };
  }
  return { label: "Nochmal", message: "Let's try that once more — listen slowly, then repeat." };
}
