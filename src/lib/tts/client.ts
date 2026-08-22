const VOICE_MAP: Record<string, string> = {
  dominant: "zh_male_m191_uranus_bigtts",
  puppy: "saturn_zh_male_shuanglangshaonian_tob",
  warm: "zh_male_taocheng_uranus_bigtts",
};

export interface TTSOptions {
  text: string;
  mode: string;
}

export interface TTSResult {
  audioUrl: string;
}

function getConfig(): { apiKey: string; baseUrl: string; model: string } {
  const apiKey = process.env.TTS_API_KEY ?? process.env.LLM_API_KEY;
  const baseUrl = process.env.TTS_BASE_URL?.replace(/\/$/, "");
  const model = process.env.TTS_MODEL ?? "seed-tts-2.0";

  if (!apiKey || !baseUrl) {
    throw new Error("TTS credentials are not configured");
  }

  return { apiKey, baseUrl, model };
}

export async function synthesizeSpeech(
  options: TTSOptions
): Promise<TTSResult> {
  const config = getConfig();
  const speaker = VOICE_MAP[options.mode] ?? VOICE_MAP.warm;

  const response = await fetch(`${config.baseUrl}/audio/speech`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      input: options.text,
      voice: speaker,
      response_format: "mp3",
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`TTS failed: ${response.status} ${text}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const base64 = buffer.toString("base64");
  return { audioUrl: `data:audio/mp3;base64,${base64}` };
}
