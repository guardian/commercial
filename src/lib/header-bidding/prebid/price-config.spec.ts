import {
	criteoPriceGranularity,
	indexPriceGranularity,
	overridePriceBucket,
	ozonePriceGranularity,
	priceGranularity,
} from './price-config';

describe('price granularity', () => {
	test('default should have correct buckets', () => {
		expect(priceGranularity).toEqual({
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
		});
	});
	test('criteo should have correct buckets', () => {
		expect(criteoPriceGranularity).toEqual({
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
		});
	});

	describe('ozone', () => {
		const ozoneGranularityOption1 = {
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

		const ozoneGranularityOption2 = {
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

		test.each([
			[[100, 100], undefined],
			[[160, 600], ozoneGranularityOption1],
			[[300, 600], ozoneGranularityOption1],
			[[728, 90], ozoneGranularityOption2],
			[[970, 250], ozoneGranularityOption2],
			[[300, 250], ozoneGranularityOption2],
			[[620, 350], ozoneGranularityOption2],
			[[300, 197], ozoneGranularityOption2],
		] as const)(
			'Ozone slot with size %s gives correct granularity',
			([width, height], expectedGranularity) => {
				expect(ozonePriceGranularity(width, height)).toEqual(
					expectedGranularity,
				);
			},
		);

		describe('price bucket override compared to default granularity', () => {
			// The default granularity has buckets: [0-10: 0.01], [10-15: 0.1], [15-100: 1]
			// Ozone billboard (970x250) has: [0-12: 0.01], [12-20: 0.1], [20-50: 1]
			// Ozone halfpage (300x600) has: [0-10: 0.01], [10-15: 0.1], [15-50: 1]

			test.each([
				// Cases where Ozone billboard differs from default
				// Different max in first bucket (12 vs 10)
				[[970, 250], 10.5, '10.50', '10.50'], // Default: 10.50 (0.1 increment), Ozone: 10.50 (0.01 increment)
				[[970, 250], 11.23, '11.20', '11.23'], // Default: 11.20 (0.1 increment), Ozone: 11.23 (0.01 increment)

				// Different max in second bucket (20 vs 15)
				[[970, 250], 15.5, '15.00', '15.50'], // Default: 15.00 (1 increment), Ozone: 15.50 (0.1 increment)
				[[970, 250], 19.7, '19.00', '19.70'], // Default: 19.00 (1 increment), Ozone: 19.70 (0.1 increment)

				// Different max in third bucket (50 vs 100)
				[[970, 250], 60, '60.00', '50.00'], // Default: 60.00 (1 increment), Ozone: 50.00 (max value)
				[[970, 250], 99, '99.00', '50.00'], // Default: 99.00 (1 increment), Ozone: 50.00 (max value)

				// Cases where Ozone halfpage is different from default
				// Same max in first bucket (10) but then different behavior
				[[300, 600], 10.5, '10.50', '10.50'], // Default: 10.50 (0.1 increment), Ozone halfpage: 10.50 (0.1 increment)

				// Same max in second bucket (15) but then different behavior
				[[300, 600], 15.5, '15.00', '15.00'], // Default: 15.00 (1 increment), Ozone halfpage: 15.00 (1 increment)

				// Different max in third bucket (50 vs 100)
				[[300, 600], 60, '60.00', '50.00'], // Default: 60.00 (1 increment), Ozone halfpage: 50.00 (max value)
			] as const)(
				'Ozone slot with size %s and cpm %s should have default price bucket %s but returns %s',
				(
					[width, height],
					cpm,
					defaultPriceBucket,
					expectedOzoneBucket,
				) => {
					expect(
						overridePriceBucket(
							'ozone',
							width,
							height,
							cpm,
							defaultPriceBucket,
						),
					).toEqual(expectedOzoneBucket);
				},
			);
		});
	});

	describe('Index Prebid', () => {
		const indexPrebidGranularityOption1 = {
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

		const indexPrebidGranularityOption2 = {
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

		test.each([
			[[100, 100], undefined],
			[[160, 600], indexPrebidGranularityOption1],
			[[300, 600], indexPrebidGranularityOption1],
			[[728, 90], indexPrebidGranularityOption2],
			[[970, 250], indexPrebidGranularityOption2],
			[[300, 250], indexPrebidGranularityOption2],
		] as const)(
			'Index Prebid slot with size %s gives correct granularity',
			([width, height], expectedGranularity) => {
				expect(indexPriceGranularity(width, height)).toEqual(
					expectedGranularity,
				);
			},
		);
		describe('price bucket override compared to default granularity', () => {
			// The default granularity has buckets: [0-10: 0.01], [10-15: 0.1], [15-100: 1]
			// Index MPU (300x250) has: [0-12: 0.01], [12-20: 0.05], [20-50: 1]
			// Index halfpage (300x600) has: [0-10: 0.01], [10-15: 0.05], [15-50: 1]

			test.each([
				// Cases where Index MPU differs from default
				// Different max in first bucket (12 vs 10)
				[[300, 250], 10.5, '10.50', '10.50'], // Default: 10.50 (0.1 increment), Index: 10.50 (0.01 increment)
				[[300, 250], 11.23, '11.20', '11.23'], // Default: 11.20 (0.1 increment), Index: 11.23 (0.01 increment)

				// Different increment in second bucket (0.05 vs 0.1)
				[[300, 250], 12.07, '12.00', '12.05'], // Default: 12.00 (0.1 increment), Index: 12.05 (0.05 increment)
				[[300, 250], 14.88, '14.80', '14.85'], // Default: 14.80 (0.1 increment), Index: 14.85 (0.05 increment)

				// Different max and increment in second bucket
				[[300, 250], 15.5, '15.00', '15.50'], // Default: 15.00 (1 increment), Index: 15.50 (0.05 increment)
				[[300, 250], 19.93, '19.00', '19.90'], // Default: 19.00 (1 increment), Index: 19.90 (0.05 increment)

				// Different max in third bucket (50 vs 100)
				[[300, 250], 60, '60.00', '50.00'], // Default: 60.00 (1 increment), Index: 50.00 (max value)

				// Cases where Index halfpage differs from default
				// Same max in first bucket (10) but different second bucket
				[[300, 600], 10.07, '10.00', '10.05'], // Default: 10.00 (0.1 increment), Index: 10.05 (0.05 increment)
				[[300, 600], 12.77, '12.70', '12.75'], // Default: 12.70 (0.1 increment), Index: 12.75 (0.05 increment)
				[[300, 600], 14.99, '14.90', '14.95'], // Default: 14.90 (0.1 increment), Index: 14.95 (0.05 increment)

				// Different max in third bucket (50 vs 100)
				[[300, 600], 75, '75.00', '50.00'], // Default: 75.00 (1 increment), Index: 50.00 (max value)
			] as const)(
				'Index slot with size %s and cpm %s should have default price bucket %s but returns %s',
				(
					[width, height],
					cpm,
					defaultPriceBucket,
					expectedIndexBucket,
				) => {
					expect(
						overridePriceBucket(
							'ix',
							width,
							height,
							cpm,
							defaultPriceBucket,
						),
					).toEqual(expectedIndexBucket);
				},
			);
		});
	});
});
