import pbjs from '@guardian/prebid.js';
import '@guardian/prebid.js/modules/adyoulikeBidAdapter';
import '@guardian/prebid.js/modules/appnexusBidAdapter';
import '@guardian/prebid.js/modules/consentManagement';
import '@guardian/prebid.js/modules/consentManagementUsp';
import '@guardian/prebid.js/modules/criteoBidAdapter';
import '@guardian/prebid.js/modules/gridBidAdapter';
import '@guardian/prebid.js/modules/guAnalyticsAdapter';
import '@guardian/prebid.js/modules/improvedigitalBidAdapter';
import '@guardian/prebid.js/modules/ixBidAdapter';
import '@guardian/prebid.js/modules/openxBidAdapter';
import '@guardian/prebid.js/modules/ozoneBidAdapter';
import '@guardian/prebid.js/modules/permutiveRtdProvider';
import '@guardian/prebid.js/modules/prebidServerBidAdapter';
import '@guardian/prebid.js/modules/pubmaticBidAdapter';
import '@guardian/prebid.js/modules/sharedIdSystem';
import '@guardian/prebid.js/modules/sonobiBidAdapter';
import '@guardian/prebid.js/modules/tripleliftBidAdapter';
import '@guardian/prebid.js/modules/kargoBidAdapter';
import '@guardian/prebid.js/modules/rubiconBidAdapter';

pbjs.processQueue();

export { pbjs };
