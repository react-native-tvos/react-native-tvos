/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

import type {RNTesterModuleExample} from '../../types/RNTesterTypes';

import * as React from 'react';
import {
  Animated,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const {useBackHandler} = require('../../../../react-native/Libraries/Utilities/useBackHandler');

// ---------------------------------------------------------------------------
// Theme
// ---------------------------------------------------------------------------

const C = {
  bg: '#0d1117',
  surface: '#161b22',
  surfaceHover: '#1f2937',
  border: '#30363d',
  borderBright: '#58a6ff',
  text: '#e6edf3',
  textMuted: '#8b949e',
  enabled: '#3fb950',
  disabled: '#6e7681',
  flash: '#f0e68c',
  logHandler: '#1a3326',
  logHandlerText: '#3fb950',
  logSystem: '#1a1a2e',
  logSystemText: '#8b949e',
  gate: '#58a6ff',
  gateInactive: '#6e7681',
  priority: '#e3b341',
  modal: '#1c2128',
};

const S = Platform.isTV && Platform.OS === 'ios' ? 1.6 : 1;

// ---------------------------------------------------------------------------
// HandlerCard
// ---------------------------------------------------------------------------

type HandlerCardProps = {
  name: string,
  index: number,
  total: number,
  enabled: boolean,
  flashing: boolean,
  onToggle: () => void,
};

const HandlerCard = ({
  name,
  index,
  total,
  enabled,
  flashing,
  onToggle,
}: HandlerCardProps) => {
  const anim = React.useRef(new Animated.Value(0)).current;
  const isTopOfStack = index === total - 1;

  React.useEffect(() => {
    if (flashing) {
      Animated.sequence([
        Animated.timing(anim, {toValue: 1, duration: 80, useNativeDriver: false}),
        Animated.timing(anim, {toValue: 0, duration: 500, useNativeDriver: false}),
      ]).start();
    }
  }, [flashing, anim]);

  const bgColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [C.surface, C.flash],
  });

  return (
    <Animated.View
      style={[
        styles.handlerCard,
        {backgroundColor: bgColor},
        enabled && isTopOfStack && styles.handlerCardTop,
      ]}>
      <View style={styles.handlerCardBody}>
        <View style={styles.handlerCardLeft}>
          <View style={styles.handlerNameRow}>
            <View
              style={[
                styles.statusDot,
                {backgroundColor: enabled ? C.enabled : C.disabled},
              ]}
            />
            <Text style={styles.handlerName}>{name}</Text>
          </View>
          <Text style={styles.handlerMeta}>
            {isTopOfStack && enabled
              ? '▲ WINS: registered last, called first'
              : index === 0 && !isTopOfStack
              ? '▼ FALLBACK: called if higher handlers pass'
              : enabled
              ? '↑ ACTIVE'
              : 'inactive (not counted in gate)'}
          </Text>
        </View>

        <Pressable
          style={({focused}) => [
            styles.toggleButton,
            enabled ? styles.toggleEnabled : styles.toggleDisabled,
            focused && styles.toggleFocused,
          ]}
          onPress={onToggle}>
          <Text style={styles.toggleText}>{enabled ? 'ENABLED' : 'DISABLED'}</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
};

// ---------------------------------------------------------------------------
// GateBadge
// ---------------------------------------------------------------------------

const GateBadge = ({activeCount}: {activeCount: number}) => {
  const active = activeCount > 0;
  return (
    <View
      style={[styles.gateBadge, active ? styles.gateBadgeActive : styles.gateBadgeInactive]}>
      <View
        style={[styles.gateDot, {backgroundColor: active ? C.gate : C.gateInactive}]}
      />
      <Text style={[styles.gateBadgeText, {color: active ? C.gate : C.gateInactive}]}>
        {active
          ? `ACTIVE: ${activeCount} handler${activeCount > 1 ? 's' : ''}`
          : 'INACTIVE: system handles'}
      </Text>
    </View>
  );
};

// ---------------------------------------------------------------------------
// EventLog
// ---------------------------------------------------------------------------

type LogEntry = {
  id: number,
  time: string,
  msg: string,
  type: 'handler' | 'info',
};

let _logId = 0;

const EventLog = ({entries}: {entries: Array<LogEntry>}) => (
  <ScrollView style={styles.logScroll} contentContainerStyle={styles.logContent}>
    {entries.length === 0 && (
      <Text style={styles.logEmpty}>
        Press Menu / Back on the remote to see events here.
      </Text>
    )}
    {entries.map(entry => (
      <View
        key={entry.id}
        style={[
          styles.logEntry,
          entry.type === 'handler' ? styles.logEntryHandler : styles.logEntryInfo,
        ]}>
        <Text style={styles.logTime}>{entry.time}</Text>
        <Text
          style={[
            styles.logMsg,
            {color: entry.type === 'handler' ? C.logHandlerText : C.textMuted},
          ]}>
          {entry.msg}
        </Text>
      </View>
    ))}
  </ScrollView>
);

// ---------------------------------------------------------------------------
// ModalOverlay
// ---------------------------------------------------------------------------

type ModalOverlayProps = {
  onClose: () => void,
  addLog: (msg: string) => void,
};

const ModalOverlay = ({onClose, addLog}: ModalOverlayProps) => {
  useBackHandler(() => {
    addLog('Modal handler closed the overlay');
    onClose();
    return true;
  });

  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.modalBg}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Modal Overlay</Text>
          <Text style={styles.modalBody}>
            This modal registered its own handler via{' '}
            <Text style={styles.code}>useBackHandler</Text>.
          </Text>
          <Text style={styles.modalBody}>
            Press Menu / Back to close.
          </Text>
          <Text style={styles.modalNote}>
            Note: on tvOS the modal lives in a separate UIWindow, so the
            gesture recognizer on RCTRootView may not fire here. This is a
            known limitation discussed in the proposal; see the{' '}
            <Text style={styles.code}>pressesBegan</Text> alternative.
          </Text>
          <Pressable
            style={({focused}) => [
              styles.closeButton,
              focused && styles.closeButtonFocused,
            ]}
            onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

// ---------------------------------------------------------------------------
// Main demo
// ---------------------------------------------------------------------------

const TVBackHandlerDemo = () => {
  const [aEnabled, setAEnabled] = React.useState(true);
  const [bEnabled, setBEnabled] = React.useState(false);
  const [modalVisible, setModalVisible] = React.useState(false);
  const [aFlash, setAFlash] = React.useState(false);
  const [bFlash, setBFlash] = React.useState(false);
  const [log, setLog] = React.useState<Array<LogEntry>>([]);

  const flash = (setter: (v: boolean) => void) => {
    setter(true);
    setTimeout(() => setter(false), 50);
  };

  const addLog = React.useCallback((msg: string, type?: 'handler' | 'info' = 'handler') => {
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    setLog(prev =>
      [{id: ++_logId, time, msg, type}, ...prev].slice(0, 20),
    );
  }, []);

  // Handler A: registered first, lower LIFO priority
  useBackHandler(
    React.useCallback(() => {
      addLog('Handler A handled the press');
      flash(setAFlash);
      return true;
    }, [addLog]),
    {enabled: aEnabled && !modalVisible},
  );

  // Handler B: registered second, higher LIFO priority
  useBackHandler(
    React.useCallback(() => {
      addLog('Handler B handled the press');
      flash(setBFlash);
      return true;
    }, [addLog]),
    {enabled: bEnabled && !modalVisible},
  );

  const activeCount =
    (aEnabled && !modalVisible ? 1 : 0) +
    (bEnabled && !modalVisible ? 1 : 0);

  if (!Platform.isTV) {
    return (
      <View style={styles.nonTV}>
        <Text style={styles.nonTVText}>This example is for TV platforms.</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* Left panel: controls */}
      <View style={styles.leftPanel}>
        <Text style={styles.panelTitle}>Handler Stack</Text>
        <Text style={styles.panelSubtitle}>
          LIFO: last registered is called first
        </Text>

        <GateBadge activeCount={activeCount} />

        <View style={styles.stackContainer}>
          {/* B is rendered second = higher in LIFO */}
          <HandlerCard
            name="Handler B"
            index={1}
            total={2}
            enabled={bEnabled && !modalVisible}
            flashing={bFlash}
            onToggle={() => setBEnabled(v => !v)}
          />
          <View style={styles.stackArrow}>
            <Text style={styles.stackArrowText}>↓ fallback</Text>
          </View>
          <HandlerCard
            name="Handler A"
            index={0}
            total={2}
            enabled={aEnabled && !modalVisible}
            flashing={aFlash}
            onToggle={() => setAEnabled(v => !v)}
          />
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionLabel}>MODAL TEST</Text>
        <Pressable
          style={({focused}) => [
            styles.modalButton,
            focused && styles.modalButtonFocused,
          ]}
          onPress={() => {
            addLog('Modal opened: modal handler now active', 'info');
            setModalVisible(true);
          }}>
          <Text style={styles.modalButtonText}>Open Modal Overlay</Text>
        </Pressable>
        <Text style={styles.modalHint}>
          Opens a modal with its own back handler.{'\n'}
          Demonstrates the UIWindow limitation on tvOS.
        </Text>
      </View>

      {/* Right panel: event log */}
      <View style={styles.rightPanel}>
        <View style={styles.logHeader}>
          <Text style={styles.panelTitle}>Event Log</Text>
          {log.length > 0 && (
            <Pressable
              style={({focused}) => [
                styles.clearButton,
                focused && styles.clearButtonFocused,
              ]}
              onPress={() => setLog([])}>
              <Text style={styles.clearButtonText}>Clear</Text>
            </Pressable>
          )}
        </View>
        <EventLog entries={log} />
      </View>

      {modalVisible && (
        <ModalOverlay
          onClose={() => {
            setModalVisible(false);
            addLog('Modal closed', 'info');
          }}
          addLog={addLog}
        />
      )}
    </View>
  );
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: C.bg,
    padding: 24 * S,
    gap: 24 * S,
  },
  leftPanel: {
    flex: 6,
  },
  rightPanel: {
    flex: 4,
    backgroundColor: C.surface,
    borderRadius: 12 * S,
    borderWidth: 1,
    borderColor: C.border,
    padding: 20 * S,
  },
  panelTitle: {
    fontSize: 18 * S,
    fontWeight: '700',
    color: C.text,
    marginBottom: 4 * S,
  },
  panelSubtitle: {
    fontSize: 12 * S,
    color: C.textMuted,
    marginBottom: 16 * S,
    fontStyle: 'italic',
  },
  // Gate badge
  gateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14 * S,
    paddingVertical: 8 * S,
    borderRadius: 8 * S,
    borderWidth: 1,
    marginBottom: 20 * S,
    gap: 8 * S,
  },
  gateBadgeActive: {
    borderColor: C.gate,
    backgroundColor: '#0d2035',
  },
  gateBadgeInactive: {
    borderColor: C.gateInactive,
    backgroundColor: '#1a1a1a',
  },
  gateDot: {
    width: 8 * S,
    height: 8 * S,
    borderRadius: 4 * S,
  },
  gateBadgeText: {
    fontSize: 13 * S,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  // Handler cards
  stackContainer: {
    gap: 0,
  },
  handlerCard: {
    borderRadius: 10 * S,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14 * S,
    marginBottom: 2 * S,
  },
  handlerCardTop: {
    borderColor: C.enabled,
    borderWidth: 1.5,
  },
  handlerCardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  handlerCardLeft: {
    flex: 1,
  },
  handlerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8 * S,
    marginBottom: 4 * S,
  },
  statusDot: {
    width: 10 * S,
    height: 10 * S,
    borderRadius: 5 * S,
  },
  handlerName: {
    fontSize: 16 * S,
    fontWeight: '600',
    color: C.text,
  },
  handlerMeta: {
    fontSize: 11 * S,
    color: C.textMuted,
    paddingLeft: 18 * S,
  },
  stackArrow: {
    alignItems: 'center',
    paddingVertical: 4 * S,
  },
  stackArrowText: {
    fontSize: 11 * S,
    color: C.textMuted,
  },
  // Toggle button
  toggleButton: {
    paddingHorizontal: 14 * S,
    paddingVertical: 8 * S,
    borderRadius: 6 * S,
    borderWidth: 1,
    minWidth: 90 * S,
    alignItems: 'center',
  },
  toggleEnabled: {
    borderColor: C.enabled,
    backgroundColor: '#1a3326',
  },
  toggleDisabled: {
    borderColor: C.border,
    backgroundColor: '#1a1a1a',
  },
  toggleFocused: {
    borderColor: C.text,
    backgroundColor: '#2d333b',
  },
  toggleText: {
    fontSize: 11 * S,
    fontWeight: '700',
    color: C.text,
    letterSpacing: 0.8,
  },
  // Divider
  divider: {
    height: 1,
    backgroundColor: C.border,
    marginVertical: 20 * S,
  },
  sectionLabel: {
    fontSize: 11 * S,
    fontWeight: '700',
    color: C.textMuted,
    letterSpacing: 1.2,
    marginBottom: 12 * S,
  },
  // Modal button
  modalButton: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8 * S,
    paddingVertical: 12 * S,
    paddingHorizontal: 16 * S,
    alignItems: 'center',
    marginBottom: 8 * S,
  },
  modalButtonFocused: {
    borderColor: C.borderBright,
    backgroundColor: C.surfaceHover,
  },
  modalButtonText: {
    fontSize: 14 * S,
    color: C.text,
    fontWeight: '600',
  },
  modalHint: {
    fontSize: 11 * S,
    color: C.textMuted,
    lineHeight: 16 * S,
  },
  // Log
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12 * S,
  },
  logScroll: {
    flex: 1,
  },
  logContent: {
    gap: 6 * S,
  },
  logEmpty: {
    fontSize: 13 * S,
    color: C.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 24 * S,
  },
  logEntry: {
    borderRadius: 6 * S,
    padding: 10 * S,
    borderLeftWidth: 3,
    borderColor: 'transparent',
  },
  logEntryHandler: {
    backgroundColor: C.logHandler,
    borderLeftColor: C.enabled,
  },
  logEntryInfo: {
    backgroundColor: '#1a1f2e',
    borderLeftColor: C.textMuted,
  },
  logTime: {
    fontSize: 10 * S,
    color: C.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    marginBottom: 2 * S,
  },
  logMsg: {
    fontSize: 12 * S,
    fontWeight: '500',
  },
  clearButton: {
    paddingHorizontal: 10 * S,
    paddingVertical: 4 * S,
    borderRadius: 4 * S,
    borderWidth: 1,
    borderColor: C.border,
  },
  clearButtonFocused: {
    borderColor: C.text,
    backgroundColor: C.surfaceHover,
  },
  clearButtonText: {
    fontSize: 11 * S,
    color: C.textMuted,
  },
  // Modal overlay
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCard: {
    backgroundColor: C.modal,
    borderRadius: 16 * S,
    borderWidth: 1,
    borderColor: C.border,
    padding: 32 * S,
    maxWidth: 600 * S,
    width: '50%',
    gap: 12 * S,
  },
  modalTitle: {
    fontSize: 22 * S,
    fontWeight: '700',
    color: C.text,
  },
  modalBody: {
    fontSize: 14 * S,
    color: C.text,
    lineHeight: 20 * S,
  },
  modalNote: {
    fontSize: 12 * S,
    color: C.textMuted,
    lineHeight: 18 * S,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 12 * S,
  },
  code: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    color: C.priority,
  },
  closeButton: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8 * S,
    paddingVertical: 12 * S,
    alignItems: 'center',
    marginTop: 8 * S,
  },
  closeButtonFocused: {
    borderColor: C.borderBright,
    backgroundColor: C.surfaceHover,
  },
  closeButtonText: {
    fontSize: 14 * S,
    fontWeight: '600',
    color: C.text,
  },
  // Non-TV fallback
  nonTV: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nonTVText: {
    fontSize: 16,
    color: '#666',
  },
});

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

exports.framework = 'React';
exports.title = 'useBackHandler';
exports.description =
  'Demonstrates the useBackHandler hook: reference-counted gate, LIFO ordering, enabled toggle, and modal handling.';
exports.examples = [
  {
    title: 'useBackHandler demo',
    render(): React.Node {
      return <TVBackHandlerDemo />;
    },
  },
] as Array<RNTesterModuleExample>;
