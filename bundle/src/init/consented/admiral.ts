import type { ComponentEvent } from '@guardian/ophan-tracker-js';

/**
 * Sends component events to Ophan with the componentType of `AD_BLOCK_RECOVERY`
 * as well as sending the AB test participation
 *
 * @param overrides allows overriding / setting values for `action` and `value`
 */
const recordAdmiralOphanEvent = ({
	action,
	value,
}: {
	action: ComponentEvent['action'];
	value?: ComponentEvent['value'];
}): void => {
	const componentEvent: ComponentEvent = {
		component: {
			componentType: 'AD_BLOCK_RECOVERY',
			id: 'admiral-adblock-recovery',
		},
		action,
		...(value ? { value } : {}),
	};

	window.guardian.ophan?.record({ componentEvent });
};

/**
 * Sets targeting on the Admiral object
 *
 * @param key targeting key sent to Admiral
 * @param value targeting value sent to Admiral
 */
const setAdmiralTargeting = (key: string, value: string): void =>
	window.admiral?.('targeting', 'set', key, value);

export { recordAdmiralOphanEvent, setAdmiralTargeting };
