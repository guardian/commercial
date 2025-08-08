import { log } from '@guardian/libs';
import type { ComponentEvent } from '@guardian/ophan-tracker-js';
import { isUserInVariant } from '../../experiments/ab';
import { admiralAdblockRecovery } from '../../experiments/tests/admiral-adblocker-recovery';

/**
 * Fetches AB test variant name for Admiral, as there are two variants
 */
const getAdmiralAbTestVariant = (): string | undefined => {
	if (isUserInVariant(admiralAdblockRecovery, 'variant-detect')) {
		return 'variant-detect';
	}
	if (isUserInVariant(admiralAdblockRecovery, 'variant-recover')) {
		return 'variant-recover';
	}
	if (isUserInVariant(admiralAdblockRecovery, 'control')) {
		return 'control';
	}
	return undefined;
};

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
	const abTestVariant = getAdmiralAbTestVariant();

	const componentEvent: ComponentEvent = {
		component: {
			componentType: 'AD_BLOCK_RECOVERY',
			id: 'admiral-adblock-recovery',
		},
		action,
		...(value ? { value } : {}),
		...(abTestVariant
			? {
					abTest: {
						name: 'AdmiralAdblockRecovery',
						variant: abTestVariant,
					},
				}
			: {}),
	};

	window.guardian.ophan?.record({ componentEvent });
};

/**
 * Sets targeting on the Admiral object
 *
 * @param key targeting key sent to Admiral
 * @param value targeting value sent to Admiral
 */
const setAdmiralTargeting = (key: string, value: string): void => {
	log(
		'commercial',
		`🛡️ Admiral - setting targeting of key: ${key}, value: ${value}`,
	);
	window.admiral?.('targeting', 'set', key, value);
};

type MessagePickerEvent = Event & {
	detail: {
		type: string;
		winner: string | null;
	};
};
const isMessagePickerEvent = (event: Event): event is MessagePickerEvent => {
	return (
		typeof event === 'object' &&
		'detail' in event &&
		typeof event.detail === 'object' &&
		event.detail !== null &&
		'type' in event.detail &&
		'winner' in event.detail
	);
};

const setUpMessagePickerListener = () => {
	log('commercial', '🛡️ Admiral - setting up message picker listener');
	window.document.addEventListener(
		'supporterRevenue:messagePicker',
		(event: Event) => {
			if (isMessagePickerEvent(event)) {
				const { detail: { type, winner } = {} } = event;
				log(
					'commercial',
					`🛡️ Admiral - messagePicker result ${JSON.stringify({ type, winner })}`,
				);

				if (type === 'banner' && !winner) {
					setAdmiralTargeting('guBannerClash', 'false');
				} else {
					setAdmiralTargeting('guBannerClash', 'true');
				}
			}
		},
	);
};

export {
	getAdmiralAbTestVariant,
	recordAdmiralOphanEvent,
	setAdmiralTargeting,
	setUpMessagePickerListener,
};
