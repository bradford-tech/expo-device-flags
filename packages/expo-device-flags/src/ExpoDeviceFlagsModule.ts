import { NativeModule, requireNativeModule } from 'expo';

declare class ExpoDeviceFlagsModule extends NativeModule {
  isSupported: boolean;
  isSupportedAsync(): Promise<boolean>;
  requestDeviceTokenAsync(): Promise<string>;
}

export default requireNativeModule<ExpoDeviceFlagsModule>('ExpoDeviceFlags');
