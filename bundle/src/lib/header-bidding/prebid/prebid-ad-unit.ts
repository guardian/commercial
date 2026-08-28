import { outstreamSizes } from '@guardian/commercial-core/ad-sizes';
import type { PageTargeting } from '@guardian/commercial-core/targeting/build-page-targeting';
import type { ConsentState } from '@guardian/consent-manager';
import { log } from '@guardian/libs';
import type {
	AdUnitBidDefinition,
	AdUnitDefinition,
} from 'prebid.js/dist/src/adUnits';
import type { MediaTypes } from 'prebid.js/dist/src/mediaTypes';
import type { VideoMediaType } from 'prebid.js/dist/src/video';
import type { Advert } from '../../../define/Advert';
import type { HeaderBiddingSlot } from '../prebid-types';
import { isOutstreamOzone } from '../utils';
import { bids } from './bidders/config';

export class PrebidAdUnit implements AdUnitDefinition {
	code: string;
	bids: AdUnitBidDefinition[];
	mediaTypes: MediaTypes;
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
		const bannerSizes = slot.sizes.filter(
			(size) => !isOutstreamOzone(size),
		);

		const useVideoMediaType =
			slot.key === 'inline1' &&
			slot.sizes.some((size) => isOutstreamOzone(size));

		this.code = advert.id;
		this.mediaTypes = {
			banner: {
				sizes: bannerSizes,
			},
			...(useVideoMediaType
				? {
						video: {
							playerSize: outstreamSizes.outstreamOzone.toArray(),
							mimes: ['video/mp4'],
							context: 'outstream',
							placement: 3, // in-article
							plcmt: 4, // outstream
						} as VideoMediaType,
					}
				: {}),
		};
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

		log(
			'commercial',
			`PrebidAdUnit ${this.code}`,
			this.mediaTypes,
			this.bids,
		);
	}
}
