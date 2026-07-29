import mockNativeModule from '../ExpoDeviceFlagsModule';
import * as ExpoDeviceFlags from '../index';

jest.mock('../ExpoDeviceFlagsModule', () => ({
  __esModule: true,
  default: {
    isSupported: true,
    isSupportedAsync: jest.fn(async () => true),
    requestDeviceTokenAsync: jest.fn(async () => 'dGVzdC10b2tlbg=='),
  },
}));

describe('public API', () => {
  it('exposes isSupported from the native module', () => {
    expect(ExpoDeviceFlags.isSupported).toBe(true);
  });

  it('delegates isSupportedAsync to the native module', async () => {
    await expect(ExpoDeviceFlags.isSupportedAsync()).resolves.toBe(true);
    expect(mockNativeModule.isSupportedAsync).toHaveBeenCalledTimes(1);
  });

  it('resolves requestDeviceTokenAsync with the native base64 token', async () => {
    await expect(ExpoDeviceFlags.requestDeviceTokenAsync()).resolves.toBe('dGVzdC10b2tlbg==');
    expect(mockNativeModule.requestDeviceTokenAsync).toHaveBeenCalledTimes(1);
  });
});
