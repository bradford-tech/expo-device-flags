import { registerWebModule, NativeModule } from 'expo';

// ExpoDeviceFlagsModule is not available on the web platform.
class ExpoDeviceFlagsModule extends NativeModule<{}> {}

export default registerWebModule(ExpoDeviceFlagsModule, 'ExpoDeviceFlagsModule');
