import pbjs from '@guardian/prebid.js';
import { isUserInVariant } from '../../experiments/ab';
import { regionSpecificPrebid } from '../../experiments/tests/region-specific-prebid';
import { isInAuOrNz, isInUk, isInUsa } from '../../lib/geo/geo-utils';

const prebidVersion = () => {
	if (isUserInVariant(regionSpecificPrebid, 'variant')) {
		if (isInUk()) {
			return 'uk';
		} else if (isInAuOrNz()) {
			return 'aus-nz';
		} else if (isInUsa()) {
			return 'us';
		}
		return 'row';
	}
	return 'all';
};

void (async () => {
	await import(
		/* webpackChunkName: "prebid-[request]" */
		`./prebid-modules/${prebidVersion()}`
	);

	pbjs.processQueue();
})();

export { pbjs };
