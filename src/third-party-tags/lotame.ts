import { lotameScript } from '../__vendor/lotame-script';
import type { GetThirdPartyTag, LotameData } from '../types';

let lotameData: LotameData;

const ozoneLotameCallback = (obj: {
	getAudiences: () => string[];
	getProfileId: () => string;
}) => {
	lotameData = {
		ozoneLotameData: obj.getAudiences(),
		ozoneLotameProfileId: obj.getProfileId(),
	};
};

const beforeLoad = () => {
	lotameScript(ozoneLotameCallback);
};

export const getLotameData: () => LotameData = () => lotameData;

export const lotame: GetThirdPartyTag = ({ shouldRun }) => ({
	shouldRun,
	url: '//tags.crwdcntrl.net/lt/c/12666/lt.min.js',
	beforeLoad,
	name: 'lotame',
});
