import type { False, True } from './ad-targeting';
import { AsyncAdTargeting } from './get-set';

/* -- Types -- */

/**
 * #### Viewport Targeting
 *
 * Inclues values related to the viewport:
 * - size
 * - screen density (? not yet)
 * - w
 */
type ViewportTargeting = {
	/**
	 * **B**reak**p**oint – [see on Ad Manager][gam]
	 *
	 * Type: _Predefined_
	 *
	 * [gam]: https://admanager.google.com/59666047#inventory/custom_targeting/detail/custom_key_id=180327
	 */
	bp: 'mobile' | 'tablet' | 'desktop' | 'wide';
	/** Whether InSkin page skins can run. Australia-specific. */
	inskin: True | False;
	/**
	 * **Skin size**
	 *  Large or Small. Used for InSkin page skins */
	skinsize: 'l' | 's';
};

/* -- Methods -- */

const findBreakpoint = (width: number): 'mobile' | 'tablet' | 'desktop' => {
	if (width >= 980) return 'desktop';
	if (width >= 740) return 'tablet';
	return 'mobile';
};

/* -- Targeting -- */

const viewportTargeting = new AsyncAdTargeting<ViewportTargeting>();

const updateViewportTargeting = (cmpBannerWillShow: boolean): void => {
	const width = window.innerWidth;

	// Don’t show inskin if if a privacy message will be shown
	const inskin = cmpBannerWillShow ? 'f' : 't';

	viewportTargeting.set({
		bp: findBreakpoint(width),
		skinsize: width >= 1560 ? 'l' : 's',
		inskin,
	});
};
const getViewportTargeting = (): Promise<ViewportTargeting> =>
	viewportTargeting.get();

export { updateViewportTargeting, getViewportTargeting };
export type { ViewportTargeting };
