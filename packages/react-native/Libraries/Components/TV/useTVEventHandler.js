/*
 * @flow
 */

import type {TVRemoteEvent} from '../../Types/CoreEventTypes';

import {type EventSubscription} from '../../vendor/emitter/EventEmitter';
import TVEventHandler from './TVEventHandler';
import * as React from 'react';


const useTVEventHandler = (handleEvent: (evt: TVRemoteEvent) => void) => {
  React.useEffect(() => {
    const subscription: EventSubscription = TVEventHandler.addListener(function(evt) {
      handleEvent(evt);
    });
    return () => {
      subscription.remove();
    };
  }, [handleEvent]);
};

export default useTVEventHandler;
