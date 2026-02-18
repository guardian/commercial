import pbjs from 'prebid-v10.23.0.js';

// Consent management
import 'prebid-v10.23.0.js/modules/consentManagementTcf';
import 'prebid-v10.23.0.js/modules/consentManagementUsp';
import 'prebid-v10.23.0.js/modules/consentManagementGpp';

// Bid adapters
import 'prebid-v10.23.0.js/modules/criteoBidAdapter';
import 'prebid-v10.23.0.js/modules/gridBidAdapter';
import 'prebid-v10.23.0.js/modules/ixBidAdapter';
import 'prebid-v10.23.0.js/modules/ozoneBidAdapter';
import 'prebid-v10.23.0.js/modules/pubmaticBidAdapter';
import 'prebid-v10.23.0.js/modules/tripleliftBidAdapter';
import 'prebid-v10.23.0.js/modules/kargoBidAdapter';
import 'prebid-v10.23.0.js/modules/rubiconBidAdapter';
import 'prebid-v10.23.0.js/modules/ttdBidAdapter';

// User IDs
import 'prebid-v10.23.0.js/modules/euidIdSystem';
import 'prebid-v10.23.0.js/modules/id5IdSystem';
import 'prebid-v10.23.0.js/modules/identityLinkIdSystem';
import 'prebid-v10.23.0.js/modules/pairIdSystem';
import 'prebid-v10.23.0.js/modules/sharedIdSystem';
import 'prebid-v10.23.0.js/modules/uid2IdSystem';
import 'prebid-v10.23.0.js/modules/userId';

// Real time data
import 'prebid-v10.23.0.js/modules/rtdModule';
import 'prebid-v10.23.0.js/modules/permutiveRtdProvider';

// Guardian specific adapters that we have modified or created
import './appnexusBidAdapter';
import './openxBidAdapter';
import './analyticsAdapter';

void pbjs.processQueue();

export { pbjs };
