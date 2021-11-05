import { AsyncAdTargeting } from './get-set';

type NotSureTargeting = {
	/**
	 * **G**uar**d**ia**n** **C**ustomer **R**elation **M**anagement – [see on Ad Manager][gam]
	 *
	 * Type: _Dynamic_
	 *
	 * Sample values:
	 * - `"PXPE"`
	 * - `"PXHCI2"`
	 *
	 * [gam]: https://admanager.google.com/59666047#inventory/custom_targeting/detail/custom_key_id=184047
	 */
	gdncrm: string | string[];
	/**
	 * **M**edia **S**ource – [see on Ad Manager][gam]
	 *
	 * Type: _Dynamic_
	 *
	 * Sample values:
	 * - `"epictv"`
	 * - `"crane.tv"`
	 * - `"a-rational-fear"`
	 *
	 * [gam]: https://admanager.google.com/59666047#inventory/custom_targeting/detail/custom_key_id=186807
	 */
	ms: string;
	/**
	 * Ad **Slot** ID – [see on Ad Manager][gam]
	 *
	 * Type: _Predefined_
	 *
	 * Sample values: 'top-above-nav', 'inline-1'
	 *
	 * [gam]: https://admanager.google.com/59666047#inventory/custom_targeting/detail/custom_key_id=174447
	 */
	slot: string; // TODO: Narrow to known IDs
	/**
	 * Kru**x** user segments – [see on Ad Manager][gam]
	 *
	 * * Type: _Dynamic_
	 *
	 * [gam]: https://admanager.google.com/59666047#inventory/custom_targeting/detail/custom_key_id=200247
	 *
	 * @deprecated We no longer use Krux
	 */
	x: string;
};
const notSureTargeting = new AsyncAdTargeting<NotSureTargeting>();

const initUnsureTargeting = (unsure: NotSureTargeting): void => {
	notSureTargeting.set(unsure);
};

const getUnsureTargeting = (): Promise<NotSureTargeting> =>
	notSureTargeting.get();

export type { NotSureTargeting };
export { initUnsureTargeting, getUnsureTargeting };
