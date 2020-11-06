// @flow
import React from 'react';
import TVEventHandler from './TVEventHandler';

const useTVEventHandler = (handleEvent: (evt: Event) => void) => {
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
