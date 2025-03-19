import { bypassCoreWebVitalsSampling } from '@guardian/core-web-vitals';
import { bypassCommercialMetricsSampling } from '../lib/send-commercial-metrics';

export const bypassMetricsSampling = (): void => {
	void bypassCommercialMetricsSampling();
	void bypassCoreWebVitalsSampling();
};
