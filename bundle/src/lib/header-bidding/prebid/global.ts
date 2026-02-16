import type { PrebidJS } from 'prebid-v10.23.0.js/types.d.ts';
import 'prebid-v10.23.0.js/types.d.ts';
import 'prebid-v10.23.0.js/global.d.ts';

declare global {
	interface Window {
		// liveramp ats object is available once liveramp ats-module script is loaded
		atsenvelopemodule?: {
			setAdditionalData: (data: { type: string; id: string[] }) => void;
		};
		pbjs: PrebidJS;
	}
}
