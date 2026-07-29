export type DeviceCheckEnvironment = 'development' | 'production';

export interface DeviceCheckClientConfig {
  /** Apple Developer Team ID; becomes the JWT `iss` claim. */
  teamId: string;
  /** Key ID of the DeviceCheck .p8 key; becomes the JWT header `kid`. */
  keyId: string;
  /** PEM contents of the .p8 file (PKCS#8 `PRIVATE KEY` block). */
  privateKey: string;
  /** Selects Apple's development or production base URL. */
  environment: DeviceCheckEnvironment;
  /** Injectable fetch, mainly for testing. Defaults to `globalThis.fetch`. */
  fetch?: typeof fetch;
}

export type QueryTwoBitsResult =
  { found: true; bit0: boolean; bit1: boolean; lastUpdateTime: string } | { found: false };

export interface DeviceCheckClient {
  /**
   * Reads the two bits. `{ found: false }` means Apple has never stored bits
   * for this device — a success case (e.g. "fresh device" in trial logic),
   * not an error.
   */
  queryTwoBits(deviceToken: string): Promise<QueryTwoBitsResult>;
  /** Sets one or both bits. Throws TypeError if neither bit is provided. */
  updateTwoBits(deviceToken: string, bits: { bit0?: boolean; bit1?: boolean }): Promise<void>;
  /** Confirms the token is valid for your team without touching the bits. */
  validateDeviceToken(deviceToken: string): Promise<void>;
}
