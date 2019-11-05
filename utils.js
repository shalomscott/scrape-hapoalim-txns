'use strict';

module.exports = {
	formatDate: function(dateStr) {
		return (
			dateStr.substr(0, 4) +
			'-' +
			dateStr.substr(4, 2) +
			'-' +
			dateStr.substr(6, 2)
		);
	},
	logAndRethrow: function(message) {
		return error => {
			console.error(error.message || error);
			throw new Error(message);
		};
	},
	select: function(...keys) {
		return rawObject =>
			Object.keys(rawObject)
				.filter(key => keys.includes(key))
				.reduce((filteredObject, key) => {
					filteredObject[key] = rawObject[key];
					return filteredObject;
				}, {});
	}
};
