/*
 * @flow strict-local
 */

import type {ViewStyleProp} from '../../StyleSheet/StyleSheet';

import NativeTVFocusDebug from '../../../src/private/specs_DEPRECATED/modules/NativeTVFocusDebug';
import NativeEventEmitter from '../../EventEmitter/NativeEventEmitter';
import StyleSheet from '../../StyleSheet/StyleSheet';
import View from '../View/View';
import * as React from 'react';

export type FocusDebugViewInfo = {
  tag: number,
  viewName: string,
  testID?: string,
  frame: {x: number, y: number, width: number, height: number},
  focusProps: {
    focusable: boolean,
    hasTVPreferredFocus: boolean,
    trapFocusUp: boolean,
    trapFocusDown: boolean,
    trapFocusLeft: boolean,
    trapFocusRight: boolean,
    autoFocus: boolean,
  },
};

export type FocusDebugEvent = {
  eventType: 'pre' | 'post',
  timestamp: number,
  direction: 'up' | 'down' | 'left' | 'right' | 'forward' | 'backward' | 'unknown',
  currentlyFocused: FocusDebugViewInfo | null,
  nextFocused: FocusDebugViewInfo | null,
  allFocusables: FocusDebugViewInfo[],
};

export type FocusDebugPainterProps = {
  enabled?: boolean,
  showAllFocusables?: boolean,
  showCurrentlyFocused?: boolean,
  showNextFocused?: boolean,
  onDidPaint?: (event: FocusDebugEvent) => void,
  style?: ?ViewStyleProp,
};

type FocusDebugPaintRole = 'allFocusables' | 'currentlyFocused' | 'nextFocused';
type OverlayOrigin = {
  x: number,
  y: number,
};

const getFrameStyle = ({
  x,
  y,
  width,
  height,
}: FocusDebugViewInfo['frame'], overlayOrigin: OverlayOrigin) => ({
  left: x - overlayOrigin.x,
  top: y - overlayOrigin.y,
  width,
  height,
});

const hasValidFrame = ({x, y, width, height}: FocusDebugViewInfo['frame']) =>
  Number.isFinite(x) &&
  Number.isFinite(y) &&
  Number.isFinite(width) &&
  Number.isFinite(height) &&
  width > 0 &&
  height > 0;

const getEventPaintKey = (event: FocusDebugEvent): string =>
  `${event.eventType}:${event.timestamp}:${event.direction}:` +
  `${event.currentlyFocused?.tag ?? 'null'}:${event.nextFocused?.tag ?? 'null'}:` +
  `${event.allFocusables.length}`;

let activeFocusDebugSubscriptionCount = 0;

const useFocusDebug = (
  callback: (event: FocusDebugEvent) => void,
  enabled: boolean = true,
) => {
  React.useEffect(() => {
    if (!NativeTVFocusDebug || !enabled) {
      return;
    }

    if (activeFocusDebugSubscriptionCount === 0) {
      NativeTVFocusDebug.enable();
    }
    activeFocusDebugSubscriptionCount += 1;

    const emitter = new NativeEventEmitter(NativeTVFocusDebug);
    const subscription = emitter.addListener('onFocusDebugEvent', callback);
    return () => {
      subscription.remove();

      activeFocusDebugSubscriptionCount = Math.max(
        0,
        activeFocusDebugSubscriptionCount - 1,
      );
      if (activeFocusDebugSubscriptionCount === 0) {
        NativeTVFocusDebug.disable();
      }
    };
  }, [callback, enabled]);
};

const getRoleStyle = (
  role: FocusDebugPaintRole,
): $PropertyType<typeof styles, 'allFocusables'> => {
  switch (role) {
    case 'currentlyFocused':
      return styles.currentlyFocused;
    case 'nextFocused':
      return styles.nextFocused;
    case 'allFocusables':
    default:
      return styles.allFocusables;
  }
};

const renderFocusDebugBox = (
  role: FocusDebugPaintRole,
  eventType: FocusDebugEvent['eventType'],
  viewInfo: ?FocusDebugViewInfo,
  overlayOrigin: OverlayOrigin,
  key: string,
) => {
  if (viewInfo == null || !hasValidFrame(viewInfo.frame)) {
    return null;
  }

  return (
    <View
      key={key}
      style={[
        styles.box,
        getRoleStyle(role),
        eventType === 'pre' ? styles.preEventBox : null,
        getFrameStyle(viewInfo.frame, overlayOrigin),
      ]}
    />
  );
};

export function TVFocusDebugPainter({
  enabled = true,
  onDidPaint,
  showAllFocusables = true,
  showCurrentlyFocused = true,
  showNextFocused = true,
  style,
}: FocusDebugPainterProps): React.Node {
  const [paintedEvent, setPaintedEvent] = React.useState<?FocusDebugEvent>(null);
  const [overlayOrigin, setOverlayOrigin] = React.useState<OverlayOrigin>({
    x: 0,
    y: 0,
  });
  const lastPaintedEventKeyRef = React.useRef<?string>(null);
  const overlayRef = React.useRef<?React.ElementRef<typeof View>>(null);

  const onFocusDebugEvent = React.useCallback((event: FocusDebugEvent) => {
    setPaintedEvent(event);
  }, []);

  useFocusDebug(onFocusDebugEvent, enabled);

  const measureOverlayOrigin = React.useCallback(() => {
    const overlay = overlayRef.current;
    if (overlay == null || overlay.measureInWindow == null) {
      return;
    }

    overlay.measureInWindow((x, y) => {
      if (!Number.isFinite(x) || !Number.isFinite(y)) {
        return;
      }
      setOverlayOrigin(current =>
        current.x === x && current.y === y ? current : {x, y},
      );
    });
  }, []);

  React.useEffect(() => {
    if (enabled) {
      measureOverlayOrigin();
    }
  }, [enabled, measureOverlayOrigin]);

  React.useEffect(() => {
    if (!enabled) {
      setPaintedEvent(null);
      lastPaintedEventKeyRef.current = null;
    }
  }, [enabled]);

  React.useEffect(() => {
    if (!enabled || paintedEvent == null || onDidPaint == null) {
      return;
    }

    const eventKey = getEventPaintKey(paintedEvent);
    if (eventKey === lastPaintedEventKeyRef.current) {
      return;
    }

    lastPaintedEventKeyRef.current = eventKey;
    try {
      onDidPaint(paintedEvent);
    } finally {
      setPaintedEvent(null);
      lastPaintedEventKeyRef.current = null;
    }
  }, [enabled, onDidPaint, paintedEvent]);

  if (!enabled || paintedEvent == null) {
    return null;
  }

  const {allFocusables, currentlyFocused, eventType, nextFocused, timestamp} =
    paintedEvent;

  return (
    <View
      onLayout={measureOverlayOrigin}
      pointerEvents="none"
      ref={overlayRef}
      style={[styles.overlay, style]}>
      {showAllFocusables
        ? allFocusables.map((viewInfo, index) =>
            renderFocusDebugBox(
              'allFocusables',
              eventType,
              viewInfo,
              overlayOrigin,
              `all-${timestamp}-${viewInfo.tag}-${index}`,
            ),
          )
        : null}

      {showCurrentlyFocused
        ? renderFocusDebugBox(
            'currentlyFocused',
            eventType,
            currentlyFocused,
            overlayOrigin,
            `current-${timestamp}`,
          )
        : null}

      {showNextFocused
        ? renderFocusDebugBox(
            'nextFocused',
            eventType,
            nextFocused,
            overlayOrigin,
            `next-${timestamp}`,
          )
        : null}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  box: {
    position: 'absolute',
    borderWidth: 1,
  },
  preEventBox: {
    borderStyle: 'dashed',
  },
  allFocusables: {
    borderColor: 'rgba(35, 122, 255, 0.45)',
  },
  currentlyFocused: {
    borderColor: 'rgba(53, 206, 138, 0.95)',
    borderWidth: 3,
  },
  nextFocused: {
    borderColor: 'rgba(255, 170, 0, 0.95)',
    borderWidth: 3,
  },
});

export default useFocusDebug;
