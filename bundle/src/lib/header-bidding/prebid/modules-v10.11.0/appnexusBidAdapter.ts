import { registerBidder } from 'prebid-v10.11.0.js/adapters/bidderFactory';
import { spec } from 'prebid-v10.11.0.js/modules/appnexusBidAdapter';

const customSpec = {
	...spec,
	aliases: [...spec.aliases, { code: 'and' }, { code: 'xhb' }],
};

registerBidder(customSpec);
