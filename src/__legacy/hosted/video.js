import deferToAnalytics from '@guardian/frontend/static/src/javascripts/lib/defer-to-analytics';
import reportError from '@guardian/frontend/static/src/javascripts/lib/report-error';
import { fullscreener } from '@guardian/frontend/static/src/javascripts/projects/common/modules/media/videojs-plugins/fullscreener';
import events from '@guardian/frontend/static/src/javascripts/projects/common/modules/video/events';
import videojsOptions from '@guardian/frontend/static/src/javascripts/projects/common/modules/video/videojs-options';
import fastdom from 'fastdom';
import loadingTmpl from 'raw-loader!common/views/ui/loading.html';
import {
	canAutoplay,
	init,
	triggerEndSlate,
} from '../hosted/next-video-autoplay';
import { initHostedYoutube } from '../hosted/youtube';

const initLoadingSpinner = (player, loadingTemplate) => {
	player.loadingSpinner.contentEl().innerHTML = loadingTemplate;
};

const upgradeVideoPlayerAccessibility = (player) => {
	// Set the video tech element to aria-hidden, and label the buttons in the videojs control bar.
	const playerEl = player.el();

	fastdom.mutate(() => {
		Array.from(playerEl.querySelectorAll('.vjs-tech')).forEach((el) => {
			el.setAttribute('aria-hidden', 'true');
		});
		// Hide superfluous controls, and label useful buttons.
		Array.from(playerEl.querySelectorAll('.vjs-big-play-button')).forEach(
			(el) => {
				el.setAttribute('aria-hidden', 'true');
			},
		);
		Array.from(playerEl.querySelectorAll('.vjs-current-time')).forEach(
			(el) => {
				el.setAttribute('aria-hidden', 'true');
			},
		);
		Array.from(playerEl.querySelectorAll('.vjs-time-divider')).forEach(
			(el) => {
				el.setAttribute('aria-hidden', 'true');
			},
		);
		Array.from(playerEl.querySelectorAll('.vjs-duration')).forEach((el) => {
			el.setAttribute('aria-hidden', 'true');
		});
		Array.from(playerEl.querySelectorAll('.vjs-embed-button')).forEach(
			(el) => {
				el.setAttribute('aria-hidden', 'true');
			},
		);
		Array.from(playerEl.querySelectorAll('.vjs-play-control')).forEach(
			(el) => {
				el.setAttribute('aria-label', 'video play');
			},
		);
		Array.from(playerEl.querySelectorAll('.vjs-mute-control')).forEach(
			(el) => {
				el.setAttribute('aria-label', 'video mute');
			},
		);
		Array.from(
			playerEl.querySelectorAll('.vjs-fullscreen-control'),
		).forEach((el) => {
			el.setAttribute('aria-label', 'video fullscreen');
		});
	});
};

const onPlayerError = (player) => {
	const err = player.error();
	if (err && 'message' in err && 'code' in err) {
		reportError(
			new Error(err.message),
			{
				feature: 'hosted-player',
				vjsCode: err.code,
			},
			false,
		);
	}
};

const onPlayerReady = (player, mediaId, loadingTemplate) => {
	const vol = player.volume();
	initLoadingSpinner(player, loadingTemplate);
	upgradeVideoPlayerAccessibility(player);

	// unglitching the volume on first load
	if (vol) {
		player.volume(0);
		player.volume(vol);
	}

	player.fullscreener();

	deferToAnalytics(() => {
		events.initOphanTracking(player, mediaId);
		events.bindGlobalEvents(player);
		events.bindContentEvents(player);
	});

	player.on('error', onPlayerError);
};

// #? Should we have some type aliases for HostedPlayer, Videojs?
const setupVideo = (video, videojsInstance) => {
	const mediaId = video.getAttribute('data-media-id');
	const player = videojsInstance(video, videojsOptions());

	if (!mediaId) {
		return;
	}

	player.guMediaType = 'video';
	videojsInstance.plugin('fullscreener', fullscreener);

	events.addContentEvents(player, mediaId, player.guMediaType);
	events.bindGoogleAnalyticsEvents(player, window.location.pathname);

	player.ready(() => {
		onPlayerReady(player, mediaId, loadingTmpl);
	});

	init().then(() => {
		if (canAutoplay()) {
			player.one('ended', triggerEndSlate);
		}
	});
};

export const initHostedVideo = () => {
	const videoEl = document.querySelectorAll('.vjs-hosted__video');
	const youtubeIframe = document.querySelectorAll('.js-hosted-youtube-video');

	if (!youtubeIframe.length && !videoEl.length) {
		// Halt execution if there are no video containers on the page.
		return Promise.resolve();
	}

	// Return a promise that resolves after the async work is done.
	// #? target for `async` `await` goodness
	new Promise((resolve) => {
		require.ensure(
			[],
			(require) => {
				resolve(require('bootstraps/enhanced/media-player').videojs);
			},
			'media-player',
		);
	}).then((videojsInstance) => {
		Array.from(videoEl).forEach((el) => {
			setupVideo(el, videojsInstance);
		});

		Array.from(youtubeIframe).forEach(initHostedYoutube);
	});

	return Promise.resolve();
};
