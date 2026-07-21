import OpenAI from "openai";
import { AppConfig, hasOpenRouter } from "./config";

const TEXT_FALLBACKS = [
  "openai/gpt-oss-20b:free",
  "meta-llama/llama-3.2-3b-instruct:free",
  "google/gemma-4-26b-a4b-it:free",
];

const VISION_FALLBACKS = [
  "nvidia/nemotron-nano-12b-v2-vl:free",
  "google/gemma-4-31b-it:free",
  "google/gemma-4-26b-a4b-it:free",
  "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
];

function appReferer() {
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return process.env.NEXT_PUBLIC_APP_URL ?? "https://agroguardian-ai-six.vercel.app";
}

export function getOpenRouterClient(cfg: AppConfig) {
  if (!hasOpenRouter(cfg)) return null;
  return new OpenAI({
    apiKey: cfg.openrouterApiKey,
    baseURL: cfg.openrouterBaseUrl,
    defaultHeaders: {
      "HTTP-Referer": appReferer(),
      "X-Title": "AgroGuardian AI",
    },
  });
}

function uniqueModels(primary: string, fallbacks: string[]) {
  return [...new Set([primary, ...fallbacks].filter(Boolean))];
}

function isModelUnavailable(err: unknown) {
  const msg = String(err instanceof Error ? err.message : err).toLowerCase();
  return (
    msg.includes("404") ||
    msg.includes("unavailable") ||
    msg.includes("no endpoints") ||
    msg.includes("not found") ||
    msg.includes("respondió vacío") ||
    msg.includes("respondio vacio")
  );
}

export function extractJson(text: string): Record<string, unknown> {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed) as Record<string, unknown>;
  } catch {
    /* continue */
  }
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) return JSON.parse(fence[1].trim()) as Record<string, unknown>;
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) {
    return JSON.parse(trimmed.slice(start, end + 1)) as Record<string, unknown>;
  }
  throw new Error(`No JSON in model response: ${trimmed.slice(0, 200)}`);
}

async function withModelFallback(
  models: string[],
  run: (model: string) => Promise<string>
): Promise<string> {
  let lastError: Error | null = null;
  for (const model of models) {
    try {
      return await run(model);
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
      if (!isModelUnavailable(e)) throw lastError;
    }
  }
  throw lastError ?? new Error("Ningún modelo OpenRouter disponible en este momento");
}

export async function chatCompletion(
  cfg: AppConfig,
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  opts?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    fallbacks?: string[];
  }
) {
  const client = getOpenRouterClient(cfg);
  if (!client) throw new Error("OpenRouter API key not configured");

  const models = uniqueModels(
    opts?.model ?? cfg.openrouterModel,
    opts?.fallbacks ?? TEXT_FALLBACKS
  );

  return withModelFallback(models, async (model) => {
    const res = await client.chat.completions.create({
      model,
      messages,
      temperature: opts?.temperature ?? 0.2,
      max_tokens: opts?.maxTokens ?? 1200,
    });
    const choice = res.choices[0]?.message;
    const text = (choice?.content ?? "").trim();
    if (!text) {
      const reasoning = String(
        (choice as { reasoning?: string; reasoning_content?: string } | undefined)
          ?.reasoning ??
          (choice as { reasoning_content?: string } | undefined)?.reasoning_content ??
          ""
      ).trim();
      if (reasoning) return reasoning;
      throw new Error(`Modelo ${model} respondió vacío`);
    }
    return text;
  });
}

export async function visionAnalyze(
  cfg: AppConfig,
  imageBytes: Buffer,
  prompt: string,
  mime = "image/jpeg"
) {
  const b64 = imageBytes.toString("base64");
  const models = uniqueModels(cfg.openrouterVisionModel, VISION_FALLBACKS);

  return withModelFallback(models, async (model) => {
    return chatCompletion(
      cfg,
      [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: `data:${mime};base64,${b64}` } },
          ],
        },
      ],
      { model, temperature: 0.1, maxTokens: 800, fallbacks: VISION_FALLBACKS }
    );
  });
}

/** Lightweight probe for /api/health */
export async function probeOpenRouter(cfg: AppConfig) {
  if (!hasOpenRouter(cfg)) return { ok: false, detail: "sin clave" };
  try {
    await chatCompletion(cfg, [{ role: "user", content: "Responde solo: OK" }], {
      maxTokens: 32,
      temperature: 0,
    });
    return { ok: true, detail: "texto OK" };
  } catch (e) {
    return { ok: false, detail: e instanceof Error ? e.message : "error" };
  }
}
