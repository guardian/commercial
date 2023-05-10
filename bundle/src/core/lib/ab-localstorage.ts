import type { Participations } from '@guardian/ab-core';
import { isObject, isString, storage } from '@guardian/libs';

const participationsKey = 'gu.ab.participations';

const isParticipations = (
	participations: unknown,
): participations is Participations => {
	return (
		isObject(participations) &&
		Object.values(participations).every(
			(participation) =>
				isObject(participation) && isString(participation.variant),
		)
	);
};

export const getParticipationsFromLocalStorage = (): Participations => {
	const participations = storage.local.get(participationsKey);
	return isParticipations(participations) ? participations : {};
};
