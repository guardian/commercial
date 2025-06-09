import pbjs from 'prebid946.js';

// import 'prebid946.js/modules/adyoulikeBidAdapter';
// import 'prebid946.js/modules/consentManagementTcf';
// import 'prebid946.js/modules/consentManagementUsp';
// import 'prebid946.js/modules/criteoBidAdapter';
// import 'prebid946.js/modules/gridBidAdapter';
// import 'prebid946.js/modules/ixBidAdapter';
// import 'prebid946.js/modules/ozoneBidAdapter';
// import 'prebid946.js/modules/permutiveRtdProvider';
// import 'prebid946.js/modules/prebidServerBidAdapter';
// import 'prebid946.js/modules/pubmaticBidAdapter';
// import 'prebid946.js/modules/sharedIdSystem';
// import 'prebid946.js/modules/tripleliftBidAdapter';
// import 'prebid946.js/modules/kargoBidAdapter';
// import 'prebid946.js/modules/rubiconBidAdapter';
// import 'prebid946.js/modules/ttdBidAdapter';
// import 'prebid946.js/modules/multibid';
// import 'prebid946.js/modules/id5IdSystem';
// import 'prebid946.js/modules/userId';

// Guardian specific adapters that we have modified or created
// import './modules/appnexusBidAdapter';
// import './modules/openxBidAdapter';
// import './modules/analyticsAdapter';

console.log('*** pbjs ***', pbjs);

pbjs.processQueue();

console.log('*** Prebid v946 loaded ***');

export { pbjs };
