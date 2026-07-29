import { beforeAll, describe, expect, it } from 'vitest';

import { generateTestKeyPem } from './helpers.js';
import { createDeviceCheckClient } from '../src/client.js';
import type { DeviceCheckClientConfig } from '../src/types.js';

let pem: string;

beforeAll(async () => {
  ({ pem } = await generateTestKeyPem());
});

function stubFetch(response: () => Response) {
  const calls: { url: string; init: RequestInit }[] = [];
  const impl = (async (url: unknown, init?: unknown) => {
    calls.push({ url: String(url), init: (init ?? {}) as RequestInit });
    return response();
  }) as typeof fetch;
  return { impl, calls };
}

function makeClient(fetchImpl: typeof fetch, overrides: Partial<DeviceCheckClientConfig> = {}) {
  return createDeviceCheckClient({
    teamId: 'TEAMID1234',
    keyId: 'KEYID12345',
    privateKey: pem,
    environment: 'development',
    fetch: fetchImpl,
    ...overrides,
  });
}

const queryOk = () =>
  new Response(JSON.stringify({ bit0: true, bit1: false, last_update_time: '2026-07' }), {
    status: 200,
  });

describe('createDeviceCheckClient config validation', () => {
  it.each([
    ['teamId', { teamId: '' }],
    ['keyId', { keyId: '' }],
    ['environment', { environment: 'staging' as never }],
  ])('throws TypeError for invalid %s', (_name, overrides) => {
    const { impl } = stubFetch(queryOk);
    expect(() => makeClient(impl, overrides)).toThrow(TypeError);
  });

  it('throws TypeError for a privateKey without a PEM block', () => {
    const { impl } = stubFetch(queryOk);
    expect(() => makeClient(impl, { privateKey: 'nope' })).toThrow(TypeError);
  });
});

describe('queryTwoBits', () => {
  it('POSTs to the development query endpoint with auth and payload', async () => {
    const { impl, calls } = stubFetch(queryOk);
    await makeClient(impl).queryTwoBits('dGVzdA==');
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe('https://api.development.devicecheck.apple.com/v1/query_two_bits');
    expect(calls[0].init.method).toBe('POST');
    const headers = calls[0].init.headers as Record<string, string>;
    expect(headers.Authorization).toMatch(/^Bearer [\w-]+\.[\w-]+\.[\w-]+$/);
    expect(headers['Content-Type']).toBe('application/json');
    const body = JSON.parse(String(calls[0].init.body));
    expect(body.device_token).toBe('dGVzdA==');
    expect(body.transaction_id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    );
    expect(body.timestamp).toBeGreaterThan(Date.now() - 10_000);
    expect(body.timestamp).toBeLessThanOrEqual(Date.now());
  });

  it('uses the production base URL when configured', async () => {
    const { impl, calls } = stubFetch(queryOk);
    await makeClient(impl, { environment: 'production' }).queryTwoBits('dGVzdA==');
    expect(calls[0].url).toBe('https://api.devicecheck.apple.com/v1/query_two_bits');
  });

  it('maps a bits response to found: true with camelCase fields', async () => {
    const { impl } = stubFetch(queryOk);
    await expect(makeClient(impl).queryTwoBits('dGVzdA==')).resolves.toEqual({
      found: true,
      bit0: true,
      bit1: false,
      lastUpdateTime: '2026-07',
    });
  });

  it('maps a 200 "bit state not found" text body to found: false', async () => {
    const { impl } = stubFetch(() => new Response('Failed to find bit state', { status: 200 }));
    await expect(makeClient(impl).queryTwoBits('dGVzdA==')).resolves.toEqual({
      found: false,
    });
  });

  it('rejects with a mapped DeviceCheckServerError on Apple errors', async () => {
    const { impl } = stubFetch(() => new Response('Bad Device Token', { status: 400 }));
    await expect(makeClient(impl).queryTwoBits('dGVzdA==')).rejects.toMatchObject({
      name: 'DeviceCheckServerError',
      code: 'ERR_BAD_DEVICE_TOKEN',
      status: 400,
    });
  });

  it('rejects device tokens containing line breaks with TypeError', async () => {
    const { impl } = stubFetch(queryOk);
    await expect(makeClient(impl).queryTwoBits('bad\ntoken')).rejects.toThrow(TypeError);
  });

  it('rejects empty device tokens with TypeError', async () => {
    const { impl } = stubFetch(queryOk);
    await expect(makeClient(impl).queryTwoBits('')).rejects.toThrow(TypeError);
  });
});
