import { adSizes } from '@guardian/commercial-core/ad-sizes';
import { log } from '@guardian/libs';
import {
	getPriceBucketString,
	type PrebidPriceGranularity,
} from 'prebid.js/src/cpmBucketManager';

export const priceGranularity: PrebidPriceGranularity = {
	buckets: [
		{
			max: 10,
			increment: 0.01,
		},
		{
			max: 15,
			increment: 0.1,
		},
		{
			max: 100,
			increment: 1,
		},
	],
};

export const criteoPriceGranularity: PrebidPriceGranularity = {
	buckets: [
		{
			max: 12,
			increment: 0.01,
		},
		{
			max: 20,
			increment: 0.05,
		},
		{
			max: 500,
			increment: 1,
		},
	],
};

export const ozonePriceGranularity = (
	width: number,
	height: number,
): PrebidPriceGranularity | undefined => {
	const sizeString = [width, height].join(',');

	if (
		sizeString === adSizes.skyscraper.toString() ||
		sizeString === adSizes.halfPage.toString()
	) {
		return {
			buckets: [
				{
					max: 10,
					increment: 0.01,
				},
				{
					max: 15,
					increment: 0.1,
				},
				{
					max: 50,
					increment: 1,
				},
			],
		};
	}

	if (
		sizeString === adSizes.leaderboard.toString() ||
		sizeString === adSizes.billboard.toString() ||
		sizeString === adSizes.mpu.toString() ||
		sizeString === adSizes.outstreamDesktop.toString() ||
		sizeString === adSizes.outstreamMobile.toString()
	) {
		return {
			buckets: [
				{
					max: 12,
					increment: 0.01,
				},
				{
					max: 20,
					increment: 0.1,
				},
				{
					max: 50,
					increment: 1,
				},
			],
		};
	}

	return undefined;
};

export const indexPriceGranularity = (
	width: number,
	height: number,
): PrebidPriceGranularity | undefined => {
	const sizeString = [width, height].join(',');

	if (
		sizeString === adSizes.skyscraper.toString() ||
		sizeString === adSizes.halfPage.toString()
	) {
		return {
			buckets: [
				{
					max: 10,
					increment: 0.01,
				},
				{
					max: 15,
					increment: 0.05,
				},
				{
					max: 50,
					increment: 1,
				},
			],
		};
	}

	if (
		sizeString === adSizes.leaderboard.toString() ||
		sizeString === adSizes.billboard.toString() ||
		sizeString === adSizes.mpu.toString()
	) {
		return {
			buckets: [
				{
					max: 12,
					increment: 0.01,
				},
				{
					max: 20,
					increment: 0.05,
				},
				{
					max: 50,
					increment: 1,
				},
			],
		};
	}

	return undefined;
};

export const getPriceGranularityForSize = (
	bidder: 'ozone' | 'ix',
	width: number,
	height: number,
): PrebidPriceGranularity | undefined => {
	if (bidder === 'ozone') {
		return ozonePriceGranularity(width, height);
	}
	return indexPriceGranularity(width, height);
};

export const overridePriceBucket = (
	bidder: 'ozone' | 'ix' | 'criteo',
	width: number,
	height: number,
	cpm: number,
	defaultPriceBucket: string,
): string | undefined => {
	const priceGranularity =
		bidder === 'criteo'
			? criteoPriceGranularity
			: getPriceGranularityForSize(bidder, width, height);

	if (!priceGranularity) {
		log(
			'commercial',
			`${bidder} price granularity for size (${width}x${height}) not found`,
		);
		return defaultPriceBucket;
	}
	const priceBucket = getPriceBucketString(cpm, priceGranularity).custom;
	if (priceBucket !== defaultPriceBucket) {
		log(
			'commercial',
			`${bidder} price bucket for size (${width}x${height}) with cpm ${cpm} overriden from ${defaultPriceBucket} to ${priceBucket}`,
		);
	} else {
		log(
			'commercial',
			`${bidder} price bucket for size (${width}x${height}) with cpm ${cpm} not overriden (${priceBucket})`,
		);
	}
	return priceBucket;
};
