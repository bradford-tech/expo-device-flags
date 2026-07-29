import { createUnsupportedError } from '../errors';

describe('createUnsupportedError', () => {
  it('creates an Error with the unsupported code', () => {
    const error = createUnsupportedError();
    expect(error).toBeInstanceOf(Error);
    expect(error.code).toBe('ERR_DEVICE_CHECK_UNSUPPORTED');
  });

  it('explains that DeviceCheck is iOS-device-only', () => {
    expect(createUnsupportedError().message).toMatch(/iOS/);
  });
});
