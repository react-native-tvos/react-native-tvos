/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import React from 'react';
import type {Node} from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  useColorScheme,
  useTVEventHandler,
  View,
} from 'react-native';
import Colors from './Colors';

const HermesBadge = (): Node => {
  const [lastEventType, setLastEventType] = React.useState('');
  const myTVEventHandler = evt => {
    setLastEventType(evt.eventType);
  };
  if (Platform.isTV) {
    useTVEventHandler(myTVEventHandler);
  }
  const isDarkMode = useColorScheme() === 'dark';
  const version =
    global.HermesInternal?.getRuntimeProperties?.()['OSS Release Version'] ??
    '';
  return (
    <View style={styles.badge}>
      {global.HermesInternal ? (
        <Text
          style={[
            styles.badgeText,
            {
              color: isDarkMode ? Colors.light : Colors.dark,
            },
          ]}>
          {`Engine: Hermes ${version}`}
        </Text>
      ) : null}
      {Platform.isTV ? (
        <Text
          style={[
            styles.badgeText,
            {
              color: isDarkMode ? Colors.light : Colors.dark,
            },
          ]}>
          TVEvent: {lastEventType}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: 8,
    right: 12,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },
});

export default HermesBadge;
