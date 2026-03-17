import { spec } from 'prebid.js/dist/modules/openxBidAdapter';
import {
	type BidderSpec,
	registerBidder,
} from 'prebid.js/dist/src/adapters/bidderFactory';

const customSpec: BidderSpec<'openx'> = {
	...spec,
	aliases: ['oxd'],
};

registerBidder(customSpec);
