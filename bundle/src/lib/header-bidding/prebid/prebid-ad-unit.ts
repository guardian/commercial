import type { PageTargeting } from '@guardian/commercial-core/targeting/build-page-targeting';
import type { ConsentState } from '@guardian/libs';
import { log } from '@guardian/libs';
import type { Advert } from '../../../define/Advert';
import type {
	HeaderBiddingSlot,
	PrebidBid,
	PrebidMediaTypes,
} from '../prebid-types';
import { bids } from './bidders/config';

export class PrebidAdUnit {
	code: string | null | undefined;
	bids: PrebidBid[] | null | undefined;
	mediaTypes: PrebidMediaTypes | null | undefined;
	gpid?: string;
	ortb2Imp?: {
		ext: {
			gpid: string;
			data: {
				pbadslot: string;
			};
		};
	};

	constructor(
		advert: Advert,
		slot: HeaderBiddingSlot,
		pageTargeting: PageTargeting,
		consentState: ConsentState,
	) {
		this.code = advert.id;
		this.mediaTypes = { banner: { sizes: slot.sizes } };
		this.gpid = advert.gpid ?? '';
		this.ortb2Imp = {
			ext: {
				gpid: this.gpid,
				data: {
					pbadslot: this.gpid,
				},
			},
		};

		this.bids = bids(
			advert.id,
			slot.sizes,
			pageTargeting,
			this.gpid,
			consentState,
		);

		advert.headerBiddingSizes = slot.sizes;
		log('commercial', `PrebidAdUnit ${this.code}`, this.bids);
	}

	isEmpty() {
		return this.code == null;
	}
}
