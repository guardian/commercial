import { memoize } from 'lodash-es';

/**
 * Commercial Testing Instrument
 *
 * Returns a map { <bidderName>: true } of bidders
 * according to the pbtest URL parameter
 */
const pbTestNameMap: () => Record<string, true | undefined> = memoize(
	(): Record<string, undefined | true> =>
		new URLSearchParams(window.location.search)
			.getAll('pbtest')
			.reduce<Record<string, undefined | true>>((acc, value) => {
				acc[value] = true;
				return acc;
			}, {}),
	(): string =>
		// Same implicit parameter as the memoized function
		window.location.search,
);

type QueryStringMap = Record<
	string | number | symbol,
	string | true | undefined
>;

const queryStringToUrlVars = memoize(
	(queryString: string): QueryStringMap =>
		Array.from(new URLSearchParams(queryString).entries()) // polyfill.io guarantees URLSearchParams
			.reduce<QueryStringMap>((acc, [key, value]) => {
				acc[key] = value === '' ? true : value;
				return acc;
			}, {}),
);

/**
 * returns a map of querystrings
 * eg ?foo=bar&fizz=buzz returns {foo: 'bar', fizz: 'buzz'}
 * ?foo=bar&foo=baz returns {foo: 'baz'}
 * ?foo returns { foo: true }
 */
const getUrlVars = (query?: string): QueryStringMap =>
	queryStringToUrlVars(query ?? window.location.search);

export { getUrlVars, pbTestNameMap };
