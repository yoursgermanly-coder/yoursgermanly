import { createFileRoute } from "@tanstack/react-router";

import { getAiApiKey, TRANSCRIBE_MODEL } from "@/lib/ai-gateway.server";

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

export const Route = createFileRoute("/api/transcribe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = getAiApiKey();
        if (!key) return new Response("AI is not configured yet.", { status: 500 });

        let form: FormData;
        try {
          form = await request.formData();
        } catch {
          return new Response("Send the recording as form data.", { status: 400 });
        }

        const audio = form.get("audio");
        if (!(audio instanceof File) || audio.size === 0) {
          return new Response("No recording received. Please try again.", { status: 400 });
        }
        if (audio.size > MAX_UPLOAD_BYTES) {
          return new Response("That recording is too long. Keep it under a minute.", {
            status: 400,
          });
        }

        const upstream = new FormData();
        upstream.append("model", TRANSCRIBE_MODEL);
        upstream.append("file", audio, "recording.wav");
        upstream.append("language", "de");

        const response = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}` },
          body: upstream,
        });

        if (!response.ok) {
          const detail = await response.text().catch(() => "");
          console.error("[lernexa] transcription failed", response.status, detail);
          if (response.status === 429) {
            return new Response("Too many requests right now. Please try again in a moment.", {
              status: 429,
            });
          }
          if (response.status === 402) {
            return new Response("AI credits are exhausted. Please add credits to continue.", {
              status: 402,
            });
          }
          return new Response("We couldn't hear that clearly. Please record again.", {
            status: 502,
          });
        }

        const data = (await response.json()) as { text?: string };
        return Response.json({ text: data.text ?? "" });
      },
    },
  },
});
