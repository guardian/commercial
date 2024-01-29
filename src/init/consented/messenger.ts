import { initMessenger } from 'core';
import { init as background } from 'core/messenger/background';
import { init as sendClick } from 'core/messenger/click';
import { init as disableRefresh } from 'core/messenger/disable-refresh';
import { init as fullwidth } from 'core/messenger/full-width';
import { init as initGetPageTargeting } from 'core/messenger/get-page-targeting';
import { init as initGetPageUrl } from 'core/messenger/get-page-url';
import { init as getStyles } from 'core/messenger/get-stylesheet';
import { init as initMeasureAdLoad } from 'core/messenger/measure-ad-load';
import { init as passback } from 'core/messenger/passback';
import { init as passbackRefresh } from 'core/messenger/passback-refresh';
import { init as resize } from 'core/messenger/resize';
import { init as scroll } from 'core/messenger/scroll';
import { init as type } from 'core/messenger/type';
import { init as viewport } from 'core/messenger/viewport';
import { reportError } from 'utils/report-error';

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
		sendClick,
		background,
		disableRefresh,
		passback,
	],
	[scroll, viewport],
	reportError,
);

const init = () => Promise.resolve();

export { init };
