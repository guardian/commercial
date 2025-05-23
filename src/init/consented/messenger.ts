import { init as initMessenger } from '../../lib/messenger';
import { init as background } from '../../lib/messenger/background';
import { init as disableRefresh } from '../../lib/messenger/disable-refresh';
import { init as fullwidth } from '../../lib/messenger/full-width';
import { init as initGetPageTargeting } from '../../lib/messenger/get-page-targeting';
import { init as initGetPageUrl } from '../../lib/messenger/get-page-url';
import { init as getStyles } from '../../lib/messenger/get-stylesheet';
import { init as initMeasureAdLoad } from '../../lib/messenger/measure-ad-load';
import { init as passback } from '../../lib/messenger/passback';
import { init as passbackRefresh } from '../../lib/messenger/passback-refresh';
import { init as resize } from '../../lib/messenger/resize';
import { init as scroll } from '../../lib/messenger/scroll';
import { init as type } from '../../lib/messenger/type';
import { initMessengerVideoProgressReporting } from '../../lib/messenger/video';
import { init as viewport } from '../../lib/messenger/viewport';

/**
 * Messenger gets to skip the promise chain and run immediately.
 */
initMessenger(
	[
		type,
		getStyles,
		initGetPageTargeting,
		initGetPageUrl,
		initMeasureAdLoad,
		passbackRefresh,
		resize,
		fullwidth,
		background,
		disableRefresh,
		passback,
		initMessengerVideoProgressReporting,
	],
	[scroll, viewport],
);

const init = () => Promise.resolve();

export { init };
