import { spec } from 'prebid-v10.23.0.js/dist/modules/appnexusBidAdapter';
import {
	type BidderSpec,
	registerBidder,
} from 'prebid-v10.23.0.js/dist/src/adapters/bidderFactory';

const customSpec: BidderSpec<string> = {
	...spec,
	aliases: [...(spec.aliases ?? []), { code: 'and' }, { code: 'xhb' }],
};

registerBidder(customSpec);
