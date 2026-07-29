# @bradford-tech/device-flags-server

Server half of the device-flags pair: authenticates to Apple's
[DeviceCheck server API](https://developer.apple.com/documentation/devicecheck/accessing-and-modifying-per-device-data)
with an ES256 JWT and exposes typed `query_two_bits` / `update_two_bits` /
`validate_device_token` calls. The client half —
[`@bradford-tech/expo-device-flags`](../expo-device-flags) — generates the
device tokens this package consumes.

Zero dependencies. Works on Node ≥ 20 and edge runtimes (Cloudflare Workers,
Vercel Edge, Deno, Bun) — WebCrypto and `fetch` only. ESM-only.

## Usage

```ts
import { createDeviceCheckClient } from '@bradford-tech/device-flags-server';

const client = createDeviceCheckClient({
  teamId: 'YOURTEAMID',           // Apple Developer Team ID
  keyId: 'YOURKEYID1',            // DeviceCheck key ID
  privateKey: process.env.DEVICECHECK_KEY!,  // PEM contents of the .p8
  environment: 'production',      // or 'development'
});

const state = await client.queryTwoBits(deviceTokenFromApp);
if (!state.found) {
  // Apple has never stored bits for this device — e.g. a fresh device
  // that hasn't used its trial. This is a success case, not an error.
  await client.updateTwoBits(deviceTokenFromApp, { bit0: true });
} else {
  console.log(state.bit0, state.bit1, state.lastUpdateTime); // "YYYY-MM"
}
```

## API

- `createDeviceCheckClient(config)` → `DeviceCheckClient`. Validates config
  eagerly (throws `TypeError`); imports the signing key lazily and caches it;
  mints a fresh JWT per request.
- `queryTwoBits(deviceToken)` → `{ found: true, bit0, bit1, lastUpdateTime }`
  or `{ found: false }` (device never seen).
- `updateTwoBits(deviceToken, { bit0?, bit1? })` — sets one or both bits;
  throws `TypeError` if neither is provided.
- `validateDeviceToken(deviceToken)` — confirms the token belongs to your
  team without touching the bits.

Failures reject with `DeviceCheckServerError` carrying `code`, `status`, and
`appleMessage`. The codes mirror Apple's response table, plus `ERR_NETWORK`
for transport-level failures (DNS, connection reset, timeout — `status` is
`0` and `cause` holds the underlying error) and `ERR_UNEXPECTED_RESPONSE`
for unrecognized responses. `ERR_NETWORK`, `ERR_TOO_MANY_REQUESTS`, and
`ERR_SERVICE_UNAVAILABLE` are the retryable ones; retry policy is
deliberately left to your infrastructure.

## Notes

- Device tokens are ephemeral: have the app send a fresh token per request
  (`requestDeviceTokenAsync()` in the client package).
- The two bits are stored by Apple per device + developer account and survive
  app reinstalls.
- Manual end-to-end check: `npm run test:integration` (see
  `scripts/integration.mjs` for the required `DC_*` env vars; writes are
  gated behind `DC_WRITE=1`).

## License

MIT
