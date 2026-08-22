const VOICE_MAP: Record<string, string> = {
  dominant: "zh_male_m191_uranus_bigtts",
  puppy: "saturn_zh_male_shuanglangshaonian_tob",
  warm: "zh_male_taocheng_uranus_bigtts",
};

interface TTSStreamChunk {
  code?: number;
  data?: string;
  message?: string;
}

export interface TTSOptions {
  text: string;
  mode: string;
}

export interface TTSResult {
  audioUrl: string;
}

function getConfig(): { apiKey: string; baseUrl: string; resourceId: string } {
  const apiKey = process.env.TTS_API_KEY ?? process.env.LLM_API_KEY;
  const baseUrl = process.env.TTS_BASE_URL?.replace(/\/$/, "");
  const resourceId = process.env.TTS_MODEL ?? "seed-tts-2.0";

  if (!apiKey || !baseUrl) {
    throw new Error("TTS credentials are not configured");
  }

  return { apiKey, baseUrl, resourceId };
}

async function collectStreamAudio(response: Response): Promise<Buffer> {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("TTS response body is empty");
  }

  const decoder = new TextDecoder();
  let lineBuffer = "";
  const audioChunks: Buffer[] = [];
  let finished = false;

  while (!finished) {
    const { done, value } = await reader.read();
    if (done) break;

    lineBuffer += decoder.decode(value, { stream: true });
    const lines = lineBuffer.split("\n");
    lineBuffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      let chunk: TTSStreamChunk;
      try {
        chunk = JSON.parse(trimmed) as TTSStreamChunk;
      } catch {
        continue;
      }

      const code = chunk.code ?? 0;

      if (code === 0 && chunk.data) {
        audioChunks.push(Buffer.from(chunk.data, "base64"));
        continue;
      }

      if (code === 20000000) {
        finished = true;
        break;
      }

      if (code > 0) {
        throw new Error(chunk.message ?? `TTS stream error (code ${code})`);
      }
    }
  }

  return Buffer.concat(audioChunks);
}

export async function synthesizeSpeech(
  options: TTSOptions
): Promise<TTSResult> {
  const config = getConfig();
  const speaker = VOICE_MAP[options.mode] ?? VOICE_MAP.warm;

  const response = await fetch(config.baseUrl, {
    method: "POST",
    headers: {
      "X-Api-Key": config.apiKey,
      "X-Api-Resource-Id": config.resourceId,
      "Content-Type": "application/json",
      Connection: "keep-alive",
      "X-Control-Require-Usage-Tokens-Return": "*",
    },
    body: JSON.stringify({
      req_params: {
        text: options.text,
        speaker,
        audio_params: {
          format: "mp3",
          sample_rate: 24000,
        },
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`TTS failed: ${response.status} ${text}`);
  }

  const audioBuffer = await collectStreamAudio(response);
  if (audioBuffer.length === 0) {
    throw new Error("TTS returned no audio data");
  }

  const base64 = audioBuffer.toString("base64");
  return { audioUrl: `data:audio/mp3;base64,${base64}` };
}
