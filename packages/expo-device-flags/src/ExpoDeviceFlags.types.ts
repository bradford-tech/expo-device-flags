/**
 * Error codes used when `requestDeviceTokenAsync` rejects. The rejection is an
 * `Error` whose `code` property is one of these values.
 */
export type DeviceCheckErrorCode =
  | 'ERR_DEVICE_CHECK_UNSUPPORTED'
  | 'ERR_DEVICE_CHECK_INVALID_INPUT'
  | 'ERR_DEVICE_CHECK_SERVER_UNAVAILABLE'
  | 'ERR_DEVICE_CHECK_UNKNOWN';
