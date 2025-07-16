import { registerBidder } from 'prebid.js/adapters/bidderFactory';
import { spec } from 'prebid.js/modules/appnexusBidAdapter';

const customSpec = {
	...spec,
	aliases: [...spec.aliases, { code: 'and' }, { code: 'xhb' }],
};

registerBidder(customSpec);
