import { config } from '../config.ts';
import { RefusedError, TruncatedOutputError, type Judge, type JudgeRequest } from './types.ts';

export function createAnthropicJudge(): Judge {
  if (!config.anthropicApiKey) {
    throw new Error('ANTHROPIC_API_KEY is not set. Set it, or switch to AI_PROVIDER=gemini.');
  }

  return {
    name: config.model,

    async judge(request: JudgeRequest): Promise<unknown> {
      const { default: Anthropic } = await import('@anthropic-ai/sdk');
      const client = new Anthropic({ apiKey: config.anthropicApiKey });

      const response = await client.messages.create({
        model: config.model,
        max_tokens: request.maxTokens,
        // Adaptive thinking lets the model spend more reasoning on ambiguous
        // candidates and less on obvious ones, with no budget to tune.
        thinking: { type: 'adaptive' },
        output_config: {
          effort: config.effort,
          format: { type: 'json_schema', schema: request.schema },
        },
        system: [
          {
            type: 'text',
            text: request.system,
            // Byte-identical across every candidate in a run, so it is the
            // natural cache prefix.
            cache_control: { type: 'ephemeral' },
          },
        ],
        messages: [{ role: 'user', content: request.user }],
      } as any);

      if (response.stop_reason === 'refusal') throw new RefusedError('anthropic');
      if (response.stop_reason === 'max_tokens') throw new TruncatedOutputError('anthropic');

      // Adaptive thinking puts a thinking block ahead of the answer, so the
      // text block has to be selected rather than indexed.
      const blocks = response.content as Array<{ type: string; text?: string }>;
      const text = blocks.find((b) => b.type === 'text' && typeof b.text === 'string')?.text;
      if (!text) throw new Error('anthropic returned no text block');
      return JSON.parse(text);
    },
  };
}
