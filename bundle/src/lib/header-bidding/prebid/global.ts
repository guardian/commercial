import type { PrebidJS } from 'prebid.js/types.d.ts';
import 'prebid.js/types.d.ts';
import 'prebid.js/global.d.ts';

declare global {
	interface Window {
		// liveramp ats object is available once liveramp ats-module script is loaded
		atsenvelopemodule?: {
			setAdditionalData: (data: { type: string; id: string[] }) => void;
		};
		pbjs: PrebidJS;
	}
}
