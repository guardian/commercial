/* eslint-disable -- this is third party code */
// @ts-nocheck
// More details here: https://my.lotame.com/t/g9hxvnw/detailed-reference-guide

export const lotameScript = (callback) => {
	!(function() {
        var lotameTagInput = {
            data: {},
            config: {
                clientId: 12666,
                onProfileReady: function(o) {
                    callback(o);
                }
            },
        };

        // Lotame initialization
        var lotameConfig = lotameTagInput.config || {};
        var namespace = (window['lotame_' + lotameConfig.clientId] = {});
        namespace.config = lotameConfig;
        namespace.data = lotameTagInput.data || {};
		namespace.cmd = namespace.cmd || [];
	})();
};
/* eslint-enable */
