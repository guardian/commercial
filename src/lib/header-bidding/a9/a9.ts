import { flatten } from 'lodash-es';
import type { Advert } from '../../../define/Advert';
import type { A9AdUnitInterface } from '../../../types/global';
import { reportError } from '../../../utils/report-error';
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

	constructor(advert: Advert, slot: HeaderBiddingSlot) {
		this.slotID = advert.id;
		this.slotName = `${window.guardian.config.page.adUnit}/${this.slotID}`;
		this.sizes = slot.sizes.map((size) => Array.from(size));
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

	const section = window.guardian.config.page.section;

	const isNetworkFront = [
		'uk',
		'us',
		'au',
		'europe',
		'international',
	].includes(section);
	const isSectionFront = [
		'commentisfree',
		'sport',
		'culture',
		'lifeandstyle',
	].includes(section);

	/**
	 * Filters the provided ad units based on the current page context.
	 *
	 * - If the page is a network front, only the ad unit with the slot ID 'dfp-ad--inline1--mobile' is included.
	 * - If the page is a section front, only the ad unit with the slot ID 'dfp-ad--top-above-nav' is included.
	 * - If the page is not a front, all ad units are included.
	 * - There is a cross over in logic where the page is both an article as well as a network front/section front,
	 * - in this case we want to identify the page as a non-front page (arrticle) and include all ad units.
	 *
	 * @param adUnits - The array of ad units to be filtered.
	 * @returns The filtered array of ad units based on the page context.
	 */
	const updatedAdUnits = adUnits.map((adUnit) => {
		let blockedBidders: string[] = [];

		if (isNetworkFront && adUnit.slotID === 'dfp-ad--inline1--mobile') {
			blockedBidders = ['1lsxjb4']; // Block GumGum for network front condition
		} else if (
			isSectionFront &&
			adUnit.slotID === 'dfp-ad--top-above-nav'
		) {
			blockedBidders = ['1lsxjb4']; // Block GumGum for section front condition
		}

		return { ...adUnit, params: { blockedBidders } };
	});

	requestQueue = requestQueue
		.then(
			() =>
				new Promise<void>((resolve) => {
					window.apstag?.fetchBids({ slots: updatedAdUnits }, () => {
						window.googletag.cmd.push(() => {
							window.apstag?.setDisplayBids();
							resolve();
						});
					});
				}),
		)
		.catch(() => {
			reportError(new Error('a9 header bidding error'), 'commercial');
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
