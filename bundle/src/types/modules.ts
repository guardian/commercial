declare module '*.svg' {
	const content: string;
	export default content;
}

declare module 'prebid.js/dist/modules/openxBidAdapter' {
	import type { BidderSpec } from 'prebid.js/dist/src/adapters/bidderFactory';

	const spec: BidderSpec<'openx'>;

	export { spec };
}

declare module 'prebid.js/dist/modules/appnexusBidAdapter' {
	import type { BidderSpec } from 'prebid.js/dist/src/adapters/bidderFactory';

	const spec: BidderSpec<'appnexus'>;

	export { spec };
}
