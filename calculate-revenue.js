require('dotenv').config();
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const tx = require('@stacks/transactions');
const utils = require('./utils');
const network = utils.resolveNetwork();
const axios = require('axios');

const apiUrl = 'https://api.hiro.so';
const sinceBlock = 102202;

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

async function getTransactions() {
  const unstackContract = 'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.arkadiko-freddie-v1-1';
  const baseUrl = `${apiUrl}/extended/v1/address/${unstackContract}/transactions?limit=50`;
  console.log(baseUrl);
  let response = await axios.get(baseUrl);
  let results = response.data['results'];
  const total = parseInt(response.data['total'], 10);
  console.log('got', total, 'results');
  let offset = 50;

  while (offset <= total && results?.length > 0) {
    console.log('fetched', results.length, 'transactions with offset', offset);
    await asyncForEach(results, async (result) => {
      if (
        result['tx_status'] === 'success' &&
        result['tx_type'] === 'contract_call' &&
        result['contract_call']['function_name'] === 'redeem-tokens'
      ) {
        console.log(result);
      }
    });

    offset += 50;
    const url = `${baseUrl}&offset=${offset}`;
    response = await axios.get(url);
    results = response.data['results'];
  }
}

getTransactions();
