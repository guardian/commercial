import type { False, True } from '../types';

/* -- Types -- */

/**
 * Viewport Targeting
 *
 * Includes values related to the viewport:
 * - breakpoint (deprecated?)
 * - whether a CMP banner will show
 * - size of page skin
 */
type ViewportTargeting = {
	/**
	 * **B**reak**p**oint – [see on Ad Manager][gam]
	 *
	 * Type: _Predefined_
	 *
	 * TODO: remove 'wide'
	 *
	 * [gam]: https://admanager.google.com/59666047#inventory/custom_targeting/detail/custom_key_id=180327
	 */
	bp: 'mobile' | 'tablet' | 'desktop';

	/**
	 * InSkin (CMP Banner shown) – [see on Ad Manager][gam]
	 *
	 * Australia-specific (via Bonzai?)
	 *
	 * Type: _Predefined_
	 *
	 * [gam]: https://admanager.google.com/59666047#inventory/custom_targeting/detail/custom_key_id=11916570
	 * */
	inskin: True | False;

	/**
	 * **Skin size** – [see on Ad Manager][gam]
	 *
	 * Large or Small. Used for InSkin page skins
	 *
	 * Type: _Predefined_
	 *
	 * [gam]: https://admanager.google.com/59666047#inventory/custom_targeting/detail/custom_key_id=12312030
	 */
	skinsize: 'l' | 's';
};

/* -- Methods -- */

const findBreakpoint = (width: number): ViewportTargeting['bp'] => {
	if (width >= 980) return 'desktop';
	if (width >= 660) return 'tablet';
	return 'mobile';
};

/* -- Targeting -- */

type Viewport = {
	viewPortWidth: number;
	cmpBannerWillShow: boolean;
};

const getViewportTargeting = ({
	viewPortWidth,
	cmpBannerWillShow,
}: Viewport): ViewportTargeting => {
	// Don’t show inskin if if a privacy message will be shown
	const inskin = cmpBannerWillShow ? 'f' : 't';

	return {
		bp: findBreakpoint(viewPortWidth),
		skinsize: viewPortWidth >= 1560 ? 'l' : 's',
		inskin,
	};
};

export type { ViewportTargeting };
export { getViewportTargeting };
