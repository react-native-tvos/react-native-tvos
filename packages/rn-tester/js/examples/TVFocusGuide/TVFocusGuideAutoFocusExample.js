/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const React = require('react');
const ReactNative = require('react-native');

import {useRNTesterTheme} from '../../components/RNTesterTheme';

const {
  View,
  StyleSheet,
  Pressable,
  Text: RNText,
  TVFocusGuideView,
  FlatList,
  ScrollView,
} = ReactNative;

exports.framework = 'React';
exports.title = 'TVFocusGuide autoFocus example';
exports.description = 'Focus guide autoFocus usage';
exports.displayName = 'TVFocusGuideAutoFocusExample';
exports.examples = [
  {
    title: 'TVFocusGuideAutoFocusExample',
    render(): React.Node {
      return <TVFocusGuideAutoFocusExample />;
    },
  },
];

// Set it to false to see the behavior without TVFocusGuide.
const FOCUS_GUIDE_ENABLED = true;

const screenHeight = ReactNative.Dimensions.get('window').height;
const scale = screenHeight / 1080;

const generateData = (length = 10, randomize = false) => {
  return Array.from({length}).map((item, index) => {
    if (randomize) {
      return Math.floor(Math.random() * 999);
    }

    return index;
  });
};

const TVFocusGuide = (props: any) => {
  if (!FOCUS_GUIDE_ENABLED) {
    return <View {...props} />;
  }

  return (
    <TVFocusGuideView
      {...props}
      autoFocus={props.autoFocus}
      destinations={props.destinations}
    />
  );
};

const Text = ({style, children}) => {
  const theme = useRNTesterTheme();
  return (
    <RNText style={[styles.text, {color: theme.LabelColor}, style]}>
      {children}
    </RNText>
  );
};

const FocusableBox = React.memo(({width, height, text, slow, ...props}) => {
  const theme = useRNTesterTheme();

  if (slow) {
    const now = performance.now();
    while (performance.now() - now < 200) {}
  }

  return (
    <Pressable
      {...props}
      style={state => [
        {
          width,
          height,
          backgroundColor: theme.TertiarySystemFillColor,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 4,
        },
        state.focused && {borderColor: theme.BorderColor, borderWidth: 4},
        props.style,
      ]}>
      {text !== undefined ? (
        <Text style={{fontSize: 24 * scale}}>{text}</Text>
      ) : null}
    </Pressable>
  );
});

const SideMenu = () => {
  const theme = useRNTesterTheme();
  const sideMenuItemStyle = [
    styles.sideMenuItem,
    {backgroundColor: theme.TertiarySystemFillColor},
  ];
  return (
    <TVFocusGuide autoFocus style={styles.sideMenuContainer}>
      <Text style={{fontSize: 18 * scale, marginBottom: 10 * scale}}>
        Side Menu
      </Text>

      <FocusableBox style={sideMenuItemStyle} />
      <FocusableBox style={sideMenuItemStyle} />
      <FocusableBox style={sideMenuItemStyle} />
      <FocusableBox style={sideMenuItemStyle} />
      <FocusableBox style={sideMenuItemStyle} />
    </TVFocusGuide>
  );
};

const getItemText = ({item, prefix}) => {
  return prefix ? `${prefix}-${item}` : `${item}`;
};

const HList = ({
  itemCount,
  itemWidth = 500 * scale,
  itemHeight = 120 * scale,
  onItemFocused,
  onItemPressed,
  prefix = '',
  slow,
  ...props
}) => {
  const listRef = React.useRef(null);

  const data = React.useMemo(() => generateData(itemCount), [itemCount]);

  const renderItem = ({item, index}) => {
    return (
      <FocusableBox
        width={itemWidth}
        height={itemHeight}
        style={styles.mr5}
        text={getItemText({prefix, item})}
        onFocus={onItemFocused}
        onPress={onItemPressed}
        slow={slow}
      />
    );
  };

  return (
    <FlatList
      keyExtractor={item => getItemText({prefix, item})}
      ref={listRef}
      data={data}
      renderItem={renderItem}
      horizontal
      contentContainerStyle={styles.hListContainer}
      {...props}
    />
  );
};

const categoryData = [1, 2, 3, 4, 5];
const getSelectedItemPrefix = selectedCategory => {
  if (selectedCategory === null) return 'Item';
  return `Category ${selectedCategory} - Item`;
};
const Row = ({title}) => {
  const [selectedCategory, setSelectedCategory] = React.useState('1');

  const onCategoryFocused = ({item}) => {
    setSelectedCategory(item);
  };

  return (
    <View style={styles.mb5}>
      <TVFocusGuide autoFocus style={styles.rowTop}>
        <Text style={styles.rowTitle}>{title}</Text>
        <HList
          prefix="Category"
          itemCount={5}
          data={categoryData}
          itemHeight={50 * scale}
          itemWidth={200 * scale}
          onItemFocused={onCategoryFocused}
        />
      </TVFocusGuide>
      <TVFocusGuide autoFocus style={styles.mb5}>
        <HList
          prefix={getSelectedItemPrefix(selectedCategory)}
          itemCount={10}
        />
      </TVFocusGuide>
    </View>
  );
};

const Col = ({title}) => {
  return (
    <TVFocusGuide autoFocus style={styles.col}>
      <Text style={styles.rowTitle}>{title}</Text>
      <FocusableBox text="0" style={styles.colItem} />
      <FocusableBox text="1" style={styles.colItem} />
      <FocusableBox text="2" style={styles.colItem} />
      <FocusableBox text="3" style={styles.colItem} />
    </TVFocusGuide>
  );
};

const RestoreFocusTestList = () => {
  const [randomize, setRandomize] = React.useState(false);
  const data = React.useMemo(() => generateData(10, randomize), [randomize]);
  /**
   * This is a test to make sure that the focus is restored
   * after the list is re-rendered and currently focused item is removed.
   *
   * We force the list to re-render by toggling the `randomize` state. It invalidates
   * the `data` and causes the list to re-render with random or regular data.
   */
  const onItemPressed = ({item}) => setRandomize(r => !r);
  return (
    <TVFocusGuide autoFocus style={styles.mb5}>
      <Text
        style={[
          styles.rowTitle,
          {marginLeft: 16 * scale, marginVertical: 16 * scale},
        ]}>
        Restore Focus Test
      </Text>
      <HList itemCount={10} data={data} onItemPressed={onItemPressed} />
    </TVFocusGuide>
  );
};

const SlowListFocusTest = () => {
  const data = React.useMemo(() => generateData(100), []);

  /**
   * This is a testing playground for virtualized lists with slow components.
   * Focus should be trapped inside the list until user reaches the end
   * or the beginning of the list.
   */

  return (
    <TVFocusGuide autoFocus style={styles.mb5}>
      <Text
        style={[
          styles.rowTitle,
          {marginLeft: 16 * scale, marginVertical: 16 * scale},
        ]}>
        Slow List Focus Test
      </Text>
      <View style={{flexDirection: 'row'}}>
        <FocusableBox text="LEFT" style={styles.slowListPlaceholderItem} />
        <View style={styles.slowList}>
          <HList
            data={data}
            slow
            initialNumToRender={4}
            windowSize={1}
            maxToRenderPerBatch={1}
            itemWidth={550 * scale}
          />
        </View>
        <FocusableBox text="RIGHT" style={styles.slowListPlaceholderItem} />
      </View>
    </TVFocusGuide>
  );
};

const ContentArea = () => {
  return (
    <TVFocusGuide autoFocus style={{flex: 1}}>
      <ScrollView>
        <Text style={styles.pageTitle}>
          Welcome to the TVFocusGuide autoFocus example!
        </Text>
        <RestoreFocusTestList />
        <SlowListFocusTest />
        <Row title="Category Example 1" />
        <Row title="Category Example 2" />

        <TVFocusGuide autoFocus style={styles.cols}>
          <Col title="Genres" />
          <Col title="Sub Genres" />
          <Col title="Year" />
        </TVFocusGuide>
      </ScrollView>
    </TVFocusGuide>
  );
};

const TVFocusGuideAutoFocusExample = () => {
  const theme = useRNTesterTheme();

  return (
    <View style={[styles.container, {backgroundColor: theme.BackgroundColor}]}>
      <SideMenu />
      <ContentArea />
    </View>
  );
};

const styles = StyleSheet.create({
  fill: {flex: 1},
  fillAndCenter: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  mb5: {marginBottom: 5 * scale},
  mr5: {marginRight: 5 * scale},
  text: {
    fontWeight: 'bold',
    fontSize: 18 * scale,
  },
  hListContainer: {paddingHorizontal: 16 * scale},
  col: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8 * scale,
  },
  rowTop: {
    flexDirection: 'row',
    marginVertical: 5 * scale,
    padding: 10 * scale,
    alignItems: 'center',
  },
  rowTitle: {marginRight: 10 * scale, fontSize: 24 * scale},
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  sideMenuContainer: {
    width: 100 * scale,
    alignItems: 'center',
  },
  sideMenuItem: {
    width: 80 * scale,
    height: 80 * scale,
    marginBottom: 6 * scale,
  },
  cols: {
    flexDirection: 'row',
    paddingHorizontal: 16 * scale,
  },
  colItem: {
    width: '100%',
    height: 100 * scale,
    marginBottom: 5 * scale,
  },
  pageTitle: {fontSize: 48 * scale, margin: 10 * scale},
  slowListPlaceholderItem: {
    width: 100 * scale,
  },
  slowList: {
    flex: 1,
    marginHorizontal: 8 * scale,
  },
});
