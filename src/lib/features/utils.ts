import { storage } from '@guardian/libs';
import type { once } from 'lodash-es';

export type FeatureFlag = ReturnType<typeof once<() => boolean>>;

export const isUserPrefsAdsOff = (): boolean =>
	storage.local.get(`gu.prefs.switch.adverts`) === false;
