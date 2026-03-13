import { spec } from 'prebid.js/dist/modules/appnexusBidAdapter';
import {
	type BidderSpec,
	registerBidder,
} from 'prebid.js/dist/src/adapters/bidderFactory';

const customSpec: BidderSpec<'appnexus'> = {
	...spec,
	aliases: [...(spec.aliases ?? []), { code: 'and' }, { code: 'xhb' }],
};

registerBidder(customSpec);
