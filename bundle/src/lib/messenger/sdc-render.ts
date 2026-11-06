import { sdc } from '../header-bidding/sdc/sdc';
import type { RegisterListener } from '../messenger';

// If SDC wins the auction then the creative posts a message with type 'sdc-render'
const initSdcRenderMessage = (register: RegisterListener): void => {
	register('sdc-render', (event) => sdc.onCreativeRender(event));
};

export { initSdcRenderMessage };
