import { getCurrentBreakpoint } from '../../lib/detect/detect-breakpoint';
import { removeDisabledSlots } from '../consented/remove-slots';
import { defineSlot } from './define-slot';

const isTabletOrMobile = () => {
	const breakpoint = getCurrentBreakpoint();
	return breakpoint === 'mobile' || breakpoint === 'tablet';
};

const initFixedSlots = async (): Promise<void> => {
	await removeDisabledSlots();

	// We remove top-above-nav on both tablet and mobile for consentless
	// due to issues with ad sizing in OptOut at the tablet breakpoint
	const isDCRMobileOrTablet =
		window.guardian.config.isDotcomRendering && isTabletOrMobile();

	const adverts = [
		...document.querySelectorAll<HTMLElement>(
			'.js-ad-slot:not(.ad-slot--survey)',
		),
	]
		// we need to not init top-above-nav on mobile and tablet view in DCR
		// as the DOM element needs to be removed and replaced to be inline
		.filter(
			(adSlot) =>
				!(isDCRMobileOrTablet && adSlot.id === 'dfp-ad--top-above-nav'),
		);

	if (getCurrentBreakpoint() === 'tablet') {
		// We need to explicitly remove the element as there are no styles to hide it on tablet
		const topAboveNav = document.querySelector('.top-banner-ad-container');
		topAboveNav?.remove();
	}

	// define slots
	adverts.forEach((slotElement) => {
		const slotName = slotElement.dataset.name;
		const slotKind = slotName?.includes('inline') ? 'inline' : undefined;
		if (slotName) {
			defineSlot(slotElement, slotName, slotKind);
		}
	});

	return Promise.resolve();
};

export { initFixedSlots };
