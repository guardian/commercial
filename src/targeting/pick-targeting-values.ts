import { isString } from '@guardian/libs';
import type { ConditionalExcept } from 'type-fest';

type ValidTargetingObject<Base> = ConditionalExcept<
	Base,
	null | undefined | '' | readonly [] | readonly [''] | boolean | number
>;

const isTargetingString = (string: unknown): boolean =>
	isString(string) && string !== '';

const isTargetingArray = (array: unknown): boolean =>
	Array.isArray(array) && array.filter(isTargetingString).length > 0;

const isValidTargeting = (value: unknown): value is string | string[] => {
	if (isTargetingString(value)) return true;
	if (isTargetingArray(value)) return true;
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
): ValidTargetingObject<T> => {
	const initialValue = {} as ValidTargetingObject<T>;
	return Object.entries(obj).reduce<ValidTargetingObject<T>>(
		(valid, [key, value]) => {
			if (isValidTargeting(value)) {
				// @ts-expect-error -- isValidTargeting checks this
				valid[key] = value;
			}

			return valid;
		},
		initialValue,
	);
};
