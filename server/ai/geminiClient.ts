import { GoogleGenAI } from '@google/genai';

let aiClient: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY is not set. AI features will run in fallback simulation mode.');
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

export async function callGeminiWithFallback<T>(
  fn: (modelName: string) => Promise<T>,
  primaryModel = 'gemini-3.8-flash',
  fallbackModel = 'gemini-3.1-flash-lite'
): Promise<T> {
  try {
    return await fn(primaryModel);
  } catch (err: any) {
    const errorMsg = String(err?.message || err || '');
    const isTransientOrUnavailable =
      err?.status === 503 ||
      err?.code === 503 ||
      errorMsg.includes('503') ||
      errorMsg.includes('high demand') ||
      errorMsg.includes('UNAVAILABLE') ||
      err?.status === 429 ||
      err?.code === 429 ||
      errorMsg.includes('RESOURCE_EXHAUSTED');

    if (isTransientOrUnavailable && fallbackModel && fallbackModel !== primaryModel) {
      console.info(`[Gemini] ${primaryModel} busy or unavailable. Retrying with fallback model ${fallbackModel}...`);
      return await fn(fallbackModel);
    }
    throw err;
  }
}
