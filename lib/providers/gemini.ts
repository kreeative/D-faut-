import { config } from '../config.ts';
import { TruncatedOutputError, type Judge, type JudgeRequest } from './types.ts';

/**
 * Gemini's `responseJsonSchema` takes standard JSON Schema, so the same schema
 * object used for Anthropic is passed straight through — there is no
 * translation layer to drift out of sync.
 */
export function createGeminiJudge(): Judge {
  if (!config.geminiApiKey) {
    throw new Error('GEMINI_API_KEY is not set. Get one free at aistudio.google.com/apikey.');
  }

  return {
    name: config.geminiModel,

    async judge(request: JudgeRequest): Promise<unknown> {
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });

      const response = await ai.models.generateContent({
        model: config.geminiModel,
        contents: request.user,
        config: {
          systemInstruction: request.system,
          maxOutputTokens: request.maxTokens,
          responseMimeType: 'application/json',
          responseJsonSchema: request.schema,
        },
      });

      const finish = response.candidates?.[0]?.finishReason;
      if (finish === 'MAX_TOKENS') throw new TruncatedOutputError('gemini');

      const text = response.text;
      if (!text) {
        // A blocked or empty candidate lands here. Naming the finish reason
        // makes the difference between "refused" and "misconfigured" obvious.
        throw new Error(`gemini returned no text (finishReason: ${finish ?? 'none'})`);
      }
      return JSON.parse(text);
    },
  };
}
