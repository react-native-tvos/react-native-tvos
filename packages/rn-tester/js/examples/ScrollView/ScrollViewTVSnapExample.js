/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */



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
          alignItems: 'center' as const,
          backgroundColor: COLORS[colorIndex % COLORS.length],
          borderColor: 'transparent',
          borderRadius: px(12),
          borderWidth: px(3),
          height: px(height),
          justifyContent: 'center' as const,
          width: px(width),
        },
        focused && {borderColor: '#ffffff'},
      ]}>
      {({focused}) => (
        <Text
          style={[
            {
              color: 'rgba(255,255,255,0.8)',
              fontSize: px(22),
              fontWeight: '600',
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
    <Text style={{color: '#e0e0e0', fontSize: px(28), fontWeight: '600' }}>
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
      showsHorizontalScrollIndicator={false}
      snapToAlignment="item">
      {Array.from({length: 15}, (_, i) => (
        <View key={i} scrollSnapAlign={align} style={{marginRight: px(20)}}>
          <Card
            colorIndex={i}
            height={160}
            label={`Item ${i + 1}`}
            width={280}
          />
        </View>
      ))}
    </ScrollView>
  </View>
);

// Example: Per-item `scrollSnapOffset` — alternative to `scrollSnapAlign`.
// The focus engine lands the snap target's leading edge at `scrollSnapOffset`
// pixels from the viewport origin (top of this ScrollView). Mirrors the
// VerticalMixedExample varieties — same heights, but instead of strings
// 'start'/'center'/'end', uses fixed numeric offsets computed to land each
// row at the equivalent position. Demonstrates that `scrollSnapOffset` can
// reproduce alignment behaviour without `snapToItemPadding` and adds finer
// control: any pixel offset is valid, not just the three alignment buckets.
const OFFSET_VIEWPORT_HEIGHT = 500;
const offsetMixedHeight = (i: number): number =>
  [100, 200, 150, 50, 300][i % 5];
const offsetMixedAlignName = (i: number): string =>
  ['start', 'center', 'end'][i % 3];
const offsetMixedValue = (i: number): number => {
  const h = offsetMixedHeight(i);
  switch (i % 3) {
    case 0: // start
      return 0;
    case 1: // center
      return (OFFSET_VIEWPORT_HEIGHT - h) / 2;
    default: // end
      return OFFSET_VIEWPORT_HEIGHT - h;
  }
};

const VerticalOffsetExample = () => (
  <View>
    <SectionHeader title={`Vertical — per-item scrollSnapOffset (mixed)`} />
    <ScrollView
      showsVerticalScrollIndicator={false}
      snapToAlignment="item"
      style={{height: px(OFFSET_VIEWPORT_HEIGHT)}}>
      {Array.from({length: 10}, (_, i) => (
        <View
          key={i}
          scrollSnapOffset={px(offsetMixedValue(i))}
          style={{marginBottom: px(16)}}>
          <Card
            colorIndex={i + 5}
            height={offsetMixedHeight(i)}
            label={`Row ${i + 1} offset ${offsetMixedValue(i)} (≈ ${offsetMixedAlignName(i)})`}
            width={450}
          />
        </View>
      ))}
    </ScrollView>
  </View>
);

// Example: Horizontal scroll with snapToItemPadding
const ScrollPaddingExample = () => (
  <View>
    <SectionHeader title="Horizontal — snapAlign: start, snapToItemPadding: 60" />
    <ScrollView
      contentContainerStyle={{paddingVertical: px(4)}}
      horizontal
      showsHorizontalScrollIndicator={false}
      snapToAlignment="item"
      snapToItemPadding={px(60)}>
      {Array.from({length: 15}, (_, i) => (
        <View key={i} scrollSnapAlign="start" style={{marginRight: px(20)}}>
          <Card
            colorIndex={i}
            height={160}
            label={`Item ${i + 1}`}
            width={280}
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
      showsVerticalScrollIndicator={false}
      snapToAlignment="item"
      style={{height: px(500)}}>
      {Array.from({length: 10}, (_, i) => (
        <View key={i} scrollSnapAlign={align} style={{marginBottom: px(16)}}>
          <Card
            colorIndex={i + 5}
            height={120}
            label={`Row ${i + 1}`}
            width={400}
          />
        </View>
      ))}
    </ScrollView>
  </View>
);

const mixedItemAlignment = (i: number): any =>
  ['start', 'center', 'end'][i % 3];
const mixedItemHeight = (i: number) => [100, 200, 150, 50, 300][i % 5];

// Example: Vertical scroll with snap align, mixed heights and alignments
const VerticalMixedExample = () => (
  <View>
    <SectionHeader title={`Vertical — snapAlignMixed`} />
    <ScrollView
      showsVerticalScrollIndicator={false}
      snapToAlignment="item"
      style={{height: px(500)}}>
      {Array.from({length: 10}, (_, i) => (
        <View
          key={i}
          scrollSnapAlign={mixedItemAlignment(i)}
          style={{marginBottom: px(16)}}>
          <Card
            colorIndex={i + 5}
            height={mixedItemHeight(i)}
            label={`Row ${i + 1} align ${mixedItemAlignment(i)}`}
            width={450}
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
      contentContainerStyle={{gap: px(40)}}
      showsVerticalScrollIndicator={false}
      snapToAlignment="item"
      style={{height: px(500)}}>
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
        backgroundColor: '#1a1a2e',
        flex: 1,
        paddingHorizontal: px(40),
        paddingTop: px(60),
      }}>
      <Text
        style={{
          color: '#ffffff',
          fontSize: px(42),
          fontWeight: '700',
          marginBottom: px(8),
        }}>
        Scroll Snap Type Demo
      </Text>

      <ScrollView
        contentContainerStyle={{gap: px(40)}}
        showsVerticalScrollIndicator={false}
        snapToAlignment="item"
        style={{flex: 1}}>
        <View
          scrollSnapAlign="center"
          style={{flexDirection: 'row', gap: px(16)}}>
          <VerticalExample align={'start'} />
          <VerticalExample align={'center'} />
          <VerticalExample align={'end'} />
          <VerticalMixedExample />
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
          <VerticalOffsetExample />
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
