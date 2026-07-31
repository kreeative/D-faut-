import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveProvider } from '../lib/providers/index.ts';
import { outputSchema } from '../agents/market-scorer.ts';
import { AXES } from '../lib/types.ts';

function withEnv(vars: Record<string, string | undefined>, fn: () => void) {
  const saved: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(vars)) {
    saved[k] = process.env[k];
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  try {
    fn();
  } finally {
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
}

test('an explicit AI_PROVIDER always wins, even when the other key is present', () => {
  withEnv({ AI_PROVIDER: 'gemini', ANTHROPIC_API_KEY: 'sk-ant-x', GEMINI_API_KEY: undefined }, () => {
    assert.equal(resolveProvider(), 'gemini');
  });
  withEnv({ AI_PROVIDER: 'anthropic', GEMINI_API_KEY: 'g-x', ANTHROPIC_API_KEY: undefined }, () => {
    assert.equal(resolveProvider(), 'anthropic');
  });
});

test('AI_PROVIDER is case and whitespace tolerant', () => {
  withEnv({ AI_PROVIDER: '  GEMINI ' }, () => assert.equal(resolveProvider(), 'gemini'));
});

test('an unknown AI_PROVIDER fails loudly instead of silently defaulting', () => {
  withEnv({ AI_PROVIDER: 'openai' }, () => {
    assert.throws(() => resolveProvider(), /must be "anthropic" or "gemini"/);
  });
});

test('with only a Gemini key set, Gemini is chosen without configuration', () => {
  withEnv({ AI_PROVIDER: undefined, ANTHROPIC_API_KEY: undefined, GEMINI_API_KEY: 'g-x' }, () => {
    assert.equal(resolveProvider(), 'gemini');
  });
});

test('with both keys and no explicit choice, Anthropic wins deterministically', () => {
  withEnv({ AI_PROVIDER: undefined, ANTHROPIC_API_KEY: 'sk-ant-x', GEMINI_API_KEY: 'g-x' }, () => {
    assert.equal(resolveProvider(), 'anthropic');
  });
});

test('the shared schema is valid JSON Schema covering every rubric axis', () => {
  const schema = outputSchema() as {
    type: string;
    required: string[];
    additionalProperties: boolean;
    properties: { scores: { properties: Record<string, unknown>; required: string[] } };
  };

  assert.equal(schema.type, 'object');
  // Anthropic strict mode needs this; Gemini accepts it. One schema, both providers.
  assert.equal(schema.additionalProperties, false);
  assert.deepEqual(
    schema.required.sort(),
    ['one_line_offer', 'riskiest_assumption', 'scores'],
  );

  const axes = Object.keys(AXES).sort();
  assert.deepEqual(Object.keys(schema.properties.scores.properties).sort(), axes);
  assert.deepEqual(schema.properties.scores.required.sort(), axes);
});

test('the schema survives a JSON round trip, which is how both SDKs send it', () => {
  const schema = outputSchema();
  assert.deepEqual(JSON.parse(JSON.stringify(schema)), schema);
});
