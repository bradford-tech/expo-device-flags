# device-flags

Persistent per-device flags that survive app reinstalls.

| Package | Status | Description |
| --- | --- | --- |
| [`@bradford-tech/expo-device-flags`](packages/expo-device-flags) | published | Expo module exposing Apple DeviceCheck token generation (the client half). |
| [`@bradford-tech/device-flags-server`](packages/device-flags-server) | in development | Server half: DeviceCheck JWT signing and two-bits query/update. |

See each package's README for usage. Releases are cut per package by
release-please; tags look like `expo-device-flags-v<version>`.

## Development

npm workspaces; run everything from the root:

```sh
npm install
npm test
npm run lint
npm run build
```

The example app lives at `packages/expo-device-flags/example` and is not a
workspace — run `npm install` inside it separately for native builds.
