import { flatten } from 'lodash-es';
import type { Advert } from '../../../define/Advert';
import { isUserInVariant } from '../../../experiments/ab';
import { a9BidResponseWinner } from '../../../experiments/tests/a9-bid-response-winner';
import { reportError } from '../../../lib/error/report-error';
import type {
	A9AdUnitInterface,
	FetchBidResponse,
} from '../../../types/global';
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
		this.slotName = window.guardian.config.page.adUnit;
		this.sizes = slot.sizes.map((size) => Array.from(size));
	}
}

let initialised = false;
let requestQueue = Promise.resolve();

const bidderTimeout = 1500;

const initialise = (): void => {
	if (!initialised && window.apstag) {
		initialised = true;
		const blockedBidders = window.guardian.config.page.isFront
			? [
					'1lsxjb4', // GumGum, as they have been showing wonky formats on fronts
				]
			: [];
		window.apstag.init({
			pubID: window.guardian.config.page.a9PublisherId,
			adServer: 'googletag',
			bidTimeout: bidderTimeout,
			blockedBidders,
		});
	}
};

const logA9BidResponse = (bidResponse: FetchBidResponse[]): void => {
	const isInA9BidResponseWinnerTest = isUserInVariant(
		a9BidResponseWinner,
		'variant',
	);
	if (isInA9BidResponseWinnerTest) {
		window.guardian.commercial ??= {};
		window.guardian.commercial.a9WinningBids ??= [];
		window.guardian.commercial.a9WinningBids.push(...bidResponse);
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

	requestQueue = requestQueue
		.then(
			() =>
				new Promise<void>((resolve) => {
					window.apstag?.fetchBids(
						{ slots: adUnits },
						(bidResponse) => {
							logA9BidResponse(bidResponse);
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

	return requestQueue;
};

export const a9 = {
	initialise,
	requestBids,
	logA9BidResponse,
};

export const _ = {
	resetModule: (): void => {
		initialised = false;
		requestQueue = Promise.resolve();
	},
};
