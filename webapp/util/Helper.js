sap.ui.define(["require"], (require) => {
	"use strict";
	return {
		formatPriorityClass(TpPriority) {
			switch (TpPriority) {
				case 'A':
					return 'tpPriorityBoxA';
				case 'M':
					return 'tpPriorityBoxM';
				case 'B':
					return 'tpPriorityBoxB';
				default:
					return 'tpPriorityBoxB';
			}
		},
		resolvePath(sPath) {
			// Relative to application root
			return require.toUrl("../") + sPath;
		}
	};
});
