import ExpoModulesCore

public class ExpoDeviceFlagsModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoDeviceFlags")

    Constant("PI") {
      Double.pi
    }

    Function("hello") {
      return "Hello world! 👋"
    }

    AsyncFunction("setValueAsync") { (value: String) in
    }
  }
}
