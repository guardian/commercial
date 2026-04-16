import { isAdFree } from './ad-free';

// Having a constructor means we can easily re-instantiate the object in a test
class CommercialFeatures {
	adFree: boolean;

	constructor() {
		this.adFree = isAdFree();
	}
}

export const commercialFeatures = new CommercialFeatures();
export type CommercialFeaturesConstructor = typeof CommercialFeatures;
