import type { MaybeArray } from '../types';

const constructQuery = (
	query: Record<string, MaybeArray<string | number | boolean>>,
): string =>
	Object.entries(query)
		.map(([key, value]) => {
			const queryValue = Array.isArray(value)
				? value.map((v) => encodeURIComponent(v)).join(',')
				: encodeURIComponent(value);
			return `${key}=${queryValue}`;
		})
		.join('&');

export { constructQuery };
