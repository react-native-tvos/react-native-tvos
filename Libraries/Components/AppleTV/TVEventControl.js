/**
 * Methods to enable and disable listening for Apple TV remote events (menu key, pan gesture)
 *
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
  enableTVPanGesture: () => {
    TVMenuBridge && TVMenuBridge.enableTVPanGesture();
  },
  disableTVPanGesture: () => {
    TVMenuBridge && TVMenuBridge.disableTVPanGesture();
  },
  addGestureRecognizers: () => {
    TVMenuBridge && TVMenuBridge.reinitializeTVRemote(1);
  },
  removeGestureRecognizers: () => {
    TVMenuBridge && TVMenuBridge.reinitializeTVRemote(0);
  },
  setPanStepFactor: (x, y) => {
    TVMenuBridge && TVMenuBridge.setPanStepFactor(x+"", y+"");
  }
};
