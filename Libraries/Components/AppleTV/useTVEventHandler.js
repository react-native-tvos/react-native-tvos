import React from 'react';
import TVEventHandler from './TVEventHandler';

const useTVEventHandler = (ref: React.Node, handleEvent: (evt: Event) => void) => {
  React.useEffect(() => {
    const handler: TVEventHandler = new TVEventHandler();
    handler.enable(ref?.current, function(cmp, evt) {
        handleEvent(evt);
    });
    return () => {
      handler.disable();
    };
  }, [ref, handleEvent]);
};

module.exports = useTVEventHandler;
