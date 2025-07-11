import { bypassCoreWebVitalsSampling } from '@guardian/core-web-vitals';
import { bypassCommercialMetricsSampling } from '@guardian/commercial-core';

export const bypassMetricsSampling = (): void => {
	void bypassCommercialMetricsSampling();
	void bypassCoreWebVitalsSampling();
};
