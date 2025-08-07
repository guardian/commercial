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
 * Sets targeting on the Admiral object
 *
 * @param key targeting key sent to Admiral
 * @param value targeting value sent to Admiral
 */
const setAdmiralTargeting = (key: string, value: string): void =>
	window.admiral?.('targeting', 'set', key, value);

export { getAdmiralAbTestVariant, setAdmiralTargeting };
