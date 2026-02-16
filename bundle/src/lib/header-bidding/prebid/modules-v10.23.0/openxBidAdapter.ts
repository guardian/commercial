import { spec } from 'prebid-v10.23.0.js/dist/modules/openxBidAdapter';
import {
	type BidderSpec,
	registerBidder,
} from 'prebid-v10.23.0.js/dist/src/adapters/bidderFactory';

const customSpec: BidderSpec<string> = {
	...spec,
	aliases: ['oxd'],
};

registerBidder(customSpec);
