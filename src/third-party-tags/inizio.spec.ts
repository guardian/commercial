import { handleQuerySurveyDone, inizio, onLoad } from './inizio';

describe('index', () => {
	it('should use the feature switch option', () => {
		const inizioInstance = inizio({ shouldRun: true });
		expect(inizioInstance).toMatchObject({
			shouldRun: true,
			url: '//cdn.brandmetrics.com/survey/script/e96d04c832084488a841a06b49b8fb2d.js',
			name: 'inizio',
		});
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
			handleQuerySurveyDone(true, { measurementId: 'xyz' });
			expect(console.log).toHaveBeenCalledWith('surveyAvailable: xyz');
			expect(setTargeting).toHaveBeenLastCalledWith('inizio', 't');
		});

		it('setTargeting and logging not called when survey available', () => {
			handleQuerySurveyDone(false, { measurementId: 'xyz' });
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
			handleQuerySurveyDone(true, { measurementId: 'xyz' });
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
		onLoad();
		expect(window._brandmetrics).toHaveLength(1);
		expect(window._brandmetrics).toMatchObject([
			{
				cmd: '_querySurvey',
			},
		]);
	});
});
