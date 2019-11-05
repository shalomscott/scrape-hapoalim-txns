'use strict';

const fetch = require('node-fetch');
const { logAndRethrow, select } = require('./utils.js');

function getHeaders(smsession) {
	return {
		Cookie: `SMSESSION=${smsession}`
	};
}

module.exports = {
	getCategories: function(smsession, period) {
		return fetch(
			`https://login.bankhapoalim.co.il/ssb/pfm/transactions/expenses?lang=he&requestedPeriod=${period}&view=categories`,
			{
				headers: getHeaders(smsession)
			}
		)
			.catch(logAndRethrow(`Error fetching categories for period: ${period}`))
			.then(res => res.json())
			.catch(logAndRethrow(`Error parsing categories response as JSON`))
			.then(categories => categories.map(select('name', 'code')));
	},

	getCategoryTxns: function(smsession, period, categoryCode) {
		return fetch(
			`https://login.bankhapoalim.co.il/ssb/pfm/transactions/expenses?categoryId=${categoryCode}&lang=he&requestedPeriod=${period}&view=details`,
			{
				headers: getHeaders(smsession)
			}
		)
			.catch(
				logAndRethrow(`Error fetching txns for category code: ${categoryCode}`)
			)
			.then(res => res.json())
			.catch(logAndRethrow(`Error parsing txns response as JSON`))
			.then(txns =>
				txns.map(
					select(
						'transactionDate',
						'transactionActivityDescription',
						'transactionSum'
					)
				)
			);
	}
};
