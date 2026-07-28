import { NativeModule, requireNativeModule } from 'expo';

declare class ExpoDeviceFlagsModule extends NativeModule<{}> {
  PI: number;
  hello(): string;
  setValueAsync(value: string): Promise<void>;
}

export default requireNativeModule<ExpoDeviceFlagsModule>('ExpoDeviceFlags');
