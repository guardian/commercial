import type { AdSize } from '@guardian/commercial-core/ad-sizes';
import { outstreamSizes } from '@guardian/commercial-core/ad-sizes';
import type { PageTargeting } from '@guardian/commercial-core/targeting/build-page-targeting';
import type { ConsentState } from '@guardian/consent-manager';
import { log } from '@guardian/libs';
import type {
	AdUnitBidDefinition,
	AdUnitDefinition,
} from 'prebid.js/dist/src/adUnits';
import type { MediaTypes } from 'prebid.js/dist/src/mediaTypes';
import type { Size } from 'prebid.js/dist/src/types/common';
import type { VideoMediaType } from 'prebid.js/dist/src/video';
import { isUserInTestGroup } from '../../../ab-testing';
import type { Advert } from '../../../define/Advert';
import type { HeaderBiddingSlot } from '../prebid-types';
import { bids } from './bidders/config';

/**
 * The ad sizes that are compatible for use with the mediaTypes.video property of PrebidAdUnit.
 * https://docs.prebid.org/dev-docs/adunit-reference.html#adUnit.mediaTypes
 */
const allowedVideoMediaTypeSizes: AdSize[] = Object.values(outstreamSizes);

const filterSizesForVideoMediaType = (sizes: Size[]) =>
	sizes.filter((size) =>
		allowedVideoMediaTypeSizes.some(
			(allowedSize) =>
				allowedSize[0] === size[0] && allowedSize[1] === size[1],
		),
	);

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
		const isInOzoneAbTest = isUserInTestGroup(
			'commercial-ozone-outstream',
			'variant',
		);

		this.code = advert.id;
		this.mediaTypes = {
			banner: {
				sizes: slot.sizes,
			},
			...(isInOzoneAbTest && slot.key === 'inline1'
				? {
						video: {
							playerSize: filterSizesForVideoMediaType(
								slot.sizes,
							),
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

		log('commercial', `PrebidAdUnit ${this.code}`, this.bids);
	}
}
