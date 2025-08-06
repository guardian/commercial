import { isInUsa } from '@guardian/commercial-core/geo/geo-utils';
import { cmp, log } from '@guardian/libs';
import { isUserInVariant } from '../../experiments/ab';
import { admiralAdblockRecovery } from '../../experiments/tests/admiral-adblocker-recovery';
import type { GetThirdPartyTag } from '../types';

const baseAjaxUrl =
	window.guardian.config.stage === 'CODE'
		? 'https://code.api.nextgen.guardianapps.co.uk'
		: 'https://api.nextgen.guardianapps.co.uk';

/**
 * The Admiral bootstrap script should only run under the following conditions:
 *
 * - Should not run if the CMP is due to show
 * - Should only run in the US
 * - Should only run if in the variant of the AB test
 * - Should not run for content marked as: shouldHideAdverts, shouldHideReaderRevenue, isSensitive
 * - Should not run for paid-content sponsorship type (includes Hosted Content)
 * - Should not run for certain sections
 */
const shouldRun =
	cmp.hasInitialised() &&
	!cmp.willShowPrivacyMessageSync() &&
	isInUsa() &&
	(isUserInVariant(admiralAdblockRecovery, 'variant-detect') ||
		isUserInVariant(admiralAdblockRecovery, 'variant-recover')) &&
	!window.guardian.config.page.shouldHideAdverts &&
	!window.guardian.config.page.shouldHideReaderRevenue &&
	!window.guardian.config.page.isSensitive &&
	window.guardian.config.page.sponsorshipType !== 'paid-content' &&
	![
		'about',
		'info',
		'membership',
		'help',
		'guardian-live-australia',
		'gnm-archive',
		'guardian-labs',
		'thefilter',
	].includes(window.guardian.config.page.section);

/**
 * Admiral adblock recovery tag
 */
export const admiralTag: ReturnType<GetThirdPartyTag> = {
	shouldRun,
	name: 'admiral',
	async: true,
	url: `${baseAjaxUrl}/commercial/admiral-bootstrap.js`,
	beforeLoad: () =>
		log('commercial', '🛡️ Loading Admiral script on the page'),
};
