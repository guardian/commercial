import { bypassCoreWebVitalsSampling } from '@guardian/core-web-vitals';
import { bypassCommercialMetricsSampling } from '@guardian/commercial';

export const bypassMetricsSampling = (): void => {
	void bypassCommercialMetricsSampling();
	void bypassCoreWebVitalsSampling();
};
