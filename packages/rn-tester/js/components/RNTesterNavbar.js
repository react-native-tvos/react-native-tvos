/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {ScreenTypes} from '../types/RNTesterTypes';
import type {RNTesterTheme} from './RNTesterTheme';

import {RNTesterThemeContext} from './RNTesterTheme';
import * as React from 'react';
import {useContext} from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  TVFocusGuideView,
  View,
} from 'react-native';

type NavBarOnPressHandler = ({screen: ScreenTypes}) => void;

/* $FlowFixMe[missing-local-annot] The type annotation(s) required by Flow's
 * LTI update could not be added via codemod */
const NavbarButton = ({
  testID,
  theme,
  isActive,
  activeImage,
  inactiveImage,
  label,
  handlePress,
  iconStyle,
}) => (
  <Pressable
    testID={testID}
    onPress={handlePress}
    style={[styles.navButton, {backgroundColor: theme.BackgroundColor}]}>
    {({focused}) => {
      return (
        <View
          style={[
            styles.pressableContent,
            focused ? styles.focusedBar : null,
            isActive ? styles.activeBar : null,
          ]}
          collapsable={false}>
          <Image
            style={iconStyle}
            source={isActive ? activeImage : inactiveImage}
          />
          <Text
            style={
              isActive
                ? theme.NavBarLabelActiveColor
                : theme.NavBarLabelInactiveColor
            }>
            {label}
          </Text>
        </View>
      );
    }}
  </Pressable>
);

const ComponentTab = ({
  isComponentActive,
  handleNavBarPress,
  theme,
}: $ReadOnly<{
  handleNavBarPress: NavBarOnPressHandler,
  isComponentActive: boolean,
  theme: RNTesterTheme,
}>) => (
  <NavbarButton
    testID="components-tab"
    label="Components"
    handlePress={() => handleNavBarPress({screen: 'components'})}
    activeImage={theme.NavBarComponentsActiveIcon}
    inactiveImage={theme.NavBarComponentsInactiveIcon}
    isActive={isComponentActive}
    theme={theme}
    iconStyle={styles.componentIcon}
  />
);

const PlaygroundTab = ({
  isComponentActive,
  handleNavBarPress,
  theme,
}: $ReadOnly<{
  handleNavBarPress: NavBarOnPressHandler,
  isComponentActive: boolean,
  theme: RNTesterTheme,
}>) => (
  <NavbarButton
    testID="playground-tab"
    label="Playground"
    handlePress={() => handleNavBarPress({screen: 'playgrounds'})}
    activeImage={theme.NavBarPlaygroundActiveIcon}
    inactiveImage={theme.NavBarPlaygroundInactiveIcon}
    isActive={isComponentActive}
    theme={theme}
    iconStyle={styles.componentIcon}
  />
);

const APITab = ({
  isAPIActive,
  handleNavBarPress,
  theme,
}: $ReadOnly<{
  handleNavBarPress: NavBarOnPressHandler,
  isAPIActive: boolean,
  theme: RNTesterTheme,
}>) => (
  <NavbarButton
    testID="apis-tab"
    label="APIs"
    handlePress={() => handleNavBarPress({screen: 'apis'})}
    activeImage={theme.NavBarComponentsActiveIcon}
    inactiveImage={theme.NavBarComponentsInactiveIcon}
    isActive={isAPIActive}
    theme={theme}
    iconStyle={styles.apiIcon}
  />
);

type Props = $ReadOnly<{
  handleNavBarPress: NavBarOnPressHandler,
  screen: string,
  isExamplePageOpen: boolean,
}>;

const RNTesterNavbar = ({
  handleNavBarPress,
  screen,
  isExamplePageOpen,
}: Props): React.Node => {
  const theme = useContext(RNTesterThemeContext);

  const isAPIActive = screen === 'apis' && !isExamplePageOpen;
  const isComponentActive = screen === 'components' && !isExamplePageOpen;
  const isPlaygroundActive = screen === 'playgrounds';

  return (
    <TVFocusGuideView autoFocus={true}>
      <View style={styles.buttonContainer}>
        <ComponentTab
          isComponentActive={isComponentActive}
          handleNavBarPress={handleNavBarPress}
          theme={theme}
        />
        <PlaygroundTab
          isComponentActive={isPlaygroundActive}
          handleNavBarPress={handleNavBarPress}
          theme={theme}
        />
        <APITab
          isAPIActive={isAPIActive}
          handleNavBarPress={handleNavBarPress}
          theme={theme}
        />
      </View>
    </TVFocusGuideView>
  );
};

export const navBarHeight = 65;

const styles = StyleSheet.create({
  buttonContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  componentIcon: {
    width: 20,
    height: 20,
    alignSelf: 'center',
  },
  apiIcon: {
    width: 30,
    height: 20,
    alignSelf: 'center',
  },
  activeText: {
    color: '#5E5F62',
  },
  inactiveText: {
    color: '#B1B4BA',
  },
  focusedBar: {
    backgroundColor: '#DDDDDD',
  },
  activeBar: {
    borderTopWidth: 2,
    borderColor: '#005DFF',
  },
  navButton: {
    flex: 1,
    height: navBarHeight,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 15,
  },
  pressableContent: {
    flex: 1,
    alignSelf: 'stretch',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default RNTesterNavbar;
