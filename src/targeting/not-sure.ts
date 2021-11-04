import { AsyncAdTargeting } from './get-set';

type NotSureTargeting = {
	/**
	 * **G**uar**d**ia**n** **C**ustomer **R**elation **M**anagement - [see on Ad Manager][gam]
	 *
	 * Type: *Dynamic*
	 *
	 * Sample values:
	 * - `"PXPE"`
	 * - `"PXHCI2"`
	 *
	 * [gam]: https://example.com/
	 */
	gdncrm: string | string[];
	/** **M**edia **S**ource - [see on Ad Manager][gam]
	 *
	 * Type: *Dynamic*
	 *
	 * Sample values:
	 * - `"epictv"`
	 * - `"crane.tv"`
	 * - `"a-rational-fear"`
	 *
	 * [gam]: https://example.com
	 */
	ms: string;
	/**
	 * Ad **Slot** ID
	 *
	 * Type: *Predefined*
	 *
	 * Sample values: 'top-above-nav', 'inline-1'
	 *
	 * [gam]: https://example.com/
	 */
	slot: string; // TODO: Narrow to known IDs
	/**
	 * kruX user segments
	 * https://example.com/
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
