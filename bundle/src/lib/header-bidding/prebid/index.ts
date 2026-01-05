import type { AdSize } from '@guardian/commercial-core/ad-sizes';
import { createAdSize } from '@guardian/commercial-core/ad-sizes';
import { PREBID_TIMEOUT } from '@guardian/commercial-core/constants/prebid-timeout';
import { EventTimer } from '@guardian/commercial-core/event-timer';
import type { ConsentState } from '@guardian/libs';
import { isString, log, onConsent } from '@guardian/libs';
import { flatten } from 'lodash-es';
import type { Advert } from '../../../define/Advert';
import { getAdvertById } from '../../dfp/get-advert-by-id';
import { isUserLoggedIn } from '../../identity/api';
import { getPageTargeting } from '../../page-targeting';
import type { SlotFlatMap } from '../prebid-types';
import { getHeaderBiddingAdSlots } from '../slot-config';
import {
	isSwitchedOn,
	shouldIncludeBidder,
	shouldIncludePermutive,
	stripDfpAdPrefixFrom,
} from '../utils';
import { getAnalyticsConfig } from './analytics';
import { bidderSettings as bidderSettingsForCriteo } from './bidders/criteo';
import { bidderSettings as bidderSettingsForIx } from './bidders/ix';
import { bidderSettings as bidderSettingsForKargo } from './bidders/kargo';
import { bidderSettings as bidderSettingsForOzone } from './bidders/ozone';
import { configureBidderSettings as bidderSettingsForRubicon } from './bidders/rubicon';
import { bidderSettings as bidderSettingsForXhb } from './bidders/xhb';
import { consentManagement } from './consent-management';
import { configurePermutive } from './external/permutive';
import { getUserSyncSettings } from './id-handlers';
import { PrebidAdUnit } from './prebid-ad-unit';
import { priceGranularity } from './price-config';
import type { PbjsConfig, UserSync } from './types';

let initialised = false;

const initialise = async (
	window: Window,
	consentState: ConsentState,
): Promise<void> => {
	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- ignore during v10 test
	if (!window.pbjs) {
		log('commercial', 'window.pbjs not found on window');
		return; // We couldn’t initialise
	}
	initialised = true;

	const userSync: UserSync = await getUserSyncSettings(consentState);
	const pbjsConfig: PbjsConfig = Object.assign(
		{},
		{
			/**
			 * The amount of time reserved for the auction
			 */
			bidderTimeout: PREBID_TIMEOUT,

			/**
			 * Prebid supports an additional timeout buffer to account for noisiness in
			 * timing JavaScript on the page. This value is passed to the Prebid config
			 * and is adjustable via this constant
			 */
			timeoutBuffer: 400,
			priceGranularity,
			userSync,
			ortb2: {
				site: {
					ext: {
						data: {
							keywords:
								window.guardian.config.page.keywords.split(','),
						},
					},
				},
			},
		},
	);

	if (isSwitchedOn('consentManagement')) {
		pbjsConfig.consentManagement = consentManagement(consentState);
	}

	if (shouldIncludePermutive(consentState)) {
		pbjsConfig.realTimeData = configurePermutive(consentState);
	}

	/** Helper function to decide if a bidder should be included.
	 * It is a curried function prepared with the consent state
	 * at the time of initialisation to avoid unnecessary repetition
	 * of consent state throughout */
	const isBidderEnabled = shouldIncludeBidder(consentState);

	// initialise enabled bidders
	window.pbjs.bidderSettings = {
		criteo: isBidderEnabled('criteo') ? bidderSettingsForCriteo : undefined,
		ix: isBidderEnabled('ix') ? bidderSettingsForIx : undefined,
		kargo: isBidderEnabled('kargo') ? bidderSettingsForKargo : undefined,
		magnite: isBidderEnabled('rubicon')
			? bidderSettingsForRubicon()
			: undefined,
		ozone: isBidderEnabled('ozone') ? bidderSettingsForOzone : undefined,
		xhb: isBidderEnabled('xhb') ? bidderSettingsForXhb : undefined,
	};

	// configure analytics
	const analytics = getAnalyticsConfig();
	if (analytics) window.pbjs.enableAnalytics([analytics]);

	// update config and adjust slot size when prebid ad loads
	window.pbjs.setConfig(pbjsConfig);
	window.pbjs.onEvent('bidWon', (data) => {
		const { width, height, adUnitCode } = data;

		if (!width || !height || !adUnitCode) {
			return;
		}

		const size: AdSize = createAdSize(width, height); // eg. [300, 250]
		const advert = getAdvertById(adUnitCode);

		if (!advert) {
			return;
		}

		/**
		 * when hasPrebidSize is true we use size
		 * set here when adjusting the slot size.
		 * */
		advert.hasPrebidSize = true;
		advert.size = size;
	});
};

const bidsBackHandler = (
	adUnits: PrebidAdUnit[],
	eventTimer: EventTimer,
): Promise<void> =>
	new Promise((resolve) => {
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- ignore during v10 test
		window.pbjs?.setTargetingForGPTAsync(
			adUnits.map((u) => u.code).filter(isString),
		);

		resolve();

		adUnits.forEach((adUnit) => {
			if (isString(adUnit.code)) {
				eventTimer.mark('prebidEnd', stripDfpAdPrefixFrom(adUnit.code));
			}
		});
	});

let requestQueue: Promise<void> = Promise.resolve();

// slotFlatMap allows you to dynamically interfere with the
// PrebidSlot definition for this given request for bids.
const requestBids = async (
	adverts: Advert[],
	slotFlatMap?: SlotFlatMap,
): Promise<void> => {
	if (!initialised) {
		return requestQueue;
	}

	if (!window.guardian.config.switches.prebidHeaderBidding) {
		return requestQueue;
	}

	const adUnits: PrebidAdUnit[] = await onConsent()
		.then(async (consentState: ConsentState) => {
			// calculate this once before mapping over
			const isSignedIn = await isUserLoggedIn();
			const pageTargeting = getPageTargeting(consentState, isSignedIn);
			return flatten(
				adverts.map((advert) =>
					getHeaderBiddingAdSlots(advert, slotFlatMap)
						.map(
							(slot) =>
								new PrebidAdUnit(
									advert,
									slot,
									pageTargeting,
									consentState,
								),
						)
						.filter((adUnit) => !adUnit.isEmpty()),
				),
			);
		})
		.catch((e: unknown) => {
			// silently fail
			log('commercial', 'Failed to execute prebid onConsent', e);
			return [];
		});

	const eventTimer = EventTimer.get();

	requestQueue = requestQueue.then(
		() =>
			new Promise<void>((resolve) => {
				adUnits.forEach((adUnit) => {
					if (isString(adUnit.code)) {
						eventTimer.mark(
							'prebidStart',
							stripDfpAdPrefixFrom(adUnit.code),
						);
					}
				});

				// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- ignore during v10 test
				window.pbjs?.que.push(() => {
					// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- ignore during v10 test
					void window.pbjs?.requestBids({
						adUnits,
						bidsBackHandler: () =>
							void bidsBackHandler(adUnits, eventTimer).then(
								resolve,
							),
					});
				});
			}),
	);
	return requestQueue;
};

export const prebid = { initialise, requestBids };
