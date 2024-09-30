import { getUrlKeywords } from './content';

const allowedContentTypes = ['Article', 'LiveBlog'];

const bannedUrlKeywords = [
	'adult',
	'arms',
	'arrest',
	'arrested',
	'arrests',
	'assault',
	'assaulted',
	'assaulting',
	'attack',
	'attacks',
	'bomber',
	'cartels',
	'collision',
	'conflict',
	'conflicts',
	'conspiracy',
	'corpse',
	'covid',
	'crash',
	'crime',
	'dead',
	'death',
	'deaths',
	'die',
	'died',
	'dies',
	'dismember',
	'dismembered',
	'download',
	'drown',
	'drowned',
	'drowns',
	'drugs',
	'farright',
	'fatal',
	'fighter',
	'fighters',
	'fighting',
	'gunshot',
	'hatespeech',
	'holocaust',
	'injured',
	'injury',
	'invasion',
	'kidnapping',
	'kill',
	'killed',
	'killer',
	'killers',
	'killing',
	'killings',
	'leftwing',
	'military',
	'militia',
	'militias',
	'mob',
	'mobs',
	'murder',
	'murdered',
	'murderer',
	'murderers',
	'murdering',
	'murders',
	'muslim',
	'mutilation',
	'mutilations',
	'nazi',
	'nazis',
	'nuclear',
	'nude',
	'nudes',
	'obscenity',
	'paedophilia',
	'poison',
	'poisoned',
	'porn',
	'pornography',
	'purge',
	'putin',
	'racism',
	'racist',
	'rape',
	'rapes',
	'rapist',
	'rapists',
	'rebel',
	'rebels',
	'rightwing',
	'russia',
	'russian',
	'scam',
	'scammers',
	'scams',
	'sex',
	'sexual',
	'sexualisation',
	'shelling',
	'shoot',
	'shooting',
	'shoots',
	'shot',
	'slavery',
	'stabbed',
	'supremacist',
	'supremacists',
	'suspect',
	'suspects',
	'syria',
	'syrian',
	'syrians',
	'terror',
	'terrorism',
	'terrorist',
	'threats',
	'tobacco',
	'torture',
	'trafficking',
	'troops',
	'trump',
	'ukraine',
	'ukrainian',
	'vagina',
	'war',
	'wars',
	'wounded',
];

const isEligibleForTeads = (slotId: string) => {
	const { page } = window.guardian.config;

	const contentType = page.contentType;

	const urlKeywords = getUrlKeywords(`/${page.pageId}`);

	const instancesOfBannedKeywords = urlKeywords.filter((keyword) =>
		bannedUrlKeywords.includes(keyword),
	);

	const sensitive = page.isSensitive;

	if (
		slotId === 'dfp-ad--inline1' &&
		allowedContentTypes.includes(contentType) &&
		!sensitive &&
		instancesOfBannedKeywords.length === 0
	) {
		return true;
	}

	return false;
};

export { isEligibleForTeads };
