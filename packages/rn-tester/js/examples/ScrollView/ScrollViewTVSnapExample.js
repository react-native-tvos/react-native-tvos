/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

import type {RNTesterModuleExample} from '../../types/RNTesterTypes';

const React = require('react');
const {Dimensions, Pressable, ScrollView, Text, View} = require('react-native');

// All layout values are authored for a 1920-wide screen (1:1).
// On 4K (3840-wide) we scale 2×, on 960-wide (Android TV dp) we scale 0.5×, etc.
const scale = Dimensions.get('window').width / 1920;
const px = (v: number) => v * scale;

const COLORS = [
  '#E74C3C',
  '#3498DB',
  '#2ECC71',
  '#F39C12',
  '#9B59B6',
  '#1ABC9C',
  '#E67E22',
  '#2980B9',
  '#27AE60',
  '#C0392B',
];

// A focusable card component
const Card = ({
  label,
  width = 300,
  height = 180,
  colorIndex = 0,
}: {
  label: string,
  width?: number,
  height?: number,
  colorIndex?: number,
}) => {
  return (
    <Pressable
      style={({focused}) => [
        {
          borderRadius: px(12),
          justifyContent: 'center' as const,
          alignItems: 'center' as const,
          borderWidth: px(3),
          borderColor: 'transparent',
          width: px(width),
          height: px(height),
          backgroundColor: COLORS[colorIndex % COLORS.length],
        },
        focused && {borderColor: '#ffffff'},
      ]}>
      {({focused}) => (
        <Text
          style={[
            {
              fontSize: px(22),
              fontWeight: '600',
              color: 'rgba(255,255,255,0.8)',
            },
            focused && {color: '#ffffff'},
          ]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
};

// Section header
const SectionHeader = ({title}: {title: string}) => (
  <View style={{marginBottom: px(16)}}>
    <Text style={{fontSize: px(28), fontWeight: '600', color: '#e0e0e0'}}>
      {title}
    </Text>
  </View>
);

// Example 1: Horizontal scroll with snap align "start"
const HorizontalExample = ({align}: {align: 'start' | 'center' | 'end'}) => (
  <View>
    <SectionHeader title={`Horizontal — snapAlign: ${align}`} />
    <ScrollView
      horizontal
      scrollSnapType="mandatory"
      showsHorizontalScrollIndicator={false}>
      {Array.from({length: 15}, (_, i) => (
        <View key={i} scrollSnapAlign={align} style={{marginRight: px(20)}}>
          <Card
            label={`Item ${i + 1}`}
            width={280}
            height={160}
            colorIndex={i}
          />
        </View>
      ))}
    </ScrollView>
  </View>
);

// Example: Horizontal scroll with scrollPadding
const ScrollPaddingExample = () => (
  <View>
    <SectionHeader title="Horizontal — snapAlign: start, scrollPadding: 60" />
    <ScrollView
      horizontal
      scrollSnapType="mandatory"
      scrollPadding={px(60)}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{paddingVertical: px(4)}}>
      {Array.from({length: 15}, (_, i) => (
        <View key={i} scrollSnapAlign="start" style={{marginRight: px(20)}}>
          <Card
            label={`Item ${i + 1}`}
            width={280}
            height={160}
            colorIndex={i}
          />
        </View>
      ))}
    </ScrollView>
  </View>
);

// Example: Vertical scroll with snap align
const VerticalExample = ({align}: {align: 'start' | 'center' | 'end'}) => (
  <View>
    <SectionHeader title={`Vertical — snapAlign: ${align}`} />
    <ScrollView
      scrollSnapType="mandatory"
      showsVerticalScrollIndicator={false}
      style={{height: px(500)}}>
      {Array.from({length: 10}, (_, i) => (
        <View key={i} scrollSnapAlign={align} style={{marginBottom: px(16)}}>
          <Card
            label={`Row ${i + 1}`}
            width={600}
            height={120}
            colorIndex={i + 5}
          />
        </View>
      ))}
    </ScrollView>
  </View>
);

// Example 3: Nested — Vertical scroller with horizontal rows
const NestedExample = () => (
  <View>
    <SectionHeader title="Nested — Vertical + Horizontal" />
    <ScrollView
      scrollSnapType="mandatory"
      showsVerticalScrollIndicator={false}
      style={{height: px(500)}}
      contentContainerStyle={{gap: px(40)}}>
      <View scrollSnapAlign="start">
        <HorizontalExample align={'start'} />
      </View>
      <View scrollSnapAlign="start">
        <HorizontalExample align={'center'} />
      </View>
    </ScrollView>
  </View>
);

const ScrollViewTVSnapExample = (): any => {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#1a1a2e',
        paddingTop: px(60),
        paddingHorizontal: px(40),
      }}>
      <Text
        style={{
          fontSize: px(42),
          fontWeight: '700',
          color: '#ffffff',
          marginBottom: px(8),
        }}>
        Scroll Snap Type Demo
      </Text>

      <ScrollView
        scrollSnapType="mandatory"
        showsVerticalScrollIndicator={false}
        style={{flex: 1}}
        contentContainerStyle={{gap: px(40)}}>
        <View
          scrollSnapAlign="center"
          style={{flexDirection: 'row', gap: px(16)}}>
          <VerticalExample align={'start'} />
          <VerticalExample align={'center'} />
          <VerticalExample align={'end'} />
        </View>
        <View scrollSnapAlign="center">
          <HorizontalExample align={'start'} />
        </View>
        <View scrollSnapAlign="center">
          <HorizontalExample align={'center'} />
        </View>
        <View scrollSnapAlign="center">
          <HorizontalExample align={'end'} />
        </View>
        <View scrollSnapAlign="center">
          <ScrollPaddingExample />
        </View>
        <View scrollSnapAlign="center">
          <NestedExample />
        </View>
      </ScrollView>
    </View>
  );
};

exports.title = 'ScrollViewTVSnapExample';
exports.category = 'TV';
exports.description = 'Demonstrates scroll snap APIs on TV platforms';

exports.examples = [
  {
    title: 'Scroll snap example for TV',
    render(): React.MixedElement {
      return <ScrollViewTVSnapExample />;
    },
  },
] as Array<RNTesterModuleExample>;
