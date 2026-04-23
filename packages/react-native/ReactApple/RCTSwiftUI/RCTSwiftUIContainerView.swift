/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// SwiftUI is intentionally not imported. Distributing this Swift target inside the
// React.framework dynamic library (BUILD_LIBRARY_FOR_DISTRIBUTION=YES) caused the linker
// to autolink Apple-internal SwiftUI sub-frameworks (SwiftUICore, UIUtilities, …) that
// reject third-party clients. The CSS-filter feature this class backed is gated behind
// the enableSwiftUIBasedFilters runtime flag, which defaults to false, so this stub
// simply passes the content view through unmodified.
import UIKit

@MainActor @objc public class RCTSwiftUIContainerView: NSObject {
  private var passthroughContentView: UIView?

  @objc public override init() {
    super.init()
  }

  @objc public func updateContentView(_ view: UIView) {
    passthroughContentView = view
  }

  @objc public func hostingView() -> UIView? {
    return passthroughContentView
  }

  @objc public func contentView() -> UIView? {
    return passthroughContentView
  }

  @objc public func updateBlurRadius(_ radius: NSNumber) {}

  @objc public func updateGrayscale(_ grayscale: NSNumber) {}

  @objc public func updateDropShadow(standardDeviation: NSNumber, x: NSNumber, y: NSNumber, color: UIColor) {}

  @objc public func updateSaturation(_ saturation: NSNumber) {}

  @objc public func updateContrast(_ contrast: NSNumber) {}

  @objc public func updateHueRotate(_ degrees: NSNumber) {}

  @objc public func updateLayout(withBounds bounds: CGRect) {
    passthroughContentView?.frame = bounds
  }

  @objc public func resetStyles() {}
}
