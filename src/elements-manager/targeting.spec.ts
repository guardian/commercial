import { selectAsset } from './targeting';
import type { Asset, GuElement } from './types';
import { selectAtRandom } from './util';

jest.mock('experiments/ab', () => ({
	isInVariantSynchronous: jest.fn(),
}));

jest.mock('./util', () => ({
	...jest.requireActual('./util'),
	// Fix the random selection function to always pick the first element by default
	selectAtRandom: jest
		.fn()
		.mockImplementation(<T>(candidates: T[]) => candidates[0]),
}));

describe('selectAsset', () => {
	it('wont select asset without any targeting', () => {
		const elements: GuElement[] = [
			{
				id: 'element1',
				assets: [{ id: 'asset1' } as Asset],
				targeting: [{ key: 'section', value: new Set(['sport']) }],
			},
		];

		expect(selectAsset(elements, {})).toBeUndefined();
	});

	it('will select asset with single matching value', () => {
		const elements: GuElement[] = [
			{
				id: 'element1',
				assets: [{ id: 'asset1' } as Asset],
				targeting: [{ key: 'section', value: new Set(['sport']) }],
			},
		];

		expect(selectAsset(elements, { section: null })).toBeUndefined();

		expect(selectAsset(elements, { section: undefined })).toBeUndefined();

		expect(selectAsset(elements, { section: 'sport' })).toMatchObject({
			id: 'asset1',
		});

		expect(selectAsset(elements, { section: ['sport'] })).toMatchObject({
			id: 'asset1',
		});
	});

	it('will select asset only if all the keys-values match', () => {
		const elements: GuElement[] = [
			{
				id: 'element1',
				assets: [{ id: 'asset1' } as Asset],
				targeting: [
					{ key: 'section', value: new Set(['sport']) },
					{ key: 'at', value: new Set(['fixed-puppies']) },
				],
			},
		];

		expect(selectAsset(elements, { section: 'sport' })).toBeUndefined;

		expect(selectAsset(elements, { at: 'fixed-puppies' })).toBeUndefined;

		expect(
			selectAsset(elements, { section: 'sport', at: 'fixed-puppies' }),
		).toMatchObject({
			id: 'asset1',
		});
	});

	it('wont select asset when values dont match', () => {
		const elements: GuElement[] = [
			{
				id: 'element1',
				assets: [{ id: 'asset1' } as Asset],
				targeting: [{ key: 'section', value: new Set(['sport']) }],
			},
		];
		expect(selectAsset(elements, { section: 'culture' })).toBeUndefined;
	});

	it('wont select asset when keys dont overlap', () => {
		const elements: GuElement[] = [
			{
				id: 'element1',
				assets: [{ id: 'asset1' } as Asset],
				targeting: [{ key: 'at', value: new Set(['fixed-puppies']) }],
			},
		];
		expect(selectAsset(elements, { section: 'culture' })).toBeUndefined;
	});

	it('element with two values for a key can be selected by two assets with the distinct keys', () => {
		const elements: GuElement[] = [
			{
				id: 'element1',
				assets: [{ id: 'asset1' } as Asset],
				targeting: [
					{ key: 'section', value: new Set(['sport', 'culture']) },
				],
			},
		];

		expect(selectAsset(elements, { section: 'sport' })).toMatchObject({
			id: 'asset1',
		});

		expect(selectAsset(elements, { section: 'culture' })).toMatchObject({
			id: 'asset1',
		});
	});

	it('element with no targeting is always selected', () => {
		const elements: GuElement[] = [
			{
				id: 'element1',
				assets: [{ id: 'asset1' } as Asset],
				targeting: [],
			},
		];

		expect(selectAsset(elements, {})).toMatchObject({
			id: 'asset1',
		});

		expect(
			selectAsset(elements, {
				at: 'fixed-puppies',
				section: 'culture',
				segments: ['100', '200', '300'],
			}),
		).toMatchObject({
			id: 'asset1',
		});
	});

	it('element with no asset is never selected, even with targeting matching', () => {
		const elements: GuElement[] = [
			{
				id: 'element1',
				assets: [],
				targeting: [{ key: 'at', value: new Set(['fixed-puppies']) }],
			},
		];

		expect(selectAsset(elements, { at: 'fixed-puppies' })).toBeUndefined;
	});

	it('elements with the same targeting are both selected', () => {
		const elements: GuElement[] = [
			{
				id: 'element1',
				assets: [{ id: 'asset1' } as Asset],
				targeting: [{ key: 'section', value: new Set(['sport']) }],
			},
			{
				id: 'element2',
				assets: [{ id: 'asset2' } as Asset],
				targeting: [{ key: 'section', value: new Set(['sport']) }],
			},
		];

		expect(selectAsset(elements, { section: 'sport' })).toMatchObject({
			id: 'asset1',
		});

		// Fix the random selection function to pick the second candidate next

		(selectAtRandom as jest.Mock).mockImplementationOnce(
			<T>(candidates: T[]) => candidates[1],
		);

		expect(selectAsset(elements, { section: 'sport' })).toMatchObject({
			id: 'asset2',
		});
	});

	it('both elements are selected when they have subsets of targeting that matches', () => {
		const elements: GuElement[] = [
			{
				id: 'element1',
				assets: [{ id: 'asset1' } as Asset],
				targeting: [{ key: 'section', value: new Set(['sport']) }],
			},
			{
				id: 'element2',
				assets: [{ id: 'asset2' } as Asset],
				targeting: [{ key: 'section', value: new Set(['culture']) }],
			},
		];

		expect(
			selectAsset(elements, { section: ['sport', 'culture'] }),
		).toMatchObject({
			id: 'asset1',
		});

		// Fix the random selection function to pick the second candidate next

		(selectAtRandom as jest.Mock).mockImplementationOnce(
			<T>(candidates: T[]) => candidates[1],
		);

		expect(
			selectAsset(elements, { section: ['sport', 'culture'] }),
		).toMatchObject({
			id: 'asset2',
		});
	});
});
