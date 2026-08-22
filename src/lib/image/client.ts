export interface ImageGenerateOptions {
  prompt: string;
  model?: string;
  size?: string;
  imageType?: string;
}

export interface ImageGenerateResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

const STYLE_PRESETS: Record<string, string> = {
  scene: "温馨插画风，暖色调，柔和光线",
  selfie: "人像摄影，轻度美颜，自然光",
  gift: "扁平插画，可爱风，精致礼物",
  share: "风景摄影，日常记录，生活感",
};

function getConfig(): { apiKey: string; baseUrl: string; model: string } {
  const apiKey = process.env.IMAGE_API_KEY ?? process.env.LLM_API_KEY;
  const baseUrl = process.env.IMAGE_BASE_URL?.replace(/\/$/, "");
  const model = process.env.IMAGE_MODEL ?? "doubao-seedream-5.0-lite";

  if (!apiKey || !baseUrl) {
    throw new Error("Image API credentials are not configured");
  }

  return { apiKey, baseUrl, model };
}

export function buildImagePrompt(
  prompt: string,
  imageType?: string
): string {
  const style = imageType ? STYLE_PRESETS[imageType] : STYLE_PRESETS.scene;
  return `${prompt}，${style ?? STYLE_PRESETS.scene}，高质量，适合聊天分享`;
}

export function createImageClient(): {
  generate: (options: ImageGenerateOptions) => Promise<ImageGenerateResult>;
} {
  const config = getConfig();

  return {
    async generate(options) {
      const fullPrompt = buildImagePrompt(
        options.prompt,
        options.imageType
      );

      try {
        const response = await fetch(config.baseUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.apiKey}`,
          },
          body: JSON.stringify({
            model: options.model ?? config.model,
            prompt: fullPrompt,
            size: options.size ?? "2K",
            response_format: "url",
            n: 1,
          }),
        });

        if (!response.ok) {
          const text = await response.text();
          return {
            success: false,
            error: `Image API failed: ${response.status} ${text}`,
          };
        }

        const data = (await response.json()) as {
          data?: Array<{ url?: string }>;
          error?: { message?: string };
        };

        const imageUrl = data.data?.[0]?.url;
        if (!imageUrl) {
          return {
            success: false,
            error: data.error?.message ?? "No image URL in response",
          };
        }

        return { success: true, imageUrl };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Image generation failed",
        };
      }
    },
  };
}
