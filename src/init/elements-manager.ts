import { onConsent } from '@guardian/libs';
import { initArticleBodyAdverts } from 'elements-manager/article-body-adverts';
import { ElementsManager } from 'elements-manager/elements-manager';
import { getPageTargeting } from 'lib/build-page-targeting';
import { isUserLoggedInOktaRefactor } from 'lib/identity/api';

let elementsManager: ElementsManager | undefined;

const initElementsManager = async (): Promise<ElementsManager> => {
	if (elementsManager) {
		return elementsManager;
	}

	const [consentState, isSignedIn] = await Promise.all([
		onConsent(),
		isUserLoggedInOktaRefactor(),
	]);

	const pageTargeting = getPageTargeting(consentState, isSignedIn);

	elementsManager = ElementsManager.init(pageTargeting);
	return elementsManager;
};

const getElementsManager = (): ElementsManager => {
	if (!elementsManager) {
		throw new Error('ElementsManager not initialised');
	}

	return elementsManager;
};

/**
 * Use the ElementsManager to fill all ad slots on the page
 * Only used via a url parameter, usually slots are filled when opt out does not have an ad
 */
const fillAdSlots = async (): Promise<void> => {
	const staticAdverts = getElementsManager().createStaticAdverts();

	const fillStatic = Promise.all(staticAdverts.map((ad) => ad.display()));

	const fillDynamic = initArticleBodyAdverts();

	await Promise.all([fillStatic, fillDynamic]);
};

export { initElementsManager, getElementsManager, fillAdSlots };
