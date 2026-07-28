package expo.modules.deviceflags

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ExpoDeviceFlagsModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoDeviceFlags")

    Constant("PI") {
      Math.PI
    }

    Function("hello") {
      "Hello world! 👋"
    }

    AsyncFunction("setValueAsync") { value: String ->
    }
  }
}
