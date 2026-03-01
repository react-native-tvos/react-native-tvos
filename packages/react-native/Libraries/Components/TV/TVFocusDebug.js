/*
 * @flow strict-local
 */

import type {ViewStyleProp} from '../../StyleSheet/StyleSheet';

import NativeTVFocusDebug from '../../../src/private/specs_DEPRECATED/modules/NativeTVFocusDebug';
import NativeEventEmitter from '../../EventEmitter/NativeEventEmitter';
import StyleSheet from '../../StyleSheet/StyleSheet';
import Text from '../../Text/Text';
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

export type FocusDebugDirection =
  | 'up'
  | 'down'
  | 'left'
  | 'right'
  | 'forward'
  | 'backward'
  | 'unknown';

export type FocusDebugRequestFocusReason =
  | 'destinations'
  | 'destinationMissing'
  | 'autoFocusLastFocused'
  | 'autoFocusLastFocusedDetached'
  | 'autoFocusFirstFocusable'
  | 'superFallback';

export type FocusDebugRequestFocusStep = {
  index: number,
  depth: number,
  from: FocusDebugViewInfo,
  to: FocusDebugViewInfo | null,
  reason: FocusDebugRequestFocusReason,
  success: boolean,
};

export type FocusDebugRequestFocusTrace = {
  chainId: number,
  success: boolean,
  steps: FocusDebugRequestFocusStep[],
};

export type FocusDebugEvent = {
  eventType: 'focusSearch' | 'post' | 'requestFocus',
  timestamp: number,
  direction: FocusDebugDirection,
  currentlyFocused: FocusDebugViewInfo | null,
  nextFocused: FocusDebugViewInfo | null,
  allFocusables: FocusDebugViewInfo[],
  requestFocusTrace?: FocusDebugRequestFocusTrace,
};

export type FocusDebugPainterProps = {
  enabled?: boolean,
  showAllFocusables?: boolean,
  showCurrentlyFocused?: boolean,
  showNextFocused?: boolean,
  showFocusSearch?: boolean,
  showPost?: boolean,
  showRequestFocus?: boolean,
  showRequestFocusLabels?: boolean,
  onDidPaint?: (event: FocusDebugEvent) => void,
  style?: ?ViewStyleProp,
};

type FocusDebugPaintRole = 'allFocusables' | 'currentlyFocused' | 'nextFocused';
type OverlayOrigin = {
  x: number,
  y: number,
};
type OverlayPoint = {
  x: number,
  y: number,
};

const REQUEST_FOCUS_SUCCESS_COLOR = 'rgba(53, 206, 138, 0.95)';
const REQUEST_FOCUS_FAILURE_COLOR = 'rgba(255, 84, 84, 0.95)';

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

const getRequestFocusTraceKey = (
  trace: ?FocusDebugRequestFocusTrace,
): string => {
  if (trace == null) {
    return 'none';
  }

  const stepsKey = trace.steps
    .map(step =>
      [
        step.index,
        step.depth,
        step.from.tag,
        step.to?.tag ?? 'null',
        step.reason,
        step.success ? 1 : 0,
      ].join('-'),
    )
    .join('|');

  return `${trace.chainId}:${trace.success ? 1 : 0}:${stepsKey}`;
};

const getEventPaintKey = (event: FocusDebugEvent): string =>
  `${event.eventType}:${event.timestamp}:${event.direction}:` +
  `${event.currentlyFocused?.tag ?? 'null'}:${event.nextFocused?.tag ?? 'null'}:` +
  `${event.allFocusables.length}:${getRequestFocusTraceKey(event.requestFocusTrace)}`;

const shouldPaintEvent = (
  eventType: FocusDebugEvent['eventType'],
  showFocusSearch: boolean,
  showPost: boolean,
  showRequestFocus: boolean,
): boolean => {
  switch (eventType) {
    case 'focusSearch':
      return showFocusSearch;
    case 'post':
      return showPost;
    case 'requestFocus':
      return showRequestFocus;
    default:
      return true;
  }
};

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
        eventType === 'focusSearch' ? styles.focusSearchEventBox : null,
        getFrameStyle(viewInfo.frame, overlayOrigin),
      ]}
    />
  );
};

const getFrameCenter = (
  frame: FocusDebugViewInfo['frame'],
  overlayOrigin: OverlayOrigin,
): OverlayPoint => ({
  x: frame.x - overlayOrigin.x + frame.width / 2,
  y: frame.y - overlayOrigin.y + frame.height / 2,
});

const getEdgeAngle = (from: OverlayPoint, to: OverlayPoint): string =>
  `${(Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI}deg`;

const getEdgeStyle = (from: OverlayPoint, to: OverlayPoint) => {
  const distance = Math.max(Math.hypot(to.x - from.x, to.y - from.y), 1);
  const centerX = (from.x + to.x) / 2;
  const centerY = (from.y + to.y) / 2;

  return {
    left: centerX - distance / 2,
    top: centerY - 1,
    width: distance,
    transform: [{rotate: getEdgeAngle(from, to)}],
  };
};

const getArrowStyle = (to: OverlayPoint, from: OverlayPoint) => ({
  left: to.x - 6,
  top: to.y - 4,
  transform: [{rotate: getEdgeAngle(from, to)}],
});

const getReasonLabel = (reason: FocusDebugRequestFocusReason): string => {
  switch (reason) {
    case 'destinations':
      return 'dest';
    case 'destinationMissing':
      return 'missing';
    case 'autoFocusLastFocused':
      return 'auto:last';
    case 'autoFocusLastFocusedDetached':
      return 'auto:detached';
    case 'autoFocusFirstFocusable':
      return 'auto:first';
    case 'superFallback':
      return 'super';
    default:
      return reason;
  }
};

const getRequestFocusColor = (success: boolean): string =>
  success ? REQUEST_FOCUS_SUCCESS_COLOR : REQUEST_FOCUS_FAILURE_COLOR;

const renderRequestFocusTrace = (
  trace: ?FocusDebugRequestFocusTrace,
  overlayOrigin: OverlayOrigin,
  timestamp: number,
  showRequestFocusLabels: boolean,
): React.Node => {
  if (trace == null) {
    return null;
  }

  const output: React.Node[] = [];

  trace.steps.forEach(step => {
    if (!hasValidFrame(step.from.frame)) {
      return;
    }

    const color = getRequestFocusColor(step.success);
    const fromCenter = getFrameCenter(step.from.frame, overlayOrigin);
    const toCenter =
      step.to != null && hasValidFrame(step.to.frame)
        ? getFrameCenter(step.to.frame, overlayOrigin)
        : null;

    if (toCenter != null) {
      output.push(
        <View
          key={`request-focus-edge-${timestamp}-${step.index}`}
          style={[
            styles.requestFocusEdge,
            {backgroundColor: color},
            getEdgeStyle(fromCenter, toCenter),
          ]}
        />,
      );

      output.push(
        <View
          key={`request-focus-arrow-${timestamp}-${step.index}`}
          style={[
            styles.requestFocusArrow,
            {borderLeftColor: color},
            getArrowStyle(toCenter, fromCenter),
          ]}
        />,
      );

      if (showRequestFocusLabels) {
        const labelX = (fromCenter.x + toCenter.x) / 2 + 6;
        const labelY = (fromCenter.y + toCenter.y) / 2 + 6;
        output.push(
          <Text
            key={`request-focus-label-${timestamp}-${step.index}`}
            style={[styles.requestFocusLabel, {left: labelX, top: labelY, color}]}
            numberOfLines={1}>
            {`${step.index} ${getReasonLabel(step.reason)} ${
              step.success ? 'OK' : 'FAIL'
            }`}
          </Text>,
        );
      }
      return;
    }

    output.push(
      <View
        key={`request-focus-failure-badge-${timestamp}-${step.index}`}
        style={[
          styles.requestFocusFailureBadge,
          {
            left: fromCenter.x - 5,
            top: fromCenter.y - 5,
            backgroundColor: color,
          },
        ]}
      />,
    );

    if (showRequestFocusLabels) {
      output.push(
        <Text
          key={`request-focus-failure-label-${timestamp}-${step.index}`}
          style={[
            styles.requestFocusLabel,
            {
              left: fromCenter.x + 6,
              top: fromCenter.y + 6,
              color,
            },
          ]}
          numberOfLines={1}>
          {`${step.index} ${getReasonLabel(step.reason)} FAIL`}
        </Text>,
      );
    }
  });

  return output;
};

export function TVFocusDebugPainter({
  enabled = true,
  onDidPaint,
  showAllFocusables = true,
  showCurrentlyFocused = true,
  showNextFocused = true,
  showFocusSearch = true,
  showPost = false,
  showRequestFocus = true,
  showRequestFocusLabels = true,
  style,
}: FocusDebugPainterProps): React.Node {
  const [paintedEvent, setPaintedEvent] = React.useState<?FocusDebugEvent>(null);
  const [overlayOrigin, setOverlayOrigin] = React.useState<OverlayOrigin>({
    x: 0,
    y: 0,
  });
  const lastPaintedEventKeyRef = React.useRef<?string>(null);
  const overlayRef = React.useRef<?React.ElementRef<typeof View>>(null);

  const onFocusDebugEvent = React.useCallback(
    (event: FocusDebugEvent) => {
      if (
        !shouldPaintEvent(
          event.eventType,
          showFocusSearch,
          showPost,
          showRequestFocus,
        )
      ) {
        return;
      }
      setPaintedEvent(event);
    },
    [showFocusSearch, showPost, showRequestFocus],
  );

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

  const {
    allFocusables,
    currentlyFocused,
    eventType,
    nextFocused,
    requestFocusTrace,
    timestamp,
  } = paintedEvent;

  return (
    <View
      onLayout={measureOverlayOrigin}
      pointerEvents="none"
      ref={overlayRef}
      style={[styles.overlay, style]}>
      {eventType === 'requestFocus' && showRequestFocus
        ? renderRequestFocusTrace(
            requestFocusTrace,
            overlayOrigin,
            timestamp,
            showRequestFocusLabels,
          )
        : null}

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
  focusSearchEventBox: {
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
  requestFocusEdge: {
    position: 'absolute',
    height: 2,
  },
  requestFocusArrow: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderTopWidth: 4,
    borderBottomWidth: 4,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftWidth: 6,
  },
  requestFocusLabel: {
    position: 'absolute',
    backgroundColor: 'rgba(12, 12, 12, 0.75)',
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  requestFocusFailureBadge: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});

export default useFocusDebug;
