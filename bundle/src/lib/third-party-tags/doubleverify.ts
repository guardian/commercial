import type { GetThirdPartyTag } from '../types';
import { installOnDvtagReady } from './doubleverify-helper';
import { markDvActive } from './doubleverify-state';

/**
 * Double-Verify script filters bad ads
 * @param  {} {shouldRun}
 */
export const doubleVerify: GetThirdPartyTag = ({ shouldRun }) => ({
	shouldRun,
	url: '//pub.dv.tech/dvtag/27703429/DV2380005/pub.js',
	name: 'doubleVerify',
	beforeLoad: () => {
		markDvActive();
		installOnDvtagReady();
	},
});
