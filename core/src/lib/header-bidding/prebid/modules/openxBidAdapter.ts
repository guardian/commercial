import { registerBidder } from 'prebid.js/adapters/bidderFactory';
import { spec } from 'prebid.js/modules/openxBidAdapter';

const customSpec = {
	...spec,
	aliases: ['oxd'],
};

registerBidder(customSpec);
