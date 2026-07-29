import type { DeviceCheckErrorCode } from './ExpoDeviceFlags.types';

/**
 * Error thrown by the non-iOS stubs. Mirrors the shape of native module
 * rejections: an `Error` with a stable `code` property.
 */
export class DeviceCheckError extends Error {
  code: DeviceCheckErrorCode;

  constructor(code: DeviceCheckErrorCode, message: string) {
    super(message);
    this.name = 'DeviceCheckError';
    this.code = code;
  }
}

/**
 * Rejection used by the non-iOS stubs. iOS produces the equivalent error
 * natively (see ios/ExpoDeviceFlagsModule.swift).
 */
export function createUnsupportedError(): DeviceCheckError {
  return new DeviceCheckError(
    'ERR_DEVICE_CHECK_UNSUPPORTED',
    'DeviceCheck is only available on physical iOS devices.'
  );
}
