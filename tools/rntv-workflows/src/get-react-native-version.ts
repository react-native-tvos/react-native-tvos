'use strict';

import {
  getReactNativeVersion,
} from './common';

const executeScriptAsync = async function () {
  const reactNativeVersion = await getReactNativeVersion();
  console.log(`${reactNativeVersion}`);
};

executeScriptAsync();
