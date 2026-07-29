package expo.modules.deviceflags

import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

// DeviceCheck is an Apple-only service. Every member reports unsupported so
// consumers get the same API shape everywhere. Play Integrity device recall
// is planned to slot in behind these signatures in v2.
class ExpoDeviceFlagsModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoDeviceFlags")

    Constant("isSupported") { false }

    AsyncFunction("isSupportedAsync") {
      return@AsyncFunction false
    }

    AsyncFunction("requestDeviceTokenAsync") { promise: Promise ->
      promise.reject(
        "ERR_DEVICE_CHECK_UNSUPPORTED",
        "DeviceCheck is only available on physical iOS devices.",
        null
      )
    }
  }
}
