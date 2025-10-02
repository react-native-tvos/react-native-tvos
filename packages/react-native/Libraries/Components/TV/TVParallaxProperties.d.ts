export type TVParallaxProperties = {
  /**
   * If true, parallax effects are enabled.  Defaults to true.
   */
  enabled?: boolean | undefined,

  /**
   * Defaults to 2.0.
   */
  shiftDistanceX?: number | undefined,

  /**
   * Defaults to 2.0.
   */
  shiftDistanceY?: number | undefined,

  /**
   * Defaults to 0.05.
   */
  tiltAngle?: number | undefined,

  /**
   * Defaults to 1.0
   */
  magnification?: number | undefined,

  /**
   * Defaults to 1.0
   */
  pressMagnification?: number | undefined,

  /**
   * Defaults to 0.3
   */
  pressDuration?: number | undefined,

  /**
   * @deprecated No longer used
   */
  pressDelay?: number | undefined,
};

