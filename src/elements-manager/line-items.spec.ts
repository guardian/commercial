import { findLineItems } from './line-items';
import type { LineItem, Targeting } from './line-items';

const mockLineItem = {
	id: 'asdf',
	priority: 1,
	creatives: [],
	targeting: {},
};

const mockCreative = {
	id: 'asdf',
	size: '300x250',
	assetUrl: 'https://via.placeholder.com/300x250',
	clickUrl: 'https://www.theguardian.com',
	targeting: {},
};

describe('findLineItems', () => {
	it('should return the correct line items based on display targeting', () => {
		const displayTargeting: Targeting = {
			tn: ['value1', 'value2'],
			ab: ['value3'],
		};

		const lineItems: LineItem[] = [
			{
				...mockLineItem,
				priority: 1,
				targeting: { tn: ['value1', 'value2'] },
			},
			{
				...mockLineItem,
				priority: 2,
				targeting: { tn: ['value1'], ab: ['value3'] },
			},
			{
				...mockLineItem,
				priority: 3,
				targeting: { tn: ['value2'], ab: ['value4'] },
			},
			{
				...mockLineItem,
				priority: 4,
				targeting: { tn: ['value3'], ab: ['value5'] },
			},
		];

		const expectedLineItems: LineItem[] = [
			{
				id: 'asdf',
				priority: 2,
				creatives: [],
				targeting: { tn: ['value1'], ab: ['value3'] },
			},
			{
				id: 'asdf',
				priority: 1,
				creatives: [],
				targeting: { tn: ['value1', 'value2'] },
			},
		];

		const result = findLineItems(displayTargeting);

		expect(result).toEqual(expectedLineItems);
	});
});
describe('getCreative', () => {
	it('should return a random creative that matches the display targeting', () => {
		const displayTargeting: Targeting = {
			tn: ['value1', 'value2'],
			ab: ['value3'],
		};

		const lineItems: LineItem[] = [
			{
				id: 'asdf',
				priority: 1,
				creatives: [
					{
						id: 'creative1',
						targeting: { tn: ['value1', 'value2'] },
					},
					{
						id: 'creative2',
						targeting: { tn: ['value1'], ab: ['value3'] },
					},
					{
						id: 'creative3',
						targeting: { tn: ['value2'], ab: ['value4'] },
					},
					{
						id: 'creative4',
						targeting: { tn: ['value3'], ab: ['value5'] },
					},
				],
				targeting: { tn: ['value1', 'value2'] },
			},
			{
				id: 'asdf',
				priority: 2,
				creatives: [
					{
						id: 'creative5',
						targeting: { tn: ['value1'], ab: ['value3'] },
					},
					{
						id: 'creative6',
						targeting: { tn: ['value2'], ab: ['value4'] },
					},
				],
				targeting: { tn: ['value1'], ab: ['value3'] },
			},
			{
				id: 'asdf',
				priority: 3,
				creatives: [
					{
						id: 'creative7',
						targeting: { tn: ['value2'], ab: ['value4'] },
					},
					{
						id: 'creative8',
						targeting: { tn: ['value3'], ab: ['value5'] },
					},
				],
				targeting: { tn: ['value2'], ab: ['value4'] },
			},
			{
				id: 'asdf',
				priority: 4,
				creatives: [
					{
						id: 'creative9',
						targeting: { tn: ['value3'], ab: ['value5'] },
					},
					{
						id: 'creative10',
						targeting: { tn: ['value4'], ab: ['value6'] },
					},
				],
				targeting: { tn: ['value3'], ab: ['value5'] },
			},
		];

		const expectedCreatives = [
			'creative2',
			'creative1',
			'creative5',
			'creative6',
		];

		const result = getCreative(displayTargeting);

		expect(expectedCreatives).toContain(result);
	});
});
