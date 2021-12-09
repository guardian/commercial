import { pickTargetingValues } from './pick-targeting-values';

describe('Pick defined values from an object', () => {
	test('TypeScript validates input', () => {
		// @ts-expect-error -- we don’t want nulls
		expect(pickTargetingValues({ null: null })).toEqual({});

		// @ts-expect-error -- we don’t want booleans
		expect(pickTargetingValues({ true: true })).toEqual({});

		// @ts-expect-error -- we don’t want booleans
		expect(pickTargetingValues({ false: false })).toEqual({});

		expect(
			pickTargetingValues({
				arrayOfNonStrings: [
					// @ts-expect-error -- we don’t want undefined
					undefined,
					// @ts-expect-error -- we don’t want null
					null,
					// @ts-expect-error -- we don’t want boolean
					true,
					// @ts-expect-error -- we don’t want boolean
					false,
					// @ts-expect-error -- we don’t want numbers
					0,
					// @ts-expect-error -- we don’t want numbers
					1,
					// @ts-expect-error -- we don’t want numbers
					NaN,
					// @ts-expect-error -- we don’t want numbers
					Infinity,
				],
			}),
		).toEqual({});
	});

	test('The function handles string', () => {
		const maybeTargeting = {
			string: 'one',
		} as const;

		const targeting = pickTargetingValues(maybeTargeting);

		expect(targeting.string).toEqual(maybeTargeting.string);
	});

	test('The function handles array of strings', () => {
		const maybeTargeting = {
			strings: ['two', 'three'],
		} as const;

		const targeting = pickTargetingValues(maybeTargeting);

		expect(targeting.strings).toEqual(maybeTargeting.strings);
	});

	test('The function handles array of empty strings (no type safety)', () => {
		const maybeTargeting = {
			arrayOfEmptyStrings: ['', '', ''],
		} as const;

		const targeting = pickTargetingValues(maybeTargeting);

		expect(targeting.arrayOfEmptyStrings).toBeUndefined();
	});

	test('The function handles an array of mixed strings', () => {
		const maybeTargeting = {
			arrayOfMixedStrings: ['', 'valid', ''],
		} as const;

		const targeting = pickTargetingValues(maybeTargeting);

		expect(targeting.arrayOfMixedStrings).toEqual(['valid']);
	});

	test('TypeScript validates the output: undefined is gone', () => {
		const maybeTargeting = {
			undefined: undefined,
		} as const;

		const targeting = pickTargetingValues(maybeTargeting);

		// @ts-expect-error -- this is what we’re checking
		expect(targeting.undefined).toBeUndefined();
	});

	test('TypeScript validates the output: emptyString is gone', () => {
		const maybeTargeting = {
			emptyString: '',
		} as const;

		const targeting = pickTargetingValues(maybeTargeting);

		// @ts-expect-error -- this is what we’re checking
		expect(targeting.emptyString).toBeUndefined();
	});

	test('TypeScript validates the output: emptyArray is gone', () => {
		const maybeTargeting = {
			emptyArray: [],
		} as const;

		const targeting = pickTargetingValues(maybeTargeting);

		// @ts-expect-error -- this is what we’re checking
		expect(targeting.emptyArray).toBeUndefined();
	});

	test('TypeScript validates the output: arrayOfEmptyString is gone', () => {
		const maybeTargeting = {
			arrayOfEmptyString: [''],
		} as const;

		const targeting = pickTargetingValues(maybeTargeting);

		// @ts-expect-error -- this is what we’re checking
		expect(targeting.arrayOfEmptyString).toBeUndefined();
	});

	test('TypeScript validates the output: arrayOfEmptyStrings is gone', () => {
		const maybeTargeting = {
			arrayOfEmptyStrings: ['', '', ''],
		} as const;

		const targeting = pickTargetingValues(maybeTargeting);

		// @ts-expect-error -- this is what we’re checking
		expect(targeting.arrayOfNonStrings).toBeUndefined();
	});
});
