import DeviceCheck
import ExpoModulesCore

public class ExpoDeviceFlagsModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoDeviceFlags")

    Constant("isSupported") {
      DCDevice.current.isSupported
    }

    AsyncFunction("isSupportedAsync") { () -> Bool in
      return DCDevice.current.isSupported
    }

    AsyncFunction("requestDeviceTokenAsync") { (promise: Promise) in
      guard DCDevice.current.isSupported else {
        promise.reject(DeviceCheckUnsupportedException())
        return
      }
      DCDevice.current.generateToken { data, error in
        if let error {
          promise.reject(Self.mapDCError(error))
        } else if let data {
          promise.resolve(data.base64EncodedString())
        } else {
          promise.reject(DeviceCheckUnknownException())
        }
      }
    }
  }

  private static func mapDCError(_ error: Error) -> Exception {
    switch (error as? DCError)?.code {
    case .featureUnsupported:
      return DeviceCheckUnsupportedException()
    case .invalidInput:
      return DeviceCheckInvalidInputException()
    case .serverUnavailable:
      return DeviceCheckServerUnavailableException()
    default:
      // Covers unknownSystemFailure, invalidKey (App Attest-only, mapped
      // defensively), non-DCError errors, and nil.
      return DeviceCheckUnknownException()
    }
  }
}

internal final class DeviceCheckUnsupportedException: Exception {
  override var code: String { "ERR_DEVICE_CHECK_UNSUPPORTED" }
  override var reason: String {
    "DeviceCheck is only available on physical iOS devices"
  }
}

internal final class DeviceCheckInvalidInputException: Exception {
  override var code: String { "ERR_DEVICE_CHECK_INVALID_INPUT" }
  override var reason: String { "DeviceCheck rejected the request as invalid" }
}

internal final class DeviceCheckServerUnavailableException: Exception {
  override var code: String { "ERR_DEVICE_CHECK_SERVER_UNAVAILABLE" }
  override var reason: String {
    "Apple's DeviceCheck servers are unavailable; try again later"
  }
}

internal final class DeviceCheckUnknownException: Exception {
  override var code: String { "ERR_DEVICE_CHECK_UNKNOWN" }
  override var reason: String { "DeviceCheck failed with an unknown system error" }
}
