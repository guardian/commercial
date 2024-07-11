import type { Participations } from '@guardian/ab-core';
// import { testAndParticipationsToVariant } from './ab-utils';

export const getForcedParticipationsFromUrl = (): Participations => {
	if (window.location.hash.startsWith('#ab')) {
		const tokens = window.location.hash.replace('#ab-', '').split(',');

		return tokens.reduce((obj, token) => {
			const [testId, variantId] = token.split('=');
			if (testId && variantId) {
				return {
					...obj,
					[testId]: {
						variant: variantId,
					},
				};
			}
			return obj;
		}, {});
	}

	return {};
};
