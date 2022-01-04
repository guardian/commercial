export type AdSizeString = 'fluid' | `${number},${number}`;

export type AdSize = Readonly<{
	width: number;
	height: number;
	toString: () => AdSizeString;
}>;

export type SizeKeys =
	| 'billboard'
	| 'leaderboard'
	| 'mpu'
	| 'halfPage'
	| 'portrait'
	| 'skyscraper'
	| 'mobilesticky'
	| 'fluid'
	| 'outOfPage'
	| 'googleCard'
	| 'video'
	| 'outstreamDesktop'
	| 'outstreamGoogleDesktop'
	| 'outstreamMobile'
	| 'merchandisingHighAdFeature'
	| 'merchandisingHigh'
	| 'merchandising'
	| 'inlineMerchandising'
	| 'fabric'
	| 'empty'
	| '970x250'
	| '728x90'
	| '300x250'
	| '300x600'
	| '300x1050'
	| '160x600';

const createAdSize = (width: number, height: number): AdSize => {
	const toString = (): AdSizeString =>
		width === 0 && height === 0 ? 'fluid' : `${width},${height}`;

	return Object.freeze({
		width,
		height,
		toString,
	});
};

const adSizesPartial = {
	// standard ad sizes
	billboard: createAdSize(970, 250),
	leaderboard: createAdSize(728, 90),
	mpu: createAdSize(300, 250),
	halfPage: createAdSize(300, 600),
	portrait: createAdSize(300, 1050),
	skyscraper: createAdSize(160, 600),
	mobilesticky: createAdSize(320, 50),

	// dfp proprietary ad sizes
	fluid: createAdSize(0, 0),
	outOfPage: createAdSize(1, 1),
	googleCard: createAdSize(300, 274),

	// guardian proprietary ad sizes
	video: createAdSize(620, 1),
	outstreamDesktop: createAdSize(620, 350),
	outstreamGoogleDesktop: createAdSize(550, 310),
	outstreamMobile: createAdSize(300, 197),
	merchandisingHighAdFeature: createAdSize(88, 89),
	merchandisingHigh: createAdSize(88, 87),
	merchandising: createAdSize(88, 88),
	inlineMerchandising: createAdSize(88, 85),
	fabric: createAdSize(88, 71),
	empty: createAdSize(2, 2),
};

export const adSizes: Record<SizeKeys, AdSize> = {
	...adSizesPartial,
	'970x250': adSizesPartial.billboard,
	'728x90': adSizesPartial.leaderboard,
	'300x250': adSizesPartial.mpu,
	'300x600': adSizesPartial.halfPage,
	'300x1050': adSizesPartial.portrait,
	'160x600': adSizesPartial.skyscraper,
};

export const getAdSize = (size: SizeKeys): AdSize => adSizes[size];

// Export for testing
export const _ = { createAdSize };
