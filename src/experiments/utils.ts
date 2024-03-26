import { bypassCoreWebVitalsSampling } from '@guardian/core-web-vitals';
import { bypassCommercialMetricsSampling } from 'core/send-commercial-metrics';
import { isInVariantSynchronous } from './ab';
import { sectionAdDensity } from './tests/section-ad-density';

export const bypassMetricsSampling = (): void => {
	void bypassCommercialMetricsSampling();
	void bypassCoreWebVitalsSampling();
};

export const isInSectionAdDensityVariant = (): boolean => {
	const highValueSections = [
		'business',
		'environment',
		'music',
		'money',
		'artanddesign',
		'science',
		'stage',
		'travel',
		'wellness',
		'games',
	];
	const isInHighValueSection = highValueSections.includes(
		window.guardian.config.page.section,
	);
	const isInAbTest = isInVariantSynchronous(sectionAdDensity, 'variant');

	return isInHighValueSection && isInAbTest;
};
