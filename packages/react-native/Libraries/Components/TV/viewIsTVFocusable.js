// @flow
import Platform from '../../Utilities/Platform';

export const viewIsTVFocusable = ({
  tvFocusable, // preferred
  focusable, // deprecated Android only
  isTVSelectable, // deprecated iOS only
  accessible,
}: {
  tvFocusable?: ?boolean,
  focusable?: ?boolean,
  isTVSelectable?: ?boolean,
  accessible?: ?boolean,
}): boolean => {
  Platform.select({
    ios: () => {
      return tvFocusable ?? isTVSelectable ?? accessible ?? false;
    },
    android: () => {
      return tvFocusable ?? focusable ?? accessible ?? false;
    },
  })();
};
