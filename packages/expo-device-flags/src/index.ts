import ExpoDeviceFlagsModule from './ExpoDeviceFlagsModule';

/**
 * Whether DeviceCheck token generation is available. `false` on Android, web,
 * and iOS simulators.
 */
export const isSupported: boolean = ExpoDeviceFlagsModule.isSupported;

/**
 * Async support check. Returns the same value as `isSupported` on iOS; exists
 * so a future Android implementation (Play Integrity availability) can slot in
 * without an API change.
 */
export function isSupportedAsync(): Promise<boolean> {
  return ExpoDeviceFlagsModule.isSupportedAsync();
}

/**
 * Generates a DeviceCheck token, resolved as a base64-encoded string — the
 * format Apple's server API expects. The token is opaque: it carries no
 * readable data on-device and is only useful to a backend that exchanges it
 * with Apple's DeviceCheck server API.
 *
 * Rejects with an `Error` whose `code` is a `DeviceCheckErrorCode`.
 */
export function requestDeviceTokenAsync(): Promise<string> {
  return ExpoDeviceFlagsModule.requestDeviceTokenAsync();
}

export * from './ExpoDeviceFlags.types';
