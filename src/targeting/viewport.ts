import type { False, True } from '.';

/* -- Types -- */

/**
 * #### Viewport Targeting
 *
 * Inclues values related to the viewport:
 * - size
 * - screen density (? not yet)
 * - w
 */
export type ViewportTargeting = {
	/**
	 * **B**reak**p**oint – [see on Ad Manager][gam]
	 *
	 * Type: _Predefined_
	 *
	 * [gam]: https://admanager.google.com/59666047#inventory/custom_targeting/detail/custom_key_id=180327
	 */
	bp: 'mobile' | 'tablet' | 'desktop' | 'wide';

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

const findBreakpoint = (width: number): 'mobile' | 'tablet' | 'desktop' => {
	if (width >= 980) return 'desktop';
	if (width >= 740) return 'tablet';
	return 'mobile';
};

/* -- Targeting -- */

export const getViewportTargeting = (
	cmpBannerWillShow: boolean,
): ViewportTargeting => {
	const width = window.innerWidth;

	// Don’t show inskin if if a privacy message will be shown
	const inskin = cmpBannerWillShow ? 'f' : 't';

	return {
		bp: findBreakpoint(width),
		skinsize: width >= 1560 ? 'l' : 's',
		inskin,
	};
};
