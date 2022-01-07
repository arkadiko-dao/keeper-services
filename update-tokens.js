require('dotenv').config();
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const API_KEY = process.env.API_KEY;
const axios = require('axios');
const tx = require('@stacks/transactions');
const utils = require('./utils');
const network = utils.resolveNetwork();

const url = 'https://arkadiko-api.herokuapp.com/api/v1/tokens/';
// const url = 'http://localhost:3000/api/v1/tokens/';

// 1. Update total supply of stDIKO
const fetchTotalSupplyStDiko = async () => {
  let details = await tx.callReadOnlyFunction({
    contractAddress: CONTRACT_ADDRESS,
    contractName: "stdiko-token",
    functionName: "get-total-supply",
    functionArgs: [],
    senderAddress: CONTRACT_ADDRESS,
    network: network,
  });

  return tx.cvToJSON(details).value.value;
};

const getPriceInfo = async (symbol) => {
  const fetchedPrice = await tx.callReadOnlyFunction({
    contractAddress: CONTRACT_ADDRESS,
    contractName: "arkadiko-oracle-v1-1",
    functionName: "get-price",
    functionArgs: [tx.stringAsciiCV(symbol || 'STX')],
    senderAddress: CONTRACT_ADDRESS,
    network: network,
  });
  const json = tx.cvToJSON(fetchedPrice);

  return json.value;
};

const getTotalStaked = async (poolName) => {
  const call = await tx.callReadOnlyFunction({
    contractAddress: CONTRACT_ADDRESS,
    contractName: poolName,
    functionName: "get-total-staked",
    functionArgs: [],
    senderAddress: CONTRACT_ADDRESS,
    network: network,
  });
  const json = tx.cvToJSON(call);

  return json.value;
};

(async () => {
  const stDikoSupply = await fetchTotalSupplyStDiko();
  axios({
    method: 'PATCH',
    url: url + `stdiko?key=${API_KEY}`, 
    data: {
      total_supply: stDikoSupply,
    },
    headers: { 'Content-Type': 'application/json' },
  })
  .then(function (response) {
    // console.log(response.data);
  })
  .catch(function (error) {
    // console.log(error);
  });

  const dikoPriceInfo = await getPriceInfo('DIKO');
  axios({
    method: 'PATCH',
    url: url + `diko?key=${API_KEY}`,
    data: {
      last_price: dikoPriceInfo['last-price']['value'],
      price_last_updated: dikoPriceInfo['last-block']['value']
    },
    headers: { 'Content-Type': 'application/json' },
  });

  const stxPriceInfo = await getPriceInfo('STX');
  axios({
    method: 'PATCH',
    url: url + `wstx?key=${API_KEY}`,
    data: {
      last_price: stxPriceInfo['last-price']['value'],
      price_last_updated: stxPriceInfo['last-block']['value']
    },
    headers: { 'Content-Type': 'application/json' },
  });

  const usdaPriceInfo = await getPriceInfo('USDA');
  axios({
    method: 'PATCH',
    url: url + `usda?key=${API_KEY}`,
    data: {
      last_price: usdaPriceInfo['last-price']['value'],
      price_last_updated: usdaPriceInfo['last-block']['value']
    },
    headers: { 'Content-Type': 'application/json' },
  });

  const dikoStaked = await getTotalStaked('arkadiko-stake-pool-diko-v1-2');
  axios({
    method: 'PATCH',
    url: url + `diko?key=${API_KEY}`,
    data: {
      total_staked: dikoStaked
    },
    headers: { 'Content-Type': 'application/json' },
  });

  const dikoUsdaStaked = await getTotalStaked('arkadiko-stake-pool-diko-usda-v1-1');
  axios({
    method: 'PATCH',
    url: url + `ARKV1DIKOUSDA?key=${API_KEY}`,
    data: {
      total_staked: dikoUsdaStaked
    },
    headers: { 'Content-Type': 'application/json' },
  });

  const stxUsdaStaked = await getTotalStaked('arkadiko-stake-pool-wstx-usda-v1-1');
  axios({
    method: 'PATCH',
    url: url + `ARKV1WSTXUSDA?key=${API_KEY}`,
    data: {
      total_staked: stxUsdaStaked
    },
    headers: { 'Content-Type': 'application/json' },
  });

  const stxDikoStaked = await getTotalStaked('arkadiko-stake-pool-wstx-diko-v1-1');
  axios({
    method: 'PATCH',
    url: url + `ARKV1WSTXDIKO?key=${API_KEY}`,
    data: {
      total_staked: stxDikoStaked
    },
    headers: { 'Content-Type': 'application/json' },
  });

  const stxXbtcStaked = await getTotalStaked('arkadiko-stake-pool-wstx-xbtc-v1-1');
  axios({
    method: 'PATCH',
    url: url + `ARKV1WSTXXBTC?key=${API_KEY}`,
    data: {
      total_staked: stxXbtcStaked
    },
    headers: { 'Content-Type': 'application/json' },
  });

  const xbtcUsdaStaked = await getTotalStaked('arkadiko-stake-pool-xbtc-usda-v1-1');
  axios({
    method: 'PATCH',
    url: url + `arkv1xbtcusda?key=${API_KEY}`,
    data: {
      total_staked: xbtcUsdaStaked
    },
    headers: { 'Content-Type': 'application/json' },
  });
})();
