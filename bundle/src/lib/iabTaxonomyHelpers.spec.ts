import { extractRelevantIabTaxonomyTags } from './iabTaxonomyHelpers';

describe('extractRelevantIabTaxonomyTags', () => {
	const taxonomy = 'IAB_CONTENT_2_2';
	const model = 'primary_v1';

	it('should generate IAB taxonomy tags for GAM correctly', () => {
		const tags = [
			'commercial/iab/primary_v1/9/101',
			'commercial/iab/primary_v1/6/102',
			'commercial/iab/primary_secondary_v1/9/103',
			'commercial/iab/primary_secondary_v1/6/104',
		];

		const result = extractRelevantIabTaxonomyTags(tags, model, taxonomy);

		expect(result).toEqual(['102']);
	});

	it('should return an empty array when no tags match the model', () => {
		const tags = [
			'commercial/iab/primary_secondary_v1/9/103',
			'commercial/iab/primary_secondary_v1/6/104',
		];

		const result = extractRelevantIabTaxonomyTags(tags, model, taxonomy);

		expect(result).toEqual([]);
	});

	it('should return an empty array when no tags provided', () => {
		const tags: string[] = [];

		const result = extractRelevantIabTaxonomyTags(tags, model, taxonomy);

		expect(result).toEqual([]);
	});

	it('should return an empty array when tags do no match the correct format', () => {
		const tags: string[] = [
			'invalid/tag/format',
			'another/invalid/tag',
			'primary_v1/9/101',
			'commercial-iab-primary_v1-9-101',
		];

		const result = extractRelevantIabTaxonomyTags(tags, model, taxonomy);

		expect(result).toEqual([]);
	});
});
