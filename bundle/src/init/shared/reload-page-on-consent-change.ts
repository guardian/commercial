import { onConsentChange } from '@guardian/consent-manager';
import type { ConsentState } from '@guardian/consent-manager';

let initialConsentState: ConsentState | undefined;

/**
 * If consent has been set, and if consent then changes, reload the page so the correct
 * state is reflected in the rendered page
 */
const reloadPageOnConsentChange = (): Promise<void> => {
	onConsentChange((consent) => {
		initialConsentState ??= consent;

		if (initialConsentState.canTarget !== consent.canTarget) {
			window.location.reload();
		}
	}, true);

	return Promise.resolve();
};

export { reloadPageOnConsentChange };
