import { bypassCoreWebVitalsSampling } from '@guardian/core-web-vitals';
import { bypassCommercialMetricsSampling } from 'core/send-commercial-metrics';

export const bypassMetricsSampling = (): void => {
	void bypassCommercialMetricsSampling();
	void bypassCoreWebVitalsSampling();
};
