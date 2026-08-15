import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    window = UIWindow(frame: UIScreen.main.bounds)

    factory.startReactNative(
      withModuleName: "BusinessGrowNetwork",
      in: window,
      launchOptions: launchOptions
    )

    #if !targetEnvironment(simulator)
    if let window = window {
      AppDelegate.preventScreenCapture(of: window)
    }
    #endif

    return true
  }

  // iOS has no API to block screenshots/recording outright. The standard
  // workaround (used by banking apps) is to reparent the window's layer
  // under a secure-text-entry layer: iOS excludes secure layers from
  // screenshots, the app switcher snapshot, and screen recordings, so any
  // capture of the app shows a blank view instead of real content.
  //
  // This relies on window.layer already being hosted by the window server
  // (i.e. having a superlayer) so the reparenting below detaches
  // secureField's layer from window.layer first. On the Simulator that
  // precondition doesn't hold the same way it does on device, so the final
  // addSublayer(window.layer) below creates a cycle in the layer tree
  // (window -> secureLayer -> secureField -> window), sending UIKit's
  // safe-area pass into infinite recursion and crashing the app on launch.
  // Only run this on real devices; callers must gate with
  // #if !targetEnvironment(simulator).
  private static func preventScreenCapture(of window: UIWindow) {
    guard let windowSuperlayer = window.layer.superlayer else { return }

    let secureField = UITextField()
    secureField.isSecureTextEntry = true
    secureField.isUserInteractionEnabled = false
    secureField.borderStyle = .none

    window.addSubview(secureField)
    secureField.translatesAutoresizingMaskIntoConstraints = false
    NSLayoutConstraint.activate([
      secureField.centerXAnchor.constraint(equalTo: window.centerXAnchor),
      secureField.centerYAnchor.constraint(equalTo: window.centerYAnchor),
    ])
    windowSuperlayer.addSublayer(secureField.layer)

    guard let secureLayer = secureField.layer.sublayers?.first else { return }
    secureLayer.addSublayer(window.layer)
  }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
