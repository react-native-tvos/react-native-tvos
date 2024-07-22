import {TVEventHandler} from 'react-native';

function testTVEventHandler(){
  TVEventHandler.addListener(event => {
    const eventType: string = event.eventType;
    // @ts-expect-error - eventType is a string not a boolean
    const eventType2: boolean = event.eventType;
    const x: number | undefined = event.body?.x;
    // @ts-expect-error - x is an optional number not a string
    const x2: string | undefined = event.body?.x;
  })?.remove();

  // @ts-expect-error - `enable` deprecated in favor of `addListener`
  TVEventHandler.enable();
  // @ts-expect-error - `disable` deprecated in favor of `addListener` subscription result
  TVEventHandler.disable();
}
