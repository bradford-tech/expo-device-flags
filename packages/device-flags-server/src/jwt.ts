export function base64UrlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function base64UrlDecode(text: string): Uint8Array {
  const base64 = text.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function base64UrlEncodeJson(value: unknown): string {
  return base64UrlEncode(new TextEncoder().encode(JSON.stringify(value)));
}

/** Imports the PEM contents of a DeviceCheck .p8 key as a P-256 signing key. */
export async function importDeviceCheckKey(pem: string): Promise<CryptoKey> {
  const match = pem.match(/-----BEGIN PRIVATE KEY-----([\s\S]+?)-----END PRIVATE KEY-----/);
  if (!match) {
    throw new TypeError(
      'privateKey must be the PEM contents of a .p8 file (PKCS#8 "PRIVATE KEY" block)'
    );
  }
  const base64 = match[1].replace(/\s+/g, '');
  const der = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
  return crypto.subtle.importKey(
    'pkcs8',
    der.buffer as ArrayBuffer,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );
}

/**
 * Mints a DeviceCheck provider JWT (same construction as an APNs provider
 * token): ES256, header {alg, kid}, payload {iss, iat}. WebCrypto's ECDSA
 * output is already the raw r||s form JOSE requires — no DER conversion.
 */
export async function signDeviceCheckJwt(opts: {
  teamId: string;
  keyId: string;
  key: CryptoKey;
}): Promise<string> {
  const header = { alg: 'ES256', kid: opts.keyId };
  const payload = { iss: opts.teamId, iat: Math.floor(Date.now() / 1000) };
  const signingInput = `${base64UrlEncodeJson(header)}.${base64UrlEncodeJson(payload)}`;
  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    opts.key,
    new TextEncoder().encode(signingInput)
  );
  return `${signingInput}.${base64UrlEncode(new Uint8Array(signature))}`;
}
