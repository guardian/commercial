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
	import type { PrebidPriceGranularity } from '../lib/header-bidding/prebid/price-config';

	const getPriceBucketString: (
		cpm: number,
		priceBuckets: PrebidPriceGranularity,
	) => {
		custom: string;
	};

	export { getPriceBucketString };
}
