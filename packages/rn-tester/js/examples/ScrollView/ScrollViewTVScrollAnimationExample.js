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

const SectionHeader = ({title}: {title: string}) => (
  <View style={{marginBottom: px(16)}}>
    <Text style={{fontSize: px(28), fontWeight: '600', color: '#e0e0e0'}}>
      {title}
    </Text>
  </View>
);

const ScrollViewTVScrollAnimationExample = (): any => {
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
          marginBottom: px(32),
        }}>
        scrollAnimationEnabled Demo
      </Text>

      <View style={{gap: px(40)}}>
        <View>
          <SectionHeader title="Horizontal — scrollAnimationEnabled: false" />
          <ScrollView
            horizontal
            scrollAnimationEnabled={false}
            showsHorizontalScrollIndicator={false}>
            {Array.from({length: 15}, (_, i) => (
              <View key={i} style={{marginRight: px(20)}}>
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

        <View>
          <SectionHeader title="Vertical — scrollAnimationEnabled: false" />
          <ScrollView
            scrollAnimationEnabled={false}
            showsVerticalScrollIndicator={false}
            style={{height: px(500)}}>
            {Array.from({length: 10}, (_, i) => (
              <View key={i} style={{marginBottom: px(16)}}>
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
      </View>
    </View>
  );
};

exports.title = 'ScrollViewTVScrollAnimationExample';
exports.category = 'TV';
exports.description =
  'Demonstrates scrollAnimationEnabled prop on TV platforms';

exports.examples = [
  {
    title: 'scrollAnimationEnabled example for TV',
    render(): React.MixedElement {
      return <ScrollViewTVScrollAnimationExample />;
    },
  },
] as Array<RNTesterModuleExample>;
