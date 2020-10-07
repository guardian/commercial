import { inizio } from './inizio';

describe('index', () => {
	it('should use the feature switch option', () => {
		const inizioInstance = inizio({ shouldRun: true });
		expect(inizioInstance).toStrictEqual({
			shouldRun: true,
			url:
				'//cdn.brandmetrics.com/survey/script/e96d04c832084488a841a06b49b8fb2d.js',
			sourcepointId: '5e37fc3e56a5e6615502f9c9',
			onLoad: inizioInstance.onLoad,
		});
	});
});
