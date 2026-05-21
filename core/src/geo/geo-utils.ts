import { __resetCachedValue, getLocale } from './get-locale';

export const isInUk = (): boolean => getLocale() === 'GB';

export const isInUsa = (): boolean => getLocale() === 'US';

export const isInCanada = (): boolean => getLocale() === 'CA';

export const isInAustralia = (): boolean => getLocale() === 'AU';

export const isInNewZealand = (): boolean => getLocale() === 'NZ';

export const isInUsOrCa = (): boolean => isInUsa() || isInCanada();

export const isInAuOrNz = (): boolean => isInAustralia() || isInNewZealand();

export const isInRow = (): boolean =>
	!isInUk() && !isInUsOrCa() && !isInAuOrNz();

export const _ = {
	resetModule: (): void => {
		__resetCachedValue();
	},
};
