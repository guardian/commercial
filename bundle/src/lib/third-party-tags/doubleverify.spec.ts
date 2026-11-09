import { doubleVerify } from './doubleverify';

describe('doubleVerify', () => {
	it('should create a tag with correct properties', () => {
		const tag = doubleVerify({ shouldRun: true });
		expect(tag).toMatchObject({
			shouldRun: true,
			url: '//pub.dv.tech/dvtag/27703429/DV2380005/pub.js',
			name: 'doubleVerify',
		});
	});

	it('should respect shouldRun flag', () => {
		const tag = doubleVerify({ shouldRun: false });
		expect(tag.shouldRun).toBe(false);
	});
});
