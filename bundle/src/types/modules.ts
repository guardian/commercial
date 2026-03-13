declare module '*.svg' {
	const content: string;
	export default content;
}

declare module 'prebid.js' {
	const pbjs: {
		processQueue: () => void;
	};

	export default pbjs;
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

// declare module 'prebid.js/adapters/bidderFactory' {
// 	const registerBidder: (spec: unknown) => void;

// 	export { registerBidder };
// }

// declare module 'prebid.js/src/adapterManager.js' {
// 	interface AnalyticsAdapterRegistration {
// 		adapter: unknown;
// 		code: string;
// 	}

// 	const adapterManager: {
// 		registerAnalyticsAdapter: (
// 			registration: AnalyticsAdapterRegistration,
// 		) => void;
// 	};

// 	export default adapterManager;
// }

// declare module 'prebid.js/src/constants.js' {
// 	const EVENTS: {
// 		AUCTION_INIT: string;
// 		BID_REQUESTED: string;
// 		BID_RESPONSE: string;
// 		NO_BID: string;
// 		AUCTION_END: string;
// 		BID_WON: string;
// 		[key: string]: string;
// 	};

// 	export { EVENTS };
// }

// declare module 'prebid.js/src/utils.js' {
// 	const utils: {
// 		logError: (message: string) => void;
// 		[key: string]: unknown;
// 	};

// 	export { utils };
// }

// declare module 'prebid.js/src/ajax.js' {
// 	const prebidFetch: typeof fetch;
// 	export { prebidFetch as fetch };
// }

// version 10.23.0 specific modules

// define interfaces for prebid modules that don't have their own type definitions
// declare module 'prebid-v10.23.0.js/dist/modules/*' {
// 	type BidderSpec =
// 		import('prebid-v10.23.0.js/dist/src/adapters/bidderFactory').BidderSpec<string>;

// 	const spec: BidderSpec;

// 	export { spec };
// }
