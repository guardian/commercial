import type { ABTest } from '@guardian/ab-core';
import { billboardsInMerchHigh } from './tests/billboards-in-merch-high';
import { consentlessAds } from './tests/consentlessAds';
import { eagerPrebid } from './tests/eager-prebid';
import { elementsManager } from './tests/elements-manager';
import { integrateIma } from './tests/integrate-ima';
import { prebidKargo } from './tests/prebid-kargo';
import { publicGoodTest } from './tests/public-good';
import { signInGateCopyTestJan2023 } from './tests/sign-in-gate-copy-test-variant';
import { signInGateMainControl } from './tests/sign-in-gate-main-control';
import { signInGateMainVariant } from './tests/sign-in-gate-main-variant';

// keep in sync with ab-tests in dotcom-rendering
// https://github.com/guardian/dotcom-rendering/blob/main/dotcom-rendering/src/experiments/ab-tests.ts
export const concurrentTests: readonly ABTest[] = [
	signInGateMainVariant,
	signInGateMainControl,
	signInGateCopyTestJan2023,
	consentlessAds,
	integrateIma,
	billboardsInMerchHigh,
	elementsManager,
	eagerPrebid,
	publicGoodTest,
	prebidKargo,
];
