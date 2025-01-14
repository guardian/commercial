import { constructQuery } from './construct-query';

describe('url', () => {
	test.each([
		[{ foo: true }, 'foo=true'],
		[{ foo: 'bar', bar: true }, 'foo=bar&bar=true'],
		[{ foo: 'bar' }, 'foo=bar'],
		[{ foo: 'bar', boo: 'far' }, 'foo=bar&boo=far'],
		[{ foo: ['bar1', 'bar2'], boo: 'far' }, 'foo=bar1,bar2&boo=far'],
		[{}, ''],
	])(
		'constructQuery() - should be able to construct query',
		(input, expected) => {
			expect(constructQuery(input)).toEqual(expected);
		},
	);
});
