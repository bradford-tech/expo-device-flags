import { beforeAll, describe, expect, it } from 'vitest';

import { generateTestKeyPem } from './helpers.js';
import { base64UrlDecode, importDeviceCheckKey, signDeviceCheckJwt } from '../src/jwt.js';

let pem: string;
let publicKey: CryptoKey;

beforeAll(async () => {
  ({ pem, publicKey } = await generateTestKeyPem());
});

describe('signDeviceCheckJwt', () => {
  it('produces a three-part base64url compact JWT', async () => {
    const key = await importDeviceCheckKey(pem);
    const jwt = await signDeviceCheckJwt({ teamId: 'TEAMID1234', keyId: 'KEYID12345', key });
    expect(jwt).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/);
  });

  it('encodes the expected header and payload claims', async () => {
    const key = await importDeviceCheckKey(pem);
    const before = Math.floor(Date.now() / 1000);
    const jwt = await signDeviceCheckJwt({ teamId: 'TEAMID1234', keyId: 'KEYID12345', key });
    const [rawHeader, rawPayload] = jwt.split('.');
    const decode = (part: string) => JSON.parse(new TextDecoder().decode(base64UrlDecode(part)));
    expect(decode(rawHeader)).toEqual({ alg: 'ES256', kid: 'KEYID12345' });
    const payload = decode(rawPayload);
    expect(payload.iss).toBe('TEAMID1234');
    expect(payload.iat).toBeGreaterThanOrEqual(before);
    expect(payload.iat).toBeLessThanOrEqual(Math.floor(Date.now() / 1000));
  });

  it('signs with a signature the public key verifies (raw r||s, 64 bytes)', async () => {
    const key = await importDeviceCheckKey(pem);
    const jwt = await signDeviceCheckJwt({ teamId: 'TEAMID1234', keyId: 'KEYID12345', key });
    const [header, payload, signature] = jwt.split('.');
    const signatureBytes = base64UrlDecode(signature);
    expect(signatureBytes.length).toBe(64);
    const valid = await crypto.subtle.verify(
      { name: 'ECDSA', hash: 'SHA-256' },
      publicKey,
      signatureBytes,
      new TextEncoder().encode(`${header}.${payload}`)
    );
    expect(valid).toBe(true);
  });
});

describe('importDeviceCheckKey', () => {
  it('rejects input without a PEM private key block', async () => {
    await expect(importDeviceCheckKey('not a key')).rejects.toThrow(TypeError);
  });
});
