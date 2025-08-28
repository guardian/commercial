import { isUserInVariant } from '../experiments/ab';
import { disableChildDirected } from '../experiments/tests/disable-child-directed';
import { isSwitchedOn } from '../lib/header-bidding/utils';

/* setPrivacySettings when the condition is met will keep the value false
 * but when the condition changes and is not met anymore
 * we need to reset it by passing null to clear the configuration
 */
export const disableChildDirectedTreatment = () =>
	isSwitchedOn('disableChildDirected') &&
	isUserInVariant(disableChildDirected, 'variant')
		? window.googletag.pubads().setPrivacySettings({
				childDirectedTreatment: false,
			})
		: window.googletag.pubads().setPrivacySettings({
				childDirectedTreatment: null,
			});
