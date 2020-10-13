import { lotameScript } from '../../vendor/lotame-script';
import { GetThirdPartyTag } from '../types';

export type LotameData = {
	ozoneLotameData: Array<string>;
	ozoneLotameProfileId: string;
};

let lotameData: LotameData;

const ozoneLotameCallback = (obj: {
	getAudiences: () => Array<string>;
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
