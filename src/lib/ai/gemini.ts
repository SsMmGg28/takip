import "server-only";

// Projedeki TEK yapay zeka dokunma noktası. Sağlayıcıyı ileride değiştirmek
// gerekirse yalnızca bu dosya değişir. Şu an Google Gemini `generateContent`
// uç noktasını, çok-modlu (PDF/görsel) girdi + katı JSON çıktı ile kullanır.

const DEFAULT_MODEL = "gemini-2.5-flash";

/** Ortam değişkeninden model adı; yoksa güncel bir Flash modeli. */
function geminiModel(): string {
  return process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
}

/** Gemini anahtarı tanımlı mı? UI, anahtar yoksa manuel girişe düşer. */
export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

export interface GeminiInlineFile {
  /** base64 kodlanmış dosya içeriği (data: öneki OLMADAN). */
  base64: string;
  mimeType: string;
}

interface GeminiResponse {
  candidates?: {
    content?: { parts?: { text?: string }[] };
    finishReason?: string;
  }[];
  promptFeedback?: { blockReason?: string };
}

/**
 * Gemini'ye bir istem + (opsiyonel) dosya gönderir ve modeli verilen JSON
 * şemasına uygun yanıt vermeye zorlar. Ayrıştırılmış JSON'u `T` olarak döner.
 * Şema, Gemini'nin desteklediği OpenAPI alt kümesiyle yazılmalıdır
 * (type: "OBJECT" | "ARRAY" | "STRING" | "INTEGER" | "NUMBER" | "BOOLEAN").
 */
export async function callGeminiJson<T>(opts: {
  prompt: string;
  file?: GeminiInlineFile;
  schema?: unknown;
  model?: string;
}): Promise<T> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new Error("GEMINI_API_KEY tanımlı değil.");

  const model = opts.model ?? geminiModel();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const parts: unknown[] = [];
  if (opts.file) {
    parts.push({
      inline_data: { mime_type: opts.file.mimeType, data: opts.file.base64 },
    });
  }
  parts.push({ text: opts.prompt });

  const body = {
    contents: [{ role: "user", parts }],
    generationConfig: {
      temperature: 0,
      responseMimeType: "application/json",
      ...(opts.schema ? { responseSchema: opts.schema } : {}),
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(
      `Gemini isteği başarısız (${res.status}). ${detail.slice(0, 300)}`,
    );
  }

  const data = (await res.json()) as GeminiResponse;
  if (data.promptFeedback?.blockReason) {
    throw new Error(`Belge işlenemedi (engellendi: ${data.promptFeedback.blockReason}).`);
  }

  const text = data.candidates?.[0]?.content?.parts
    ?.map((p) => p.text ?? "")
    .join("")
    .trim();
  if (!text) throw new Error("Gemini boş yanıt döndü.");

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("Gemini yanıtı JSON olarak ayrıştırılamadı.");
  }
}
