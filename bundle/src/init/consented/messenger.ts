import { messenger } from '../../lib/messenger';
import { initBackgroundMessage } from '../../lib/messenger/background';
import { initDisableRefreshMessage } from '../../lib/messenger/disable-refresh';
import { initFullWidthMessage } from '../../lib/messenger/full-width';
import { initGetPageTargtingMessage } from '../../lib/messenger/get-page-targeting';
import { initGetPageUrlMessage } from '../../lib/messenger/get-page-url';
import { initGetStylesMessage } from '../../lib/messenger/get-stylesheet';
import { initMeasureAdLoadMessage } from '../../lib/messenger/measure-ad-load';
import { initPassbackMessage } from '../../lib/messenger/passback';
import { initPassbackRefreshMessage } from '../../lib/messenger/passback-refresh';
import { initResizeMessage } from '../../lib/messenger/resize';
import { initScrollMessage } from '../../lib/messenger/scroll';
import { initTypeMessage } from '../../lib/messenger/type';
import { initVideoProgressMessage } from '../../lib/messenger/video';
import { initViewportMessage } from '../../lib/messenger/viewport';

export const initMessenger = (): void => {
	void messenger(
		[
			initBackgroundMessage,
			initDisableRefreshMessage,
			initFullWidthMessage,
			initGetPageTargtingMessage,
			initGetPageUrlMessage,
			initGetStylesMessage,
			initMeasureAdLoadMessage,
			initPassbackMessage,
			initPassbackRefreshMessage,
			initResizeMessage,
			initScrollMessage,
			initTypeMessage,
			initVideoProgressMessage,
		],
		[initScrollMessage, initViewportMessage],
	);
};
