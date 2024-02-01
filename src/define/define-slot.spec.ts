import type { SizeMapping } from 'core/ad-sizes';
import { adSizes, createAdSize } from 'core/ad-sizes';
import { toGoogleTagSize } from 'utils/googletag-ad-size';
import {
	buildGoogletagSizeMapping,
	collectSizes,
	defineSlot,
} from './define-slot';

jest.mock('define/init-slot-ias', () => ({
	initSlotIas: jest.fn(() => Promise.resolve()),
}));

beforeEach(() => {
	const pubAds = {
		setTargeting: jest.fn(),
	};

	type MockSizeMappingBuilder = googletag.SizeMappingBuilder & {
		sizes: googletag.SizeMappingArray;
	};

	const sizeMapping: MockSizeMappingBuilder = {
		sizes: [],
		addSize: jest.fn(function (this: MockSizeMappingBuilder, width, sizes) {
			this.sizes.unshift([width, sizes]);
			return this;
		}),
		build: jest.fn(function (this: MockSizeMappingBuilder) {
			const tmp = this.sizes;
			this.sizes = [];
			return tmp;
		}),
	};

	window.googletag = {
		/* @ts-expect-error -- no way to override types */
		defineSlot: jest.fn(() => window.googletag),
		defineSizeMapping: jest.fn(() => window.googletag),
		addService: jest.fn(() => window.googletag),
		setTargeting: jest.fn(() => window.googletag),
		/* @ts-expect-error -- no way to override types */
		pubads() {
			return pubAds;
		},
		sizeMapping() {
			return sizeMapping;
		},
	};
});

describe('buildGoogletagSizeMapping', () => {
	it('should return googletag size mappings', () => {
		const sizeMapping = {
			mobile: [
				adSizes.mpu,
				adSizes.fluid,
				adSizes.googleCard,
				adSizes.halfPage,
			],
			desktop: [
				adSizes.mpu,
				adSizes.fluid,
				adSizes.googleCard,
				adSizes.halfPage,
			],
		};
		const result = buildGoogletagSizeMapping(sizeMapping as SizeMapping);

		expect(result).toEqual([
			[
				[980, 0],
				[
					toGoogleTagSize(adSizes.mpu),
					'fluid',
					toGoogleTagSize(adSizes.googleCard),
					toGoogleTagSize(adSizes.halfPage),
				],
			],
			[
				[0, 0],
				[
					toGoogleTagSize(adSizes.mpu),
					'fluid',
					toGoogleTagSize(adSizes.googleCard),
					toGoogleTagSize(adSizes.halfPage),
				],
			],
		]);
	});
});

describe('collectSizes', () => {
	const tests: Array<{
		sizeMapping: googletag.SizeMappingArray;
		output: googletag.SingleSize[];
	}> = [
		{
			sizeMapping: [
				[[980, 0], ['fluid']],
				[[0, 0], [[728, 90]]],
			],
			output: ['fluid', [728, 90]],
		},
		{
			sizeMapping: [
				[
					[0, 0],
					[[1, 1], [2, 2], [728, 90], 'fluid'],
				],
			],
			output: [[1, 1], [2, 2], [728, 90], 'fluid'],
		},
		{
			sizeMapping: [
				[
					[980, 0],
					[[1, 1], [2, 2], [728, 90], [88, 71], 'fluid'],
				],
				[
					[0, 0],
					[[1, 1], [2, 2], [728, 90], 'fluid'],
				],
			],
			output: [[1, 1], [2, 2], [728, 90], [88, 71], 'fluid'],
		},
	];

	it.each(tests)(
		'should return array of sizes',
		({ sizeMapping, output }) => {
			const result = collectSizes(sizeMapping);

			expect(result).toEqual(output);
		},
	);

	it('should return an empty array if sizeMappings is null', () => {
		const sizeMapping = null;
		const result = collectSizes(sizeMapping);

		expect(result).toEqual([]);
	});
});

describe('Define Slot', () => {
	it('should call defineSlot with correct params', () => {
		const slotDiv = document.createElement('div');
		slotDiv.id = 'dfp-ad--top-above-nav';
		slotDiv.setAttribute('name', 'top-above-nav');

		const topAboveNavSizes = {
			tablet: [
				createAdSize(1, 1),
				createAdSize(2, 2),
				createAdSize(728, 90),
				createAdSize(88, 71),
				createAdSize(0, 0),
			],
			desktop: [
				createAdSize(1, 1),
				createAdSize(2, 2),
				createAdSize(728, 90),
				createAdSize(940, 230),
				createAdSize(900, 250),
				createAdSize(970, 250),
				createAdSize(88, 71),
				createAdSize(0, 0),
			],
		};

		defineSlot(slotDiv, topAboveNavSizes);

		expect(window.googletag.defineSlot).toHaveBeenCalledWith(
			undefined,
			[
				[1, 1],
				[2, 2],
				[728, 90],
				[940, 230],
				[900, 250],
				[970, 250],
				[88, 71],
				'fluid',
			],
			'dfp-ad--top-above-nav',
		);
	});
});
