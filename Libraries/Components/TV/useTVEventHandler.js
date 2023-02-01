// @flow
import React from 'react';
import TVEventHandler from './TVEventHandler';
import TVRemoteEvent from '../../Types/CoreEventTypes';

const useTVEventHandler = (handleEvent: (evt: TVRemoteEvent) => void) => {
  React.useEffect(() => {
    const handler: TVEventHandler = new TVEventHandler();
    handler.enable(null, function(cmp, evt) {
        handleEvent(evt);
    });
    return () => {
      handler.disable();
    };
  }, [handleEvent]);
};

module.exports = useTVEventHandler;
