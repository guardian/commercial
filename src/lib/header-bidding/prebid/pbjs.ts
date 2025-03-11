import pbjs from 'prebid.js';

import 'prebid.js/modules/adyoulikeBidAdapter';
import 'prebid.js/modules/consentManagementTcf';
import 'prebid.js/modules/consentManagementUsp';
import 'prebid.js/modules/criteoBidAdapter';
import 'prebid.js/modules/gridBidAdapter';
import 'prebid.js/modules/ixBidAdapter';
import 'prebid.js/modules/ozoneBidAdapter';
import 'prebid.js/modules/permutiveRtdProvider';
import 'prebid.js/modules/prebidServerBidAdapter';
import 'prebid.js/modules/pubmaticBidAdapter';
import 'prebid.js/modules/sharedIdSystem';
import 'prebid.js/modules/tripleliftBidAdapter';
import 'prebid.js/modules/kargoBidAdapter';
import 'prebid.js/modules/rubiconBidAdapter';
import 'prebid.js/modules/ttdBidAdapter';

// Guardian specific adapters that we have modified or created
import './modules/appnexusBidAdapter';
import './modules/openxBidAdapter';
import './modules/analyticsAdapter';

pbjs.processQueue();

export { pbjs };
