import { registerBidder } from 'prebid-v9.46.0.js/adapters/bidderFactory';
import { spec } from 'prebid-v9.46.0.js/modules/openxBidAdapter';

const customSpec = {
	...spec,
	aliases: ['oxd'],
};

registerBidder(customSpec);
