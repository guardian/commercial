import { isString } from '@guardian/libs';
import type { RegisterListener } from 'core/messenger';
import { trackNativeAdLinkClick } from '../analytics/google';

const sendClick = (adSlot: { id: string }, linkName: string): void => {
	trackNativeAdLinkClick(adSlot.id, linkName);
};

const init = (register: RegisterListener): void => {
	register('click', (linkName, ret, iframe) =>
		sendClick(
			iframe?.closest('.js-ad-slot') ?? {
				id: 'unknown',
			},
			isString(linkName) ? linkName : '',
		),
	);
};

export { init };
