/**
 * @format
 * @flow
 */

'use strict';

const TVMenuBridge = require('NativeModules').TVMenuBridge;

module.exports = {
  enableTVMenuKey: () => {
    TVMenuBridge && TVMenuBridge.enableTVMenuKey();
  },
  disableTVMenuKey: () => {
    TVMenuBridge && TVMenuBridge.disableTVMenuKey();
  },
};
