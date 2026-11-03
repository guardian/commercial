import { reportError } from '../lib/error/report-error';
import { sdc } from '../lib/header-bidding/sdc/sdc';

const requestedPreviews = new WeakSet<HTMLElement>();

export const renderInline1Preview = (element: HTMLElement): boolean => {
	const simulate = new URLSearchParams(window.location.search).get(
		'simulate-inline1',
	);
	if (
		element.id !== 'dfp-ad--inline1' ||
		(simulate !== '' && simulate !== 'true')
	) {
		return false;
	}

	if (requestedPreviews.has(element)) {
		return true;
	}

	requestedPreviews.add(element);
	void sdc
		.getInline1Data()
		.then((response) => {
			if (!response.data) {
				throw new Error('SDC returned no Inline1 test for the preview');
			}

			element.classList.add('ad-slot--rendered');
			element.dispatchEvent(
				new CustomEvent('commercial.sdc-render', {
					detail: {
						props: response.data.module.props,
					},
					bubbles: true,
				}),
			);
		})
		.catch((error: unknown) => {
			requestedPreviews.delete(element);
			reportError(error, 'commercial', { slot: element.id });
		});
	return true;
};
