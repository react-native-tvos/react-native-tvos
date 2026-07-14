/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {RNTesterModuleExample} from '../../types/RNTesterTypes';

import RNTesterText from '../../components/RNTesterText';
import * as React from 'react';
import {useState} from 'react';
import {Pressable, StyleSheet, TVFocusGuideView, View} from 'react-native';

const ROWS = ['Row 1', 'Row 2', 'Row 3'];

const Row = ({label}: {label: string}): React.Node => (
  <Pressable
    focusable={true}
    style={({focused}) => [styles.rowInner, focused && styles.rowInnerFocused]}>
    <RNTesterText style={styles.rowText}>{label}</RNTesterText>
  </Pressable>
);

const Group = ({title}: {title: string}): React.Node => {
  // Bubbled onFocus/onBlur: fire for every descendant, on every d-pad move.
  const [bubbledFocus, setBubbledFocus] = useState(0);
  const [bubbledBlur, setBubbledBlur] = useState(0);

  // Enter/leave: fire once when focus crosses the group boundary.
  const [entered, setEntered] = useState(false);
  const [enters, setEnters] = useState(0);
  const [leaves, setLeaves] = useState(0);

  return (
    <TVFocusGuideView
      style={[styles.group, entered && styles.groupEntered]}
      onFocus={() => setBubbledFocus(c => c + 1)}
      onBlur={() => setBubbledBlur(c => c + 1)}
      onFocusEnter={() => {
        setEntered(true);
        setEnters(c => c + 1);
      }}
      onFocusLeave={() => {
        setEntered(false);
        setLeaves(c => c + 1);
      }}>
      <RNTesterText style={styles.groupTitle}>
        {title} — entered: {entered ? 'true' : 'false'}
      </RNTesterText>
      <RNTesterText style={styles.stat}>
        enter/leave: enter {enters} / leave {leaves}
      </RNTesterText>
      <RNTesterText style={styles.stat}>
        bubbled: onFocus {bubbledFocus} / onBlur {bubbledBlur}
      </RNTesterText>
      <View style={styles.rows}>
        {ROWS.map(label => (
          <Row key={label} label={label} />
        ))}
      </View>
    </TVFocusGuideView>
  );
};

const FocusEnterLeaveExample = (): React.Node => (
  <View style={styles.container}>
    <RNTesterText style={styles.intro}>
      Move focus across the rows inside one group: the bubbled onFocus/onBlur
      counters climb on every move, while onFocusEnter fires once. Move to the
      other group to see onFocusLeave fire once on the way out.
    </RNTesterText>
    <Group title="Group A" />
    <Group title="Group B" />
  </View>
);

const styles = StyleSheet.create({
  container: {
    padding: 8,
    rowGap: 16,
  },
  intro: {
    paddingBottom: 8,
  },
  group: {
    borderColor: 'transparent',
    borderRadius: 8,
    borderWidth: 2,
    padding: 8,
    rowGap: 4,
  },
  groupEntered: {
    borderColor: 'blue',
  },
  groupTitle: {
    fontSize: 18,
  },
  stat: {
    color: '#666',
  },
  rows: {
    flexDirection: 'row',
    columnGap: 8,
    marginTop: 8,
  },
  rowInner: {
    backgroundColor: '#424B54',
    borderColor: 'transparent',
    borderRadius: 8,
    borderWidth: 2,
    flexGrow: 1,
    height: 60,
    justifyContent: 'center',
    padding: 4,
  },
  rowInnerFocused: {
    borderColor: 'white',
  },
  rowText: {
    color: 'white',
    textAlign: 'center',
  },
});

export default {
  title: 'Focus Enter / Leave (onFocusEnter / onFocusLeave)',
  description:
    'onFocusEnter/onFocusLeave fire once when focus crosses a subtree boundary, unlike the bubbled onFocus/onBlur.',
  examples: [
    {
      title: 'Focus Enter / Leave',
      render: function (): React.Node {
        return <FocusEnterLeaveExample />;
      },
    },
  ] as Array<RNTesterModuleExample>,
};
