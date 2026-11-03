import { reportError } from '../lib/error/report-error';
import { inline1Response } from '../lib/header-bidding/sdc/fixtures';
import { sdc } from '../lib/header-bidding/sdc/sdc';
import { renderInline1Preview } from './inline1-preview';

jest.mock('../lib/header-bidding/sdc/sdc', () => ({
	sdc: { getInline1Data: jest.fn() },
}));
jest.mock('../lib/error/report-error', () => ({
	reportError: jest.fn(),
}));

describe('renderInline1Preview', () => {
	const onRender = jest.fn();
	const originalUrl = window.location.href;

	beforeEach(() => {
		jest.useFakeTimers();
		jest.mocked(sdc.getInline1Data).mockResolvedValue(inline1Response);
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
			expect(sdc.getInline1Data).not.toHaveBeenCalled();
			expect(element.classList.contains('ad-slot--rendered')).toBe(false);
			expect(jest.getTimerCount()).toBe(0);
		},
	);

	it.each(['?simulate-inline1', '?simulate-inline1=true'])(
		'dispatches the selected SDC props in a bubbling event with query %s',
		async (query) => {
			window.history.replaceState(null, '', `/${query}`);
			const element = document.createElement('div');
			element.id = 'dfp-ad--inline1';
			document.body.appendChild(element);

			expect(renderInline1Preview(element)).toBe(true);
			expect(onRender).not.toHaveBeenCalled();
			expect(element.classList.contains('ad-slot--rendered')).toBe(false);
			await Promise.resolve();

			expect(sdc.getInline1Data).toHaveBeenCalledTimes(1);
			expect(onRender).toHaveBeenCalledTimes(1);
			expect(onRender).toHaveBeenCalledWith(
				expect.objectContaining({
					target: document.getElementById('dfp-ad--inline1'),
					bubbles: true,
					detail: {
						props: inline1Response.data?.module.props,
					},
				}),
			);
			expect(element.classList.contains('ad-slot--rendered')).toBe(true);
			expect(jest.getTimerCount()).toBe(0);
		},
	);

	it('does not render a preview for another slot', () => {
		window.history.replaceState(null, '', '/?simulate-inline1=true');
		const element = document.createElement('div');
		element.id = 'dfp-ad--inline2';
		document.body.appendChild(element);

		expect(renderInline1Preview(element)).toBe(false);
		expect(onRender).not.toHaveBeenCalled();
		expect(sdc.getInline1Data).not.toHaveBeenCalled();
		expect(element.classList.contains('ad-slot--rendered')).toBe(false);
	});

	it('requests and renders each slot element only once', async () => {
		window.history.replaceState(null, '', '/?simulate-inline1=true');
		const element = document.createElement('div');
		element.id = 'dfp-ad--inline1';
		document.body.appendChild(element);

		expect(renderInline1Preview(element)).toBe(true);
		expect(renderInline1Preview(element)).toBe(true);
		expect(sdc.getInline1Data).toHaveBeenCalledTimes(1);
		await Promise.resolve();
		expect(renderInline1Preview(element)).toBe(true);
		expect(sdc.getInline1Data).toHaveBeenCalledTimes(1);
		expect(onRender).toHaveBeenCalledTimes(1);
		expect(jest.getTimerCount()).toBe(0);
	});

	it.each([
		['an empty response', undefined],
		['a failed request', new Error('SDC unavailable')],
	])('reports %s without rendering hardcoded content', async (_, error) => {
		window.history.replaceState(null, '', '/?simulate-inline1=true');
		const element = document.createElement('div');
		element.id = 'dfp-ad--inline1';
		document.body.appendChild(element);
		if (error) {
			jest.mocked(sdc.getInline1Data).mockRejectedValueOnce(error);
		} else {
			jest.mocked(sdc.getInline1Data).mockResolvedValueOnce({});
		}

		expect(renderInline1Preview(element)).toBe(true);
		await Promise.resolve();
		await Promise.resolve();

		expect(reportError).toHaveBeenCalledWith(
			error ?? new Error('SDC returned no Inline1 test for the preview'),
			'commercial',
			{ slot: element.id },
		);
		expect(onRender).not.toHaveBeenCalled();
		expect(element.classList.contains('ad-slot--rendered')).toBe(false);

		// A later slot discovery can retry the failed request.
		expect(renderInline1Preview(element)).toBe(true);
		await Promise.resolve();
		expect(onRender).toHaveBeenCalledTimes(1);
	});
});
