import { isObject, isString } from '@guardian/libs';
import fastdom from '../fastdom-promise';
import type { RegisterListener } from '../messenger';

interface Styles {
	width?: string;
	height?: string;
}

interface ResizeSpecs {
	width?: string | number;
	height?: string | number;
}

const isValidResizeSpecs = (specs: unknown): specs is ResizeSpecs => {
	return (
		isObject(specs) &&
		(specs.width === undefined ||
			isString(specs.width) ||
			typeof specs.width === 'number') &&
		(specs.height === undefined ||
			isString(specs.height) ||
			typeof specs.height === 'number')
	);
};

const normalise = (length: string | number): string => {
	const lengthRegexp = /^(\d+)(%|px|em|ex|ch|rem|vh|vw|vmin|vmax)?/;
	const defaultUnit = 'px';
	const matches = lengthRegexp.exec(String(length));
	if (!matches) {
		return '';
	}

	const number = matches[1];
	const unit = matches[2] ?? defaultUnit;

	if (!number) {
		return '';
	}

	return number + unit;
};

const resize = (
	specs: unknown,
	iframe: HTMLIFrameElement,
	iframeContainer?: HTMLElement,
	adSlot?: HTMLElement,
): Promise<void> => {
	if (!isValidResizeSpecs(specs) || !adSlot) {
		return Promise.resolve();
	}

	const styles: Styles = {};

	if (specs.width) {
		styles.width = normalise(specs.width);
	}

	if (specs.height) {
		styles.height = normalise(specs.height);
	}

	return fastdom.mutate(() => {
		Object.assign(iframe.style, styles);

		if (iframeContainer) {
			Object.assign(iframeContainer.style, styles);
		}

		adSlot.style.maxHeight = 'none';
	});
};

// When an outstream resizes we want it to revert to its original styling
const removeAnyOutstreamClass = (adSlot: HTMLElement) => {
	void fastdom.mutate(() => {
		adSlot.classList.remove('ad-slot--outstream');
	});
};

const init = (register: RegisterListener): void => {
	register('resize', (specs, ret, iframe) => {
		if (iframe && specs) {
			const adSlot =
				iframe.closest<HTMLElement>('.js-ad-slot') ?? undefined;

			if (adSlot) {
				removeAnyOutstreamClass(adSlot);
			}

			const iframeContainer =
				iframe.closest<HTMLElement>('.ad-slot__content') ?? undefined;

			return resize(specs, iframe, iframeContainer, adSlot);
		}
	});
};

export const _ = { resize, normalise };

export { init };
