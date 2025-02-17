import { flatten } from 'lodash-es';
import type { Advert } from '../../../define/Advert';
import { reportError } from '../../../lib/error/report-error';
import type { A9AdUnitInterface } from '../../../types/global';
import type { HeaderBiddingSlot, SlotFlatMap } from '../prebid-types';
import { getHeaderBiddingAdSlots } from '../slot-config';
/*
 * Amazon's header bidding javascript library
 * https://ams.amazon.com/webpublisher/uam/docs/web-integration-documentation/integration-guide/javascript-guide/display.html
 */
class A9AdUnit implements A9AdUnitInterface {
	slotID: string;
	slotName?: string;
	sizes: number[][];
	blockedBidders: string[];

	constructor(advert: Advert, slot: HeaderBiddingSlot) {
		this.slotID = advert.id;
		this.slotName = window.guardian.config.page.adUnit;
		this.sizes = slot.sizes.map((size) => Array.from(size));
		this.blockedBidders = [];
	}
}

let initialised = false;
let requestQueue = Promise.resolve();

const bidderTimeout = 1500;

const initialise = (): void => {
	if (!initialised && window.apstag) {
		initialised = true;

		window.apstag.init({
			pubID: window.guardian.config.page.a9PublisherId,
			adServer: 'googletag',
			bidTimeout: bidderTimeout,
		});
	}
};

// slotFlatMap allows you to dynamically interfere with the PrebidSlot definition
// for this given request for bids.
const requestBids = async (
	adverts: Advert[],
	slotFlatMap?: SlotFlatMap,
): Promise<void> => {
	if (!initialised) {
		return requestQueue;
	}

	if (!window.guardian.config.switches.a9HeaderBidding) {
		return requestQueue;
	}

	const adUnits = flatten(
		adverts.map((advert) =>
			getHeaderBiddingAdSlots(advert, slotFlatMap).map(
				(slot) => new A9AdUnit(advert, slot),
			),
		),
	);

	if (adUnits.length === 0) {
		return requestQueue;
	}

	// so now we need to look over the `adunits` and check their slotID
	// so that we can block the bidders that we want to block based on the slotID

	const section = window.guardian.config.page.section;
	const isFront = window.guardian.config.page.isFront;

	const isNetworkFront =
		isFront &&
		['uk', 'us', 'au', 'europe', 'international'].includes(section);

	const isSectionFront =
		isFront &&
		['commentisfree', 'sport', 'culture', 'lifeandstyle'].includes(section);

	/**
	 * Filters the provided ad units based on the current page context.
	 * - If the page is a network front, only the ad unit with the slot ID 'dfp-ad--inline1--mobile' is included.
	 * - If the page is a section front, only the ad unit with the slot ID 'dfp-ad--top-above-nav' is included.
	 * - If the page is not a front, all ad units are included.
	 * - There is a cross over in logic where the page is both an article as well as a network front/section front,
	 * - in this case we want to identify the page as a non-front page (article) and include all ad units.
	 *
	 * @param adUnits - The array of ad units to be filtered.
	 * @returns The filtered array of ad units based on the page context.
	 */

	const shouldUnblockBidders = (adUnit: A9AdUnit): string[] => {
		return (isNetworkFront &&
			adUnit.slotID === 'dfp-ad--inline1--mobile') ||
			(isSectionFront && adUnit.slotID === 'dfp-ad--top-above-nav')
			? []
			: ['1lsxjb4'];
	};

	const updatedAdUnits = adUnits.map((adUnit) => {
		return {
			...adUnit,
			blockedBidders: shouldUnblockBidders(adUnit),
		};
	});

	updatedAdUnits.forEach((adUnit) => {
		requestQueue = requestQueue
			.then(
				() =>
					new Promise<void>((resolve) => {
						window.apstag?.fetchBids(
							{
								slots: [adUnit],
								blockedBidders: adUnit.blockedBidders,
							},
							() => {
								window.googletag.cmd.push(() => {
									window.apstag?.setDisplayBids();
									resolve();
								});
							},
						);
					}),
			)
			.catch(() => {
				reportError(new Error('a9 header bidding error'), 'commercial');
			});
	});

	return requestQueue;
};

export const a9 = {
	initialise,
	requestBids,
};

export const _ = {
	resetModule: (): void => {
		initialised = false;
		requestQueue = Promise.resolve();
	},
};
