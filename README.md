# @bradford-tech/expo-device-flags

Persistent per-device flags that survive app reinstalls, backed by Apple
[DeviceCheck](https://developer.apple.com/documentation/devicecheck). This
module exposes the client half: generating the opaque device token. Your
backend exchanges that token with Apple's DeviceCheck server API to read and
write two per-device bits that persist across reinstalls.

> **The client cannot read or write the flags.** Only a server holding your
> DeviceCheck private key can query or update the two bits. The token this
> module produces carries no readable data on-device — it is only useful to
> your backend.

## How it fits together

```
┌────────────┐  requestDeviceTokenAsync()  ┌──────────────┐  ES256 JWT +   ┌───────┐
│  Your app  │ ──── base64 token ────────▶ │ Your backend │ ── token ────▶ │ Apple │
│ (this pkg) │                             │              │ ◀─ two bits ── │       │
└────────────┘                             └──────────────┘                └───────┘
```

1. The app calls `requestDeviceTokenAsync()` and sends the token to your
   backend over your own transport.
2. Your backend signs an ES256 JWT with its DeviceCheck key and calls Apple's
   `query_two_bits` / `update_two_bits` endpoints.
3. Apple stores two bits per device, per developer account — they survive app
   reinstalls and even device transfers.

A companion server-side package handling step 2 (JWT signing, endpoint
switching, Apple's error semantics) is planned separately.

## Installation

```sh
npx expo install @bradford-tech/expo-device-flags
```

No config plugin and no entitlements are required — `DCDevice` needs neither.
Requires a development build (not Expo Go).

## Usage

```ts
import {
  isSupported,
  requestDeviceTokenAsync,
} from '@bradford-tech/expo-device-flags';

if (isSupported) {
  const token = await requestDeviceTokenAsync();
  await fetch('https://api.example.com/device-flags', {
    method: 'POST',
    body: JSON.stringify({ deviceToken: token }),
  });
}
```

## API

### `isSupported: boolean`

Synchronous constant. `true` only on physical Apple devices (the module's
Apple target also covers macOS and tvOS app targets, where `DCDevice` works on
real hardware too).

### `isSupportedAsync(): Promise<boolean>`

Async support check; same value as `isSupported` on iOS. Exists so a future
Android implementation (Play Integrity device recall) can slot in without an
API change.

### `requestDeviceTokenAsync(): Promise<string>`

Resolves with the base64-encoded DeviceCheck token — the format Apple's server
API expects. Generate a fresh token for each server request; tokens are not
reusable identifiers.

Rejects with an `Error` whose `code` property is one of:

| Code | Meaning |
| --- | --- |
| `ERR_DEVICE_CHECK_UNSUPPORTED` | Not a physical iOS device (Android, web, simulator). |
| `ERR_DEVICE_CHECK_INVALID_INPUT` | DeviceCheck rejected the request as invalid. |
| `ERR_DEVICE_CHECK_SERVER_UNAVAILABLE` | Apple's servers are unreachable; retry later. |
| `ERR_DEVICE_CHECK_UNKNOWN` | Unknown system failure. |

`ERR_DEVICE_CHECK_INVALID_INPUT` is not expected in practice: `generateToken`
takes no caller-supplied input, so there is nothing for your code to fix if it
ever fires. It exists to mirror Apple's `DCError` cases one-to-one.

### `DeviceCheckErrorCode`

TypeScript string-literal union of the codes above.

## Platform support

| Platform | Supported |
| --- | --- |
| iOS (physical device) | ✅ |
| iOS simulator | ❌ (`isSupported` is `false`) |
| Android | ❌ (Play Integrity device recall planned) |
| Web | ❌ |

Unsupported platforms keep the same API shape: `isSupported` is `false` and
`requestDeviceTokenAsync()` rejects with `ERR_DEVICE_CHECK_UNSUPPORTED`.

## License

MIT
