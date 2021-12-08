import { isString } from '@guardian/libs';

type ValidTargeting<T, K> = '' extends T
	? never
	: [] extends T
	? never
	: [''] extends T
	? never
	: T extends boolean
	? never
	: T extends NonNullable<T>
	? K
	: never;
type DefinedKeys<T> = { [K in keyof T]-?: ValidTargeting<T[K], K> }[keyof T];
type ObjectWithDefinedValues<T> = Pick<T, DefinedKeys<T>>;

const isValidTargeting = (value: unknown): value is string | string[] => {
	if (isString(value) && value !== '') return true;
	if (
		Array.isArray(value) &&
		value.filter(isString).filter(Boolean).length > 0
	)
		return true;
	return false;
};

/**
 * Picks only keys with targeting values from an object.
 * A targeting values is defined as either:
 * - a non-empty string
 * - an array of non-empty strings
 *
 * If you object is read-only, you can safely access properties on the result.
 * For example:
 *
 * ```ts
 * dirty = {
 *   valid: 'real',
 *   invalid: undefined,
 * } as const;
 *
 * clean = pickDefinedValues(dirty);
 *
 * // @ts-expect-error -- you can’t access this property
 * clean.invalid
 * ```
 */
export const pickTargetingValues = <
	T extends Record<string, string | Readonly<string[]> | undefined>,
>(
	obj: T,
): ObjectWithDefinedValues<T> => {
	const initialValue = {} as ObjectWithDefinedValues<T>;
	return Object.entries(obj).reduce<ObjectWithDefinedValues<T>>(
		(valid, [key, value]) => {
			if (isValidTargeting(value))
				// @ts-expect-error -- isValidTargeting checks this
				valid[key] = value;
			return valid;
		},
		initialValue,
	);
};
