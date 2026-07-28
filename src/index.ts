// Reexport the native module. On web, it will be resolved to ExpoDeviceFlagsModule.web.ts
// and on native platforms to ExpoDeviceFlagsModule.ts
export { default } from './ExpoDeviceFlagsModule';
export * from './ExpoDeviceFlags.types';
