import { registerBidder } from 'prebid-v10.11.0.js/adapters/bidderFactory';
import { spec } from 'prebid-v10.11.0.js/modules/openxBidAdapter';

const customSpec = {
	...spec,
	aliases: ['oxd'],
};

registerBidder(customSpec);
