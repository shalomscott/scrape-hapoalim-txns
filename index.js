'use strict';

const fetch = require('node-fetch');
const fs = require('fs');
const inquirer = require('inquirer');
const stringify = require('csv-stringify');
const { formatDate, logAndRethrow, select } = require('./utils.js');

function getCategories(smsession, period) {
	return fetch(
		`https://login.bankhapoalim.co.il/ssb/pfm/transactions/expenses?lang=he&requestedPeriod=${period}&view=categories`,
		{
			headers: {
				Cookie: `SMSESSION=${smsession}`
			}
		}
	)
		.catch(logAndRethrow(`Error fetching categories for period: ${period}`))
		.then(res => res.json())
		.catch(logAndRethrow(`Error parsing categories response as JSON`))
		.then(categories => categories.map(select('name', 'code')));
}

function getCategoryTxns(smsession, period, categoryCode) {
	return fetch(
		`https://login.bankhapoalim.co.il/ssb/pfm/transactions/expenses?categoryId=${categoryCode}&lang=he&requestedPeriod=${period}&view=details`,
		{
			headers: {
				Cookie: `SMSESSION=${smsession}`
			}
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
		getCategories(smsession, period)
			.then(categories =>
				Promise.all(
					categories.map(category =>
						getCategoryTxns(smsession, period, category.code).then(txns =>
							txns.map(txn => formatTxn(txn, category))
						)
					)
				)
			)
			.then(txnsByCategory => txnsByCategory.flat())
			.then(txns =>
				txns.sort(({ date: date1 }, { date: date2 }) =>
					date1.localeCompare(date2)
				)
			)
			.then(txns =>
				stringify(txns, {
					header: true
				}).pipe(fs.createWriteStream(`bank-hapoalim-export-${period}.csv`))
			)
			.catch(error => console.error(error.message || error))
	);
