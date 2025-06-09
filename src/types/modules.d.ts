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

declare module 'prebid.js/modules/openxBidAdapter' {
	const spec: {
		aliases: string[];
	};

	export { spec };
}

declare module 'prebid.js/modules/appnexusBidAdapter' {
	const spec: {
		aliases: Array<{ code: string }>;
	};

	export { spec };
}

declare module 'prebid.js/adapters/bidderFactory' {
	const registerBidder: (spec: unknown) => void;

	export { registerBidder };
}

declare module 'prebid.js/src/cpmBucketManager' {
	type PrebidPriceGranularity = {
		buckets: Array<{
			precision?: number;
			max: number;
			increment: number;
		}>;
	};

	const getPriceBucketString: (
		cpm: number,
		priceBuckets: PrebidPriceGranularity,
	) => {
		custom: string;
	};

	export { getPriceBucketString };
	export type { PrebidPriceGranularity };
}

// Added type definitions for prebid.js analytics modules
declare module 'prebid.js/libraries/analyticsAdapter/AnalyticsAdapter.js' {
	// eslint-disable-next-line no-restricted-imports -- can't use relative imports in ambient declarations
	import type {
		AnalyticsAdapter,
		AnalyticsAdapterConfig,
	} from 'lib/header-bidding/prebid-types';

	function adapter(config: AnalyticsAdapterConfig): AnalyticsAdapter;
	export default adapter;
}

declare module 'prebid.js/src/adapterManager.js' {
	interface AnalyticsAdapterRegistration {
		adapter: unknown;
		code: string;
	}

	const adapterManager: {
		registerAnalyticsAdapter: (
			registration: AnalyticsAdapterRegistration,
		) => void;
	};

	export default adapterManager;
}

declare module 'prebid.js/src/constants.js' {
	const EVENTS: {
		AUCTION_INIT: string;
		BID_REQUESTED: string;
		BID_RESPONSE: string;
		NO_BID: string;
		AUCTION_END: string;
		BID_WON: string;
		[key: string]: string;
	};

	export { EVENTS };
}

declare module 'prebid.js/src/utils.js' {
	const utils: {
		logError: (message: string) => void;
		[key: string]: unknown;
	};

	export { utils };
}

declare module 'prebid.js/src/ajax.js' {
	const prebidFetch: typeof fetch;
	export { prebidFetch as fetch };
}

/**
 * The declarations below for prebid946.js
 * can be deleted once we've tested this dependency
 **/

declare module 'prebid946.js' {
	const pbjs: {
		processQueue: () => void;
	};

	export default pbjs;
}

declare module 'prebid946.js/modules/openxBidAdapter' {
	const spec: {
		aliases: string[];
	};

	export { spec };
}

declare module 'prebid946.js/modules/appnexusBidAdapter' {
	const spec: {
		aliases: Array<{ code: string }>;
	};

	export { spec };
}

declare module 'prebid946.js/adapters/bidderFactory' {
	const registerBidder: (spec: unknown) => void;

	export { registerBidder };
}

declare module 'prebid946.js/src/cpmBucketManager' {
	type PrebidPriceGranularity = {
		buckets: Array<{
			precision?: number;
			max: number;
			increment: number;
		}>;
	};

	const getPriceBucketString: (
		cpm: number,
		priceBuckets: PrebidPriceGranularity,
	) => {
		custom: string;
	};

	export { getPriceBucketString };
	export type { PrebidPriceGranularity };
}

// Added type definitions for prebid946.js analytics modules
declare module 'prebid946.js/libraries/analyticsAdapter/AnalyticsAdapter.js' {
	// eslint-disable-next-line no-restricted-imports -- can't use relative imports in ambient declarations
	import type {
		AnalyticsAdapter,
		AnalyticsAdapterConfig,
	} from 'lib/header-bidding/prebid-types';

	function adapter(config: AnalyticsAdapterConfig): AnalyticsAdapter;
	export default adapter;
}

declare module 'prebid946.js/src/adapterManager.js' {
	interface AnalyticsAdapterRegistration {
		adapter: unknown;
		code: string;
	}

	const adapterManager: {
		registerAnalyticsAdapter: (
			registration: AnalyticsAdapterRegistration,
		) => void;
	};

	export default adapterManager;
}

declare module 'prebid946.js/src/constants.js' {
	const EVENTS: {
		AUCTION_INIT: string;
		BID_REQUESTED: string;
		BID_RESPONSE: string;
		NO_BID: string;
		AUCTION_END: string;
		BID_WON: string;
		[key: string]: string;
	};

	export { EVENTS };
}

declare module 'prebid946.js/src/utils.js' {
	const utils: {
		logError: (message: string) => void;
		[key: string]: unknown;
	};

	export { utils };
}

declare module 'prebid946.js/src/ajax.js' {
	const prebidFetch: typeof fetch;
	export { prebidFetch as fetch };
}
