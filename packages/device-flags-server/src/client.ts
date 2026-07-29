import { mapResponseToError } from './errors.js';
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
    return fetchImpl(`${BASE_URLS[environment]}${path}`, {
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
  }

  return {
    async queryTwoBits(deviceToken: string): Promise<QueryTwoBitsResult> {
      const response = await post('/v1/query_two_bits', deviceToken);
      const body = await response.text();
      if (!response.ok) {
        throw mapResponseToError(response.status, body);
      }
      // A 200 with a non-JSON body ("Bit State Not Found" / "Failed to find
      // bit state") means Apple has never stored bits for this device — a
      // success case, not an error.
      try {
        const parsed = JSON.parse(body) as {
          bit0: boolean;
          bit1: boolean;
          last_update_time: string;
        };
        return {
          found: true,
          bit0: parsed.bit0,
          bit1: parsed.bit1,
          lastUpdateTime: parsed.last_update_time,
        };
      } catch {
        return { found: false };
      }
    },

    async updateTwoBits(): Promise<void> {
      throw new Error('not implemented'); // Task 4
    },

    async validateDeviceToken(): Promise<void> {
      throw new Error('not implemented'); // Task 4
    },
  };
}
