import type { FillAdSlot } from 'insert/spacefinder/article';
import { addInlineAds } from 'insert/spacefinder/article';
import { commercialFeatures } from 'lib/commercial-features';
import { getCurrentBreakpoint } from 'lib/detect/detect-breakpoint';
import { defineSlot } from '../define-slot';

const fillConsentlessAdSlot: FillAdSlot = (name, slot) => {
	const isMobile = getCurrentBreakpoint() === 'mobile';

	const slotKind = isMobile || name === 'inline1' ? 'inline' : 'inline-right';

	defineSlot(slot, name, slotKind);

	return Promise.resolve();
};

const initArticleInline = async (): Promise<void> => {
	// do we need to rerun for the sign-in gate?
	if (!commercialFeatures.articleBodyAdverts) {
		return;
	}

	await addInlineAds(fillConsentlessAdSlot);
};

export { initArticleInline };
