import {
	getConsentFor,
	onConsentChange,
} from '@guardian/consent-management-platform';
import config from '@guardian/frontend/static/src/javascripts/lib/config';
import { getLocale, loadScript } from '@guardian/libs';

const loadIpsosScript = () => {
	window.dm = window.dm || { AjaxData: [] };
	window.dm.AjaxEvent = (et, d, ssid, ad) => {
		window.dm.AjaxData.push({ et, d, ssid, ad });
		if (window.DotMetricsObj) {
			window.DotMetricsObj.onAjaxDataUpdate();
		}
	};
	const ipsosSource = `https://uk-script.dotmetrics.net/door.js?d=${
		document.location.host
	}&t=${config.get('page.ipsosTag')}`;

	return loadScript(ipsosSource, {
		id: 'ipsos',
		async: true,
		type: 'text/javascript',
	});
};

export const init = () => {
	getLocale().then((locale) => {
		if (locale === 'GB') {
			onConsentChange((state) => {
				if (getConsentFor('ipsos', state)) {
					return loadIpsosScript();
				}
			});
		}
	});

	return Promise.resolve();
};
