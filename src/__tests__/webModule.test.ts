jest.mock('expo', () => ({
  NativeModule: class {},
  registerWebModule: (moduleClass: any) => new moduleClass(),
}));

import WebModule from '../ExpoDeviceFlagsModule.web';

describe('web stub', () => {
  it('reports isSupported = false', () => {
    expect(WebModule.isSupported).toBe(false);
  });

  it('resolves isSupportedAsync with false', async () => {
    await expect(WebModule.isSupportedAsync()).resolves.toBe(false);
  });

  it('rejects requestDeviceTokenAsync with the unsupported code', async () => {
    await expect(WebModule.requestDeviceTokenAsync()).rejects.toMatchObject({
      code: 'ERR_DEVICE_CHECK_UNSUPPORTED',
    });
  });
});
