import { NativeModule, registerWebModule } from 'expo';

import { createUnsupportedError } from './errors';

// DeviceCheck does not exist on the web platform; every member reports
// unsupported so consumers get the same API shape everywhere.
class ExpoDeviceFlagsModule extends NativeModule {
  isSupported = false;

  async isSupportedAsync(): Promise<boolean> {
    return false;
  }

  async requestDeviceTokenAsync(): Promise<string> {
    throw createUnsupportedError();
  }
}

export default registerWebModule(ExpoDeviceFlagsModule, 'ExpoDeviceFlagsModule');
