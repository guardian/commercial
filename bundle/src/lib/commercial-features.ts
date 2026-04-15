import { isAdFree } from './ad-free';
import { isSecureContactPage } from './is-secure-contact';

// Having a constructor means we can easily re-instantiate the object in a test
class CommercialFeatures {
	adFree: boolean;
	comscore: boolean;

	constructor() {
		const isIdentityPage =
			window.guardian.config.page.contentType === 'Identity' ||
			window.guardian.config.page.section === 'identity'; // needed for pages under profile.* subdomain

		this.adFree = isAdFree();

		this.comscore =
			!!window.guardian.config.switches.comscore &&
			!isIdentityPage &&
			!isSecureContactPage();
	}
}

export const commercialFeatures = new CommercialFeatures();
export type CommercialFeaturesConstructor = typeof CommercialFeatures;
