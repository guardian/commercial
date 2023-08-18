import { once } from 'lodash-es';
import { getUrlVars } from 'lib/utils/url';
import type { IasPETSlot, IasTargeting } from 'types/ias';

const adUnit = once((): string => {
	const urlVars = getUrlVars();
	return urlVars['ad-unit']
		? `/${window.guardian.config.page.dfpAccountId}/${String(
				urlVars['ad-unit'],
		  )}`
		: window.guardian.config.page.adUnit;
});

const initSlotIas = (id: string, slot: googletag.Slot) => {
	/*
        For each ad slot defined, we request information from IAS, based
        on slot name, ad unit and sizes. We then add this targeting to the
        slot prior to requesting it from DFP.

        We create a timer, such that if the timeout resolves before the request
		to IAS returns, then the slot is defined without the additional IAS data.

        To see debugging output from IAS add the URL param `&iasdebug=true` to the page URL

		this should all have been instantiated by lib/third-party-tags/ias.js
	*/
	window.__iasPET = window.__iasPET ?? {};
	const iasPET = window.__iasPET;

	iasPET.queue = iasPET.queue ?? [];
	iasPET.pubId = '10249';

	// need to reorganize the type due to https://github.com/microsoft/TypeScript/issues/33591
	const slotSizes: Array<googletag.Size | 'fluid'> = slot.getSizes();

	// IAS Optimization Targeting
	const iasPETSlots: IasPETSlot[] = [
		{
			adSlotId: id,
			size: slotSizes
				.filter(
					(size: 'fluid' | googletag.Size): size is googletag.Size =>
						size !== 'fluid',
				)
				.map((size) => [size.getWidth(), size.getHeight()]),
			adUnitPath: adUnit(), // why do we have this method and not just slot.getAdUnitPath()?
		},
	];

	// this is stored so that the timeout can be cancelled in the event of IAS not timing out
	let timeoutId: NodeJS.Timeout;

	// this is resolved by either the iasTimeout or iasDataCallback, defined below
	let loadedResolve: () => void;
	const iasDataPromise = new Promise<void>((resolve) => {
		loadedResolve = resolve;
	});

	const iasDataCallback = (targetingJSON: string) => {
		clearTimeout(timeoutId);

		/*  There is a name-clash with the `fr` targeting returned by IAS
                and the `fr` paramater we already use for frequency. Therefore
                we apply the targeting to the slot ourselves and rename the IAS
                fr parameter to `fra` (given that, here, it relates to fraud).
            */
		const targeting = JSON.parse(targetingJSON) as IasTargeting;

		// brand safety is on a page level
		Object.keys(targeting.brandSafety).forEach((key) => {
			const brandSafetyValue = targeting.brandSafety[key];
			if (brandSafetyValue) {
				window.googletag.pubads().setTargeting(key, brandSafetyValue);
			}
		});
		if (targeting.fr) {
			window.googletag.pubads().setTargeting('fra', targeting.fr);
		}
		if (targeting.custom?.['ias-kw']) {
			window.googletag
				.pubads()
				.setTargeting('ias-kw', targeting.custom['ias-kw']);
		}

		// viewability targeting is on a slot level
		const ignoredKeys = ['pub'];
		const slotTargeting = targeting.slots[id];

		/* eslint-disable @typescript-eslint/no-unnecessary-condition -- TODO temporary until no unchecked index access can be turned on */
		if (slotTargeting) {
			Object.keys(slotTargeting)
				.filter((x) => !ignoredKeys.includes(x))
				.forEach((key) => {
					const targetingSlot = targeting.slots[id];

					if (targetingSlot) {
						const targetingValue = targetingSlot[key];

						if (slot && targetingValue) {
							slot.setTargeting(key, targetingValue);
						}
					}
				});
		}
		/* eslint-enable @typescript-eslint/no-unnecessary-condition */

		loadedResolve();
	};

	iasPET.queue.push({
		adSlots: iasPETSlots,
		dataHandler: iasDataCallback,
	});

	const iasTimeoutDuration = 1000;

	const iasTimeout = () =>
		new Promise<void>((resolve) => {
			timeoutId = setTimeout(resolve, iasTimeoutDuration);
		});

	return Promise.race([iasTimeout(), iasDataPromise]);
};

export { initSlotIas };
