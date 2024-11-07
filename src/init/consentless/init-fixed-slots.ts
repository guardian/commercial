import { getCurrentBreakpoint } from '../../lib/detect/detect-breakpoint';
import { removeDisabledSlots } from '../consented/remove-slots';
import { defineSlot } from './define-slot';

const initFixedSlots = async (): Promise<void> => {
	await removeDisabledSlots();

	const isDCRMobile =
		window.guardian.config.isDotcomRendering &&
		getCurrentBreakpoint() === 'mobile';

	const adverts = [
		...document.querySelectorAll<HTMLElement>(
			'.js-ad-slot:not(.ad-slot--survey)',
		),
	]
		// we need to not init top-above-nav on mobile view in DCR
		// as the DOM element needs to be removed and replaced to be inline
		.filter(
			(adSlot) => !(isDCRMobile && adSlot.id === 'dfp-ad--top-above-nav'),
		);

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
