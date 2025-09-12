import {
	isInAustralia,
	isInUk,
	isInUsa,
} from '@guardian/commercial-core/geo/geo-utils';
import { _, inizio } from './inizio';

jest.mock('@guardian/commercial-core/geo/geo-utils', () => ({
	isInUk: jest.fn(() => false),
	isInUsa: jest.fn(() => false),
	isInAustralia: jest.fn(() => false),
}));

describe('index', () => {
	it('should use the feature switch option', () => {
		(isInUk as jest.Mock).mockReturnValue(true);
		(isInUsa as jest.Mock).mockReturnValue(false);
		(isInAustralia as jest.Mock).mockReturnValue(false);

		const inizioInstance = inizio({ shouldRun: true });

		expect(inizioInstance).toMatchObject({
			shouldRun: true,
			url: '//cdn.brandmetrics.com/tag/c3330059-9ad5-4d32-8e7a-e9f6c7d74957/the_guardian_uk.js',
			name: 'inizio',
		});
	});
});

describe('scriptBasedOnRegion', () => {
	beforeEach(() => {
		jest.resetAllMocks();
	});

	it('should return UK script URL when user is in UK', () => {
		(isInUk as jest.Mock).mockReturnValue(true);
		(isInUsa as jest.Mock).mockReturnValue(false);
		(isInAustralia as jest.Mock).mockReturnValue(false);

		const result = inizio({ shouldRun: true });

		expect(result.url).toBe(
			'//cdn.brandmetrics.com/tag/c3330059-9ad5-4d32-8e7a-e9f6c7d74957/the_guardian_uk.js',
		);
		expect(isInUk).toHaveBeenCalled();
	});

	it('should return US script URL when user is in USA', () => {
		(isInUk as jest.Mock).mockReturnValue(false);
		(isInUsa as jest.Mock).mockReturnValue(true);
		(isInAustralia as jest.Mock).mockReturnValue(false);

		const result = inizio({ shouldRun: true });

		expect(result.url).toBe(
			'//cdn.brandmetrics.com/tag/c3330059-9ad5-4d32-8e7a-e9f6c7d74957/the_guardian_us.js',
		);
		expect(isInUsa).toHaveBeenCalled();
	});

	it('should return Australia script URL when user is in Australia', () => {
		(isInUk as jest.Mock).mockReturnValue(false);
		(isInUsa as jest.Mock).mockReturnValue(false);
		(isInAustralia as jest.Mock).mockReturnValue(true);

		const result = inizio({ shouldRun: true });

		expect(result.url).toBe(
			'//cdn.brandmetrics.com/tag/c3330059-9ad5-4d32-8e7a-e9f6c7d74957/the_guardian_au.js',
		);
		expect(isInAustralia).toHaveBeenCalled();
	});

	it('should return empty string when user is not in any supported region', () => {
		(isInUk as jest.Mock).mockReturnValue(false);
		(isInUsa as jest.Mock).mockReturnValue(false);
		(isInAustralia as jest.Mock).mockReturnValue(false);

		const result = inizio({ shouldRun: true });

		expect(result.url).toBe('');
		expect(isInUk).toHaveBeenCalled();
		expect(isInUsa).toHaveBeenCalled();
		expect(isInAustralia).toHaveBeenCalled();
	});
});

describe('handleQuerySurveyDone', () => {
	console.log = jest.fn();
	const setTargeting = jest.fn();

	describe('mock googletag', () => {
		beforeAll(() => {
			const googletag = {
				cmd: {
					push: (callback: () => void) => {
						callback();
					},
				},
				pubads: () => ({
					setTargeting,
				}),
			};
			Object.defineProperty(window, 'googletag', {
				configurable: true,
				enumerable: true,
				value: googletag,
				writable: true,
			});
		});

		it('setTargeting and logging called when survey available', () => {
			_.handleQuerySurveyDone(true, { measurementId: 'xyz' });
			expect(console.log).toHaveBeenCalledWith('surveyAvailable: xyz');
			expect(setTargeting).toHaveBeenLastCalledWith('inizio', 't');
		});

		it('setTargeting and logging not called when survey not available', () => {
			_.handleQuerySurveyDone(false, { measurementId: 'xyz' });
			expect(console.log).toHaveBeenCalledTimes(0);
			expect(setTargeting).toHaveBeenCalledTimes(0);
		});
	});

	describe('undefined googletag', () => {
		beforeAll(() => {
			Object.defineProperty(window, 'googletag', {
				configurable: true,
				enumerable: true,
				value: undefined,
				writable: true,
			});
		});
		it('survey available and setTargeting not called', () => {
			_.handleQuerySurveyDone(true, { measurementId: 'xyz' });
			expect(console.log).toHaveBeenCalledWith('surveyAvailable: xyz');
			expect(setTargeting).toHaveBeenCalledTimes(0);
		});
	});
});

describe('onLoad', () => {
	it('onLoad not called leaves _brandmetrics undefined', () => {
		expect(window._brandmetrics).toBe(undefined);
	});

	it('onLoad called populates _brandmetrics', () => {
		_.onLoad();
		expect(window._brandmetrics).toHaveLength(1);
		expect(window._brandmetrics).toMatchObject([
			{
				cmd: '_querySurvey',
			},
		]);
	});
});
