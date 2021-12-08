import { pickDefinedValues } from './pick-defined-values';

describe('Pick defined values from an object', () => {
	test('TypeScript validates input', () => {
		// @ts-expect-error -- we don’t want nulls
		expect(pickDefinedValues({ null: null })).toEqual({});

		// @ts-expect-error -- we don’t want booleans
		expect(pickDefinedValues({ true: true })).toEqual({});

		// @ts-expect-error -- we don’t want booleans
		expect(pickDefinedValues({ false: false })).toEqual({});

		expect(
			pickDefinedValues({
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
	test('TypeScript validates output', () => {
		const maybeTargeting = {
			string: 'one',
			strings: ['two', 'three'],
			undefined: undefined,
			emptyString: '',
			emptyArray: [],
			arrayOfEmptyString: [''],
			arrayOfEmptyStrings: ['', '', ''],
		} as const;

		const targeting = pickDefinedValues(maybeTargeting);

		expect(targeting.string).toEqual(maybeTargeting.string);
		expect(targeting.strings).toEqual(maybeTargeting.strings);
		// @ts-expect-error -- this is what we’re checking
		expect(targeting.undefined).toBeUndefined();
		// @ts-expect-error -- this is what we’re checking
		expect(targeting.null).toBeUndefined();
		// @ts-expect-error -- this is what we’re checking
		expect(targeting.true).toBeUndefined();
		// @ts-expect-error -- this is what we’re checking
		expect(targeting.false).toBeUndefined();
		// @ts-expect-error -- this is what we’re checking
		expect(targeting.emptyString).toBeUndefined();
		// @ts-expect-error -- this is what we’re checking
		expect(targeting.emptyArray).toBeUndefined();
		// @ts-expect-error -- this is what we’re checking
		expect(targeting.arrayOfEmptyString).toBeUndefined();
		expect(targeting.arrayOfEmptyStrings).toBeUndefined();
		// @ts-expect-error -- this is what we’re checking
		expect(targeting.arrayOfNonStrings).toBeUndefined();
	});
});
