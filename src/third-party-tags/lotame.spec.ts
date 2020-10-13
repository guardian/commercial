import { lotame } from './lotame';

describe('lotame', () => {
	it('construct lotame  with correct params', () => {
		const lotameTag = lotame({ shouldRun: true });
		expect(lotameTag).toStrictEqual({
			shouldRun: true,
			url: '//tags.crwdcntrl.net/lt/c/12666/lt.min.js',
			beforeLoad: lotameTag.beforeLoad,
			name: 'lotame',
		});
	});
});
