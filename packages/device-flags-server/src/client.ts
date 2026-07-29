import { DeviceCheckServerError, mapResponseToError } from './errors.js';
import { importDeviceCheckKey, signDeviceCheckJwt } from './jwt.js';
import type { DeviceCheckClient, DeviceCheckClientConfig, QueryTwoBitsResult } from './types.js';

const BASE_URLS = {
  development: 'https://api.development.devicecheck.apple.com',
  production: 'https://api.devicecheck.apple.com',
} as const;

function assertDeviceToken(deviceToken: string): void {
  if (typeof deviceToken !== 'string' || deviceToken.length === 0) {
    throw new TypeError('deviceToken must be a non-empty string');
  }
  if (/[\r\n]/.test(deviceToken)) {
    throw new TypeError('deviceToken must not contain line breaks');
  }
}

export function createDeviceCheckClient(config: DeviceCheckClientConfig): DeviceCheckClient {
  const { teamId, keyId, privateKey, environment } = config;
  if (typeof teamId !== 'string' || teamId.length === 0) {
    throw new TypeError('teamId must be a non-empty string');
  }
  if (typeof keyId !== 'string' || keyId.length === 0) {
    throw new TypeError('keyId must be a non-empty string');
  }
  if (typeof privateKey !== 'string' || !privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
    throw new TypeError(
      'privateKey must be the PEM contents of a .p8 file (PKCS#8 "PRIVATE KEY" block)'
    );
  }
  if (environment !== 'development' && environment !== 'production') {
    throw new TypeError("environment must be 'development' or 'production'");
  }
  const fetchImpl = config.fetch ?? globalThis.fetch;

  // The CryptoKey import is async; do it once, lazily, and cache the promise.
  let keyPromise: Promise<CryptoKey> | undefined;
  const getKey = () => (keyPromise ??= importDeviceCheckKey(privateKey));

  async function post(
    path: string,
    deviceToken: string,
    extraFields: Record<string, boolean> = {}
  ): Promise<Response> {
    assertDeviceToken(deviceToken);
    const jwt = await signDeviceCheckJwt({ teamId, keyId, key: await getKey() });
    try {
      return await fetchImpl(`${BASE_URLS[environment]}${path}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${jwt}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          device_token: deviceToken,
          transaction_id: crypto.randomUUID(),
          timestamp: Date.now(),
          ...extraFields,
        }),
      });
    } catch (cause) {
      // Keep the "every failure is a DeviceCheckServerError" invariant:
      // transport-level failures (DNS, reset, timeout) are the most
      // retryable class and must be visible to consumers switching on code.
      throw new DeviceCheckServerError(
        'ERR_NETWORK',
        0,
        `Network request failed: ${String(cause)}`,
        {
          cause,
        }
      );
    }
  }

  return {
    async queryTwoBits(deviceToken: string): Promise<QueryTwoBitsResult> {
      const response = await post('/v1/query_two_bits', deviceToken);
      const body = await response.text();
      if (!response.ok) {
        throw mapResponseToError(response.status, body);
      }
      let parsed: unknown;
      try {
        parsed = JSON.parse(body);
      } catch {
        parsed = undefined;
      }
      if (
        typeof parsed === 'object' &&
        parsed !== null &&
        typeof (parsed as { bit0?: unknown }).bit0 === 'boolean' &&
        typeof (parsed as { bit1?: unknown }).bit1 === 'boolean' &&
        typeof (parsed as { last_update_time?: unknown }).last_update_time === 'string'
      ) {
        const bits = parsed as { bit0: boolean; bit1: boolean; last_update_time: string };
        return {
          found: true,
          bit0: bits.bit0,
          bit1: bits.bit1,
          lastUpdateTime: bits.last_update_time,
        };
      }
      // Apple signals "device never seen" with a 200 text body — documented
      // as "Bit State Not Found", observed as "Failed to find bit state".
      // This is a success case, not an error. Anything else on 200 is
      // response drift and must fail loud, not fall through to found: false
      // (which consumers treat as "grant a fresh trial").
      if (/bit state/i.test(body)) {
        return { found: false };
      }
      throw new DeviceCheckServerError('ERR_UNEXPECTED_RESPONSE', response.status, body);
    },

    async updateTwoBits(
      deviceToken: string,
      bits: { bit0?: boolean; bit1?: boolean }
    ): Promise<void> {
      if (bits.bit0 === undefined && bits.bit1 === undefined) {
        throw new TypeError('updateTwoBits requires at least one of bit0 or bit1');
      }
      const fields: Record<string, boolean> = {};
      if (bits.bit0 !== undefined) fields.bit0 = bits.bit0;
      if (bits.bit1 !== undefined) fields.bit1 = bits.bit1;
      const response = await post('/v1/update_two_bits', deviceToken, fields);
      if (!response.ok) {
        throw mapResponseToError(response.status, await response.text());
      }
    },

    async validateDeviceToken(deviceToken: string): Promise<void> {
      const response = await post('/v1/validate_device_token', deviceToken);
      if (!response.ok) {
        throw mapResponseToError(response.status, await response.text());
      }
    },
  };
}
