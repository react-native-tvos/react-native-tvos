/**
 * @format
 * @flow
 */

'use strict';

const TVMenuBridge = require('../../BatchedBridge/NativeModules').TVMenuBridge;

module.exports = {
  enableTVMenuKey: () => {
    TVMenuBridge && TVMenuBridge.enableTVMenuKey();
  },
  disableTVMenuKey: () => {
    TVMenuBridge && TVMenuBridge.disableTVMenuKey();
  },
};
