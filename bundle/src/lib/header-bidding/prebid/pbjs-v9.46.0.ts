import pbjs from 'prebid-v9.46.0.js';

// Consent management
import 'prebid-v9.46.0.js/modules/consentManagementTcf';
import 'prebid-v9.46.0.js/modules/consentManagementUsp';
import 'prebid-v9.46.0.js/modules/consentManagementGpp';

// Bid adapters
import 'prebid-v9.46.0.js/modules/adyoulikeBidAdapter';
import 'prebid-v9.46.0.js/modules/criteoBidAdapter';
import 'prebid-v9.46.0.js/modules/gridBidAdapter';
import 'prebid-v9.46.0.js/modules/ixBidAdapter';
import 'prebid-v9.46.0.js/modules/ozoneBidAdapter';
import 'prebid-v9.46.0.js/modules/prebidServerBidAdapter';
import 'prebid-v9.46.0.js/modules/pubmaticBidAdapter';
import 'prebid-v9.46.0.js/modules/tripleliftBidAdapter';
import 'prebid-v9.46.0.js/modules/kargoBidAdapter';
import 'prebid-v9.46.0.js/modules/rubiconBidAdapter';
import 'prebid-v9.46.0.js/modules/ttdBidAdapter';

// User IDs
import 'prebid-v9.46.0.js/modules/id5IdSystem';
import 'prebid-v9.46.0.js/modules/sharedIdSystem';
import 'prebid-v9.46.0.js/modules/userId';

// Real time data
import 'prebid-v9.46.0.js/modules/rtdModule';
import 'prebid-v9.46.0.js/modules/permutiveRtdProvider';

// Guardian specific adapters that we have modified or created
import './modules/appnexusBidAdapter';
import './modules/openxBidAdapter';
import './modules/analyticsAdapter';

pbjs.processQueue();

export { pbjs };
