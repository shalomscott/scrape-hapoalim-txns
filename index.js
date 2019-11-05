'use strict';

const fs = require('fs');
const inquirer = require('inquirer');
const stringify = require('csv-stringify');
const { getCategories, getCategoryTxns } = require('./requests.js');
const { formatDate } = require('./utils.js');

function formatTxn(txn, category) {
	return {
		date: formatDate(txn.transactionDate),
		amount: txn.transactionSum,
		description: txn.transactionActivityDescription,
		category: category.name,
		account: 'Bank Hapoalim'
	};
}

inquirer
	.prompt([
		{
			type: 'input',
			name: 'period',
			message: "Enter a period (of the form 'YYYYMM'):"
		},
		{
			type: 'input',
			name: 'smsession',
			message: 'Enter the active SMSESSION cookie:'
		}
	])
	.then(({ smsession, period }) =>
		// Fetch the categories in the given period
		getCategories(smsession, period)
			// For each category, fetch its transactions
			.then(categories =>
				Promise.all(
					categories.map(category =>
						getCategoryTxns(smsession, period, category.code).then(txns =>
							// Format the transaction object
							txns.map(txn => formatTxn(txn, category))
						)
					)
				)
			)
			// Flatten the resulting array
			.then(txnsByCategory => txnsByCategory.flat())
			// Sort the transactions by date
			.then(txns =>
				txns.sort(({ date: date1 }, { date: date2 }) =>
					date1.localeCompare(date2)
				)
			)
			// Write CSV output to a file
			.then(txns =>
				stringify(txns, {
					header: true
				}).pipe(fs.createWriteStream(`bank-hapoalim-export-${period}.csv`))
			)
			// Catch any errors
			.catch(error => console.error(error.message || error))
	);
