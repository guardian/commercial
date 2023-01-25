import type { Breakpoint } from './lib/breakpoint';

type AdSizeString = 'fluid' | `${number},${number}`;

/**
 * Store ad sizes in a way that is compatible with google-tag but also accessible via
 * more semantic `width`/`height` properties and keep things readonly.
 *
 * example:
 * const size = new AdSize([300, 250]);
 *
 * size.width === 300; // true
 * size[0] === 300; // true
 *
 * size.height === 250; // true
 * size[1] === 250; // true
 *
 * size[0] = 200; // throws error
 * size.width = 200; // throws error
 *
 */
class AdSize extends Array<number> {
	readonly [0]: number;
	readonly [1]: number;

	constructor([width, height]: [number, number]) {
		super();
		this[0] = width;
		this[1] = height;
	}

	public toString(): AdSizeString {
		return this.width === 0 && this.height === 0
			? 'fluid'
			: `${this.width},${this.height}`;
	}

	public toArray(): number[] {
		return [this[0], this[1]];
	}

	// The advert size is not reflective of the actual size of the advert.
	// For example, fluid ads and Guardian merch ads are larger than the dimensions
	public isProxy(): boolean {
		const isOutOfPage = this.width === 1 && this.height === 1;
		const isEmpty = this.width === 2 && this.height === 2;
		const isFluid = this.toString() === 'fluid';
		const isMerch = this.width === 88;

		return isOutOfPage || isEmpty || isFluid || isMerch;
	}

	get width(): number {
		return this[0];
	}

	get height(): number {
		return this[1];
	}
}

type SizeKeys =
	| '160x600'
	| '300x1050'
	| '300x250'
	| '300x600'
	| '728x90'
	| '970x250'
	| 'billboard'
	| 'cascade'
	| 'empty'
	| 'fabric'
	| 'fluid'
	| 'googleCard'
	| 'halfPage'
	| 'inlineMerchandising'
	| 'leaderboard'
	| 'merchandising'
	| 'merchandisingHigh'
	| 'merchandisingHighAdFeature'
	| 'mobilesticky'
	| 'mpu'
	| 'outOfPage'
	| 'outstreamDesktop'
	| 'outstreamGoogleDesktop'
	| 'outstreamMobile'
	| 'portrait'
	| 'portraitInterstitial'
	| 'skyscraper';

type SlotName =
	| 'carrot'
	| 'comments'
	| 'comments-expanded'
	| 'crossword-banner'
	| 'epic'
	| 'exclusion'
	| 'im'
	| 'inline'
	| 'merchandising-high-lucky'
	| 'merchandising-high'
	| 'merchandising'
	| 'mobile-sticky'
	| 'mostpop'
	| 'right'
	| 'survey'
	| 'top-above-nav';

type SizeMapping = Partial<Record<Breakpoint, AdSize[]>>;

type SlotSizeMappings = Record<SlotName, SizeMapping>;

const createAdSize = (width: number, height: number): AdSize => {
	return new AdSize([width, height]);
};

const namedStandardAdSizes = {
	billboard: createAdSize(970, 250),
	halfPage: createAdSize(300, 600),
	leaderboard: createAdSize(728, 90),
	mobilesticky: createAdSize(320, 50),
	mpu: createAdSize(300, 250),
	portrait: createAdSize(300, 1050),
	skyscraper: createAdSize(160, 600),
	cascade: createAdSize(940, 230),
	portraitInterstitial: createAdSize(320, 480),
};

const standardAdSizes = {
	'970x250': namedStandardAdSizes.billboard,
	'300x600': namedStandardAdSizes.halfPage,
	'728x90': namedStandardAdSizes.leaderboard,
	'300x250': namedStandardAdSizes.mpu,
	'300x1050': namedStandardAdSizes.portrait,
	'160x600': namedStandardAdSizes.skyscraper,
};

const outstreamSizes = {
	outstreamDesktop: createAdSize(620, 350),
	outstreamGoogleDesktop: createAdSize(550, 310),
	outstreamMobile: createAdSize(300, 197),
};

/**
 * Ad sizes commonly associated with third parties
 */
const proprietaryAdSizes = {
	fluid: createAdSize(0, 0),
	googleCard: createAdSize(300, 274),
	outOfPage: createAdSize(1, 1),
};

/**
 * Ad sizes associated with in-house formats
 */
const guardianProprietaryAdSizes = {
	empty: createAdSize(2, 2),
	fabric: createAdSize(88, 71),
	inlineMerchandising: createAdSize(88, 85),
	merchandising: createAdSize(88, 88),
	merchandisingHigh: createAdSize(88, 87),
	merchandisingHighAdFeature: createAdSize(88, 89),
};

const adSizes: Record<SizeKeys, AdSize> = {
	...namedStandardAdSizes,
	...standardAdSizes,
	...outstreamSizes,
	...proprietaryAdSizes,
	...guardianProprietaryAdSizes,
};

/**
 * mark: 432b3a46-90c1-4573-90d3-2400b51af8d0
 * Some of these may or may not need to be synced for with the sizes in ./create-ad-slot.ts
 * these were originally from DCR, create-ad-slot.ts ones were in frontend.
 **/
const slotSizeMappings: SlotSizeMappings = {
	inline: {
		mobile: [
			adSizes.outOfPage,
			adSizes.empty,
			adSizes.outstreamMobile,
			adSizes.mpu,
			adSizes.googleCard,
			adSizes.fluid,
		],
		phablet: [
			adSizes.outOfPage,
			adSizes.empty,
			adSizes.outstreamMobile,
			adSizes.mpu,
			adSizes.googleCard,
			adSizes.fluid,
		],
		desktop: [
			adSizes.outOfPage,
			adSizes.empty,
			adSizes.mpu,
			adSizes.googleCard,
			adSizes.fluid,
		],
	},
	right: {
		mobile: [
			adSizes.outOfPage,
			adSizes.empty,
			adSizes.mpu,
			adSizes.googleCard,
			adSizes.halfPage,
			adSizes.fluid,
		],
	},
	comments: {
		mobile: [
			adSizes.outOfPage,
			adSizes.empty,
			adSizes.halfPage,
			adSizes.outstreamMobile,
			adSizes.mpu,
			adSizes.googleCard,
			adSizes.fluid,
		],
		phablet: [
			adSizes.outOfPage,
			adSizes.empty,
			adSizes.outstreamMobile,
			adSizes.mpu,
			adSizes.googleCard,
			adSizes.fluid,
		],
		desktop: [
			adSizes.outOfPage,
			adSizes.empty,
			adSizes.halfPage,
			adSizes.mpu,
			adSizes.googleCard,
			adSizes.fluid,
			adSizes.skyscraper,
		],
	},
	'comments-expanded': {
		mobile: [
			adSizes.outOfPage,
			adSizes.empty,
			adSizes.mpu,
			adSizes.googleCard,
			adSizes.fluid,
			adSizes.skyscraper,
			adSizes.halfPage,
		],
	},
	'top-above-nav': {
		mobile: [
			adSizes.outOfPage,
			adSizes.empty,
			adSizes.fabric,
			adSizes.outstreamMobile,
			adSizes.mpu,
			adSizes.fluid,
		],
		tablet: [
			adSizes.outOfPage,
			adSizes.empty,
			adSizes.fabric,
			adSizes.fluid,
			adSizes.leaderboard,
		],
		desktop: [
			adSizes.outOfPage,
			adSizes.empty,
			adSizes.leaderboard,
			createAdSize(940, 230),
			createAdSize(900, 250),
			adSizes.billboard,
			adSizes.fabric,
			adSizes.fluid,
		],
	},
	mostpop: {
		mobile: [
			adSizes.outOfPage,
			adSizes.empty,
			adSizes.mpu,
			adSizes.googleCard,
			adSizes.fluid,
		],
		phablet: [
			adSizes.outOfPage,
			adSizes.empty,
			adSizes.outstreamMobile,
			adSizes.mpu,
			adSizes.googleCard,
			adSizes.halfPage,
			adSizes.fluid,
		],
		tablet: [
			adSizes.outOfPage,
			adSizes.empty,
			adSizes.mpu,
			adSizes.googleCard,
			adSizes.halfPage,
			adSizes.leaderboard,
			adSizes.fluid,
		],
		desktop: [
			adSizes.outOfPage,
			adSizes.empty,
			adSizes.mpu,
			adSizes.googleCard,
			adSizes.halfPage,
			adSizes.fluid,
		],
	},
	im: {
		mobile: [
			adSizes.outOfPage,
			adSizes.empty,
			adSizes.inlineMerchandising,
			adSizes.fluid,
		],
	},
	'merchandising-high': {
		mobile: [
			adSizes.outOfPage,
			adSizes.empty,
			adSizes.merchandisingHigh,
			adSizes.fluid,
		],
	},
	'merchandising-high-lucky': {
		mobile: [adSizes.outOfPage, adSizes.empty, adSizes.fluid],
	},
	merchandising: {
		mobile: [
			adSizes.outOfPage,
			adSizes.empty,
			adSizes.merchandising,
			adSizes.fluid,
		],
	},
	survey: {
		desktop: [adSizes.outOfPage],
	},
	carrot: {
		mobile: [adSizes.fluid],
	},
	epic: {
		mobile: [adSizes.fluid],
	},
	'mobile-sticky': {
		mobile: [adSizes.mobilesticky],
	},
	'crossword-banner': {
		phablet: [adSizes.outOfPage, adSizes.empty, adSizes.leaderboard],
		tablet: [adSizes.outOfPage, adSizes.empty, adSizes.leaderboard],
	},
	exclusion: {
		mobile: [adSizes.empty],
		phablet: [adSizes.empty],
		desktop: [adSizes.empty],
	},
};

const getAdSize = (size: SizeKeys): AdSize => adSizes[size];

// Export for testing
export const _ = { createAdSize };

export type {
	AdSizeString,
	AdSize,
	SizeKeys,
	SizeMapping,
	SlotSizeMappings,
	SlotName,
};

export {
	adSizes,
	standardAdSizes,
	outstreamSizes,
	getAdSize,
	slotSizeMappings,
	createAdSize,
};
