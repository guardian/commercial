import {
	extractRelevantIabTaxonomyTags,
	mapTaxonomyToSegtax,
} from './iab-taxonomy';

describe('mapTaxonomyToSegtax', () => {
	it('should map IAB_CONTENT_2_2 to segtax 6', () => {
		expect(mapTaxonomyToSegtax('IAB_CONTENT_2_2')).toBe('6');
	});

	it('should map IAB_CONTENT_3_0 to segtax 7', () => {
		expect(mapTaxonomyToSegtax('IAB_CONTENT_3_0')).toBe('7');
	});
});

describe('extractRelevantIabTaxonomyTags', () => {
	const model = 'primary_v1';

	it('should generate IAB taxonomy tags for GAM correctly', () => {
		const tags = [
			'commercial/iab/primary_v1/9/101',
			'commercial/iab/primary_v1/6/102',
			'commercial/iab/primary_secondary_v1/9/103',
			'commercial/iab/primary_secondary_v1/6/104',
		];

		const result = extractRelevantIabTaxonomyTags(tags, model);

		expect(result).toEqual(['102']);
	});

	it('should return an empty array when no tags match the model', () => {
		const tags = [
			'commercial/iab/primary_secondary_v1/9/103',
			'commercial/iab/primary_secondary_v1/6/104',
		];

		const result = extractRelevantIabTaxonomyTags(tags, model);

		expect(result).toEqual([]);
	});

	it('should return an empty array when no tags provided', () => {
		const tags: string[] = [];

		const result = extractRelevantIabTaxonomyTags(tags, model);

		expect(result).toEqual([]);
	});

	it('should return an empty array when tags do no match the correct format', () => {
		const tags: string[] = [
			'invalid/tag/format',
			'another/invalid/tag',
			'primary_v1/9/101',
			'commercial-iab-primary_v1-9-101',
		];

		const result = extractRelevantIabTaxonomyTags(tags, model);

		expect(result).toEqual([]);
	});
});
