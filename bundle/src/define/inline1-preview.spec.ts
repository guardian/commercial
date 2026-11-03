import { renderInline1Preview } from './inline1-preview';

describe('renderInline1Preview', () => {
	const onRender = jest.fn();
	const originalUrl = window.location.href;

	beforeEach(() => {
		jest.useFakeTimers();
		document.addEventListener('commercial.sdc-render', onRender);
	});

	afterEach(() => {
		document.removeEventListener('commercial.sdc-render', onRender);
		document.body.innerHTML = '';
		window.history.replaceState(null, '', originalUrl);
		jest.clearAllTimers();
		jest.useRealTimers();
		jest.clearAllMocks();
	});

	it.each(['', '?simulate-inline1=false'])(
		'does not render a preview with query %s',
		(query) => {
			window.history.replaceState(null, '', `/${query}`);
			const element = document.createElement('div');
			element.id = 'dfp-ad--inline1';

			expect(renderInline1Preview(element)).toBe(false);

			expect(onRender).not.toHaveBeenCalled();
			expect(element.classList.contains('ad-slot--rendered')).toBe(false);
			expect(jest.getTimerCount()).toBe(0);
		},
	);

	it('dispatches the preview props in a bubbling event on inline1', () => {
		window.history.replaceState(null, '', '/?simulate-inline1=true');
		const element = document.createElement('div');
		element.id = 'dfp-ad--inline1';
		document.body.appendChild(element);

		expect(renderInline1Preview(element)).toBe(true);

		expect(onRender).toHaveBeenCalledTimes(1);
		expect(onRender).toHaveBeenCalledWith(
			expect.objectContaining({
				target: document.getElementById('dfp-ad--inline1'),
				bubbles: true,
				detail: {
					props: {
						variant: {
							name: 'control',
							message: {
								type: 'Inline1SupportMessage',
								heading:
									'Support fearless, independent journalism',
								body: 'Please subscribe for unlimited access to our award-winning app and support the Guardian’s independent journalism.',
								primaryCta: {
									text: 'Support us',
									baseUrl: '',
								},
							},
						},
					},
				},
			}),
		);
		expect(element.classList.contains('ad-slot--rendered')).toBe(true);
		expect(jest.getTimerCount()).toBe(0);
	});

	it('does not render a preview for another slot', () => {
		window.history.replaceState(null, '', '/?simulate-inline1=true');
		const element = document.createElement('div');
		element.id = 'dfp-ad--inline2';
		document.body.appendChild(element);

		expect(renderInline1Preview(element)).toBe(false);
		expect(onRender).not.toHaveBeenCalled();
		expect(element.classList.contains('ad-slot--rendered')).toBe(false);
	});

	it('renders each slot element only once', () => {
		window.history.replaceState(null, '', '/?simulate-inline1=true');
		const element = document.createElement('div');
		element.id = 'dfp-ad--inline1';
		document.body.appendChild(element);

		expect(renderInline1Preview(element)).toBe(true);
		expect(renderInline1Preview(element)).toBe(true);
		expect(onRender).toHaveBeenCalledTimes(1);
		expect(jest.getTimerCount()).toBe(0);
	});
});
