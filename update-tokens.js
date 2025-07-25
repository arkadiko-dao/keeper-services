require('dotenv').config();
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const API_KEY = process.env.API_KEY;
const axios = require('axios');
const tx = require('@stacks/transactions');
const utils = require('./utils');
const network = utils.resolveNetwork();

const tokenUrl = 'https://arkadiko-api.herokuapp.com/api/v1/tokens/';
// const tokenUrl = 'http://localhost:3000/api/v1/tokens/';
const poolUrl = 'https://arkadiko-api.herokuapp.com/api/v1/pools/';
// const poolUrl = 'http://localhost:3000/api/v1/pools/';

// 1. Update total supply of stDIKO
const fetchTotalSupplyStDiko = async () => {
  let details = await tx.fetchCallReadOnlyFunction({
    contractAddress: CONTRACT_ADDRESS,
    contractName: "stdiko-token",
    functionName: "get-total-supply",
    functionArgs: [],
    senderAddress: CONTRACT_ADDRESS,
    network: 'mainnet',
  });

  return tx.cvToJSON(details).value.value;
};

const getPriceInfo = async (symbol) => {
  const fetchedPrice = await tx.fetchCallReadOnlyFunction({
    contractAddress: CONTRACT_ADDRESS,
    contractName: "arkadiko-oracle-v2-3",
    functionName: "get-price",
    functionArgs: [tx.stringAsciiCV(symbol || 'STX')],
    senderAddress: CONTRACT_ADDRESS,
    network: 'mainnet'
  });
  const json = tx.cvToJSON(fetchedPrice);

  return json.value;
};

const getTotalStaked = async (poolName) => {
  const call = await tx.fetchCallReadOnlyFunction({
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

const getSwapPair = async (tokenXAddress, tokenXContract, tokenYAddress, tokenYContract) => {
  const pairDetailsCall = await tx.fetchCallReadOnlyFunction({
    contractAddress: CONTRACT_ADDRESS,
    contractName: 'arkadiko-swap-v2-1',
    functionName: 'get-pair-details',
    functionArgs: [
      tx.contractPrincipalCV(tokenXAddress, tokenXContract),
      tx.contractPrincipalCV(tokenYAddress, tokenYContract),
    ],
    senderAddress: CONTRACT_ADDRESS,
    network: network,
  });

  return tx.cvToJSON(pairDetailsCall).value.value.value;
};

(async () => {
  const stDikoSupply = await fetchTotalSupplyStDiko();
  axios({
    method: 'PATCH',
    url: tokenUrl + `stdiko?key=${API_KEY}`,
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

  const stxUsdaPair = await getSwapPair(CONTRACT_ADDRESS, 'wrapped-stx-token', CONTRACT_ADDRESS, 'usda-token');
  axios({
    method: 'PATCH',
    url: poolUrl + `1?key=${API_KEY}`,
    data: {
      balance_x: stxUsdaPair['balance-x']['value'],
      balance_y: stxUsdaPair['balance-y']['value'],
      shares_total: stxUsdaPair['shares-total']['value'],
      enabled: stxUsdaPair['enabled']['value']
    },
    headers: { 'Content-Type': 'application/json' },
  });

  const dikoUsdaPair = await getSwapPair(CONTRACT_ADDRESS, 'arkadiko-token', CONTRACT_ADDRESS, 'usda-token');
  axios({
    method: 'PATCH',
    url: poolUrl + `2?key=${API_KEY}`,
    data: {
      balance_x: dikoUsdaPair['balance-x']['value'],
      balance_y: dikoUsdaPair['balance-y']['value'],
      shares_total: dikoUsdaPair['shares-total']['value'],
      enabled: dikoUsdaPair['enabled']['value']
    },
    headers: { 'Content-Type': 'application/json' },
  });

  const stxDikoPair = await getSwapPair(CONTRACT_ADDRESS, 'wrapped-stx-token', CONTRACT_ADDRESS, 'arkadiko-token');
  axios({
    method: 'PATCH',
    url: poolUrl + `3?key=${API_KEY}`,
    data: {
      balance_x: stxDikoPair['balance-x']['value'],
      balance_y: stxDikoPair['balance-y']['value'],
      shares_total: stxDikoPair['shares-total']['value']
    },
    headers: { 'Content-Type': 'application/json' },
  });

  const stxBtcPair = await getSwapPair(CONTRACT_ADDRESS, 'wrapped-stx-token', 'SP3DX3H4FEYZJZ586MFBS25ZW3HZDMEW92260R2PR', 'Wrapped-Bitcoin');
  axios({
    method: 'PATCH',
    url: poolUrl + `4?key=${API_KEY}`,
    data: {
      balance_x: stxBtcPair['balance-x']['value'],
      balance_y: stxBtcPair['balance-y']['value'],
      shares_total: stxBtcPair['shares-total']['value']
    },
    headers: { 'Content-Type': 'application/json' },
  });

  const btcUsdaPair = await getSwapPair('SP3DX3H4FEYZJZ586MFBS25ZW3HZDMEW92260R2PR', 'Wrapped-Bitcoin', CONTRACT_ADDRESS, 'usda-token');
  axios({
    method: 'PATCH',
    url: poolUrl + `5?key=${API_KEY}`,
    data: {
      balance_x: btcUsdaPair['balance-x']['value'],
      balance_y: btcUsdaPair['balance-y']['value'],
      shares_total: btcUsdaPair['shares-total']['value'],
      enabled: btcUsdaPair['enabled']['value']
    },
    headers: { 'Content-Type': 'application/json' },
  });

  const stxWelshPair = await getSwapPair(CONTRACT_ADDRESS, 'wrapped-stx-token', 'SP3NE50GEXFG9SZGTT51P40X2CKYSZ5CC4ZTZ7A2G', 'welshcorgicoin-token');
  axios({
    method: 'PATCH',
    url: poolUrl + `6?key=${API_KEY}`,
    data: {
      balance_x: stxWelshPair['balance-x']['value'],
      balance_y: stxWelshPair['balance-y']['value'],
      shares_total: stxWelshPair['shares-total']['value'],
      enabled: stxWelshPair['enabled']['value']
    },
    headers: { 'Content-Type': 'application/json' },
  });

  const wldnUsdaPair = await getSwapPair('SP3MBWGMCVC9KZ5DTAYFMG1D0AEJCR7NENTM3FTK5', 'wrapped-lydian-token', CONTRACT_ADDRESS, 'usda-token');
  axios({
    method: 'PATCH',
    url: poolUrl + `7?key=${API_KEY}`,
    data: {
      balance_x: wldnUsdaPair['balance-x']['value'],
      balance_y: wldnUsdaPair['balance-y']['value'],
      shares_total: wldnUsdaPair['shares-total']['value'],
      enabled: wldnUsdaPair['enabled']['value']
    },
    headers: { 'Content-Type': 'application/json' },
  });

  const ldnUsdaPair = await getSwapPair('SP3MBWGMCVC9KZ5DTAYFMG1D0AEJCR7NENTM3FTK5', 'lydian-token', CONTRACT_ADDRESS, 'usda-token');
  axios({
    method: 'PATCH',
    url: poolUrl + `8?key=${API_KEY}`,
    data: {
      balance_x: ldnUsdaPair['balance-x']['value'],
      balance_y: ldnUsdaPair['balance-y']['value'],
      shares_total: ldnUsdaPair['shares-total']['value'],
      enabled: ldnUsdaPair['enabled']['value']
    },
    headers: { 'Content-Type': 'application/json' },
  });

  const dikoPriceInfo = await getPriceInfo('DIKO');
  axios({
    method: 'PATCH',
    url: tokenUrl + `diko?key=${API_KEY}`,
    data: {
      last_price: dikoPriceInfo['last-price']['value'],
      price_last_updated: dikoPriceInfo['last-block']['value']
    },
    headers: { 'Content-Type': 'application/json' },
  });

  const stxPriceInfo = await getPriceInfo('STX');
  axios({
    method: 'PATCH',
    url: tokenUrl + `wstx?key=${API_KEY}`,
    data: {
      last_price: stxPriceInfo['last-price']['value'],
      price_last_updated: stxPriceInfo['last-block']['value']
    },
    headers: { 'Content-Type': 'application/json' },
  });

  const usdaPriceInfo = await getPriceInfo('USDA');
  axios({
    method: 'PATCH',
    url: tokenUrl + `usda?key=${API_KEY}`,
    data: {
      last_price: usdaPriceInfo['last-price']['value'],
      price_last_updated: usdaPriceInfo['last-block']['value']
    },
    headers: { 'Content-Type': 'application/json' },
  });

  const xbtcPriceInfo = await getPriceInfo('xBTC');
  axios({
    method: 'PATCH',
    url: tokenUrl + `xbtc?key=${API_KEY}`,
    data: {
      last_price: xbtcPriceInfo['last-price']['value'],
      price_last_updated: xbtcPriceInfo['last-block']['value']
    },
    headers: { 'Content-Type': 'application/json' },
  });

  const atAlexPriceInfo = await getPriceInfo('auto-alex');
  axios({
    method: 'PATCH',
    url: tokenUrl + `auto-alex?key=${API_KEY}`,
    data: {
      last_price: atAlexPriceInfo['last-price']['value'],
      price_last_updated: atAlexPriceInfo['last-block']['value']
    },
    headers: { 'Content-Type': 'application/json' },
  });

  const dikoStaked = await getTotalStaked('arkadiko-stake-pool-diko-v2-1');
  axios({
    method: 'PATCH',
    url: tokenUrl + `diko?key=${API_KEY}`,
    data: {
      total_staked: dikoStaked
    },
    headers: { 'Content-Type': 'application/json' },
  });

  const dikoUsdaStaked = await getTotalStaked('arkadiko-stake-pool-diko-usda-v1-1');
  axios({
    method: 'PATCH',
    url: tokenUrl + `ARKV1DIKOUSDA?key=${API_KEY}`,
    data: {
      total_staked: dikoUsdaStaked
    },
    headers: { 'Content-Type': 'application/json' },
  });

  const stxUsdaStaked = await getTotalStaked('arkadiko-stake-pool-wstx-usda-v1-1');
  axios({
    method: 'PATCH',
    url: tokenUrl + `ARKV1WSTXUSDA?key=${API_KEY}`,
    data: {
      total_staked: stxUsdaStaked
    },
    headers: { 'Content-Type': 'application/json' },
  });

  const stxDikoStaked = await getTotalStaked('arkadiko-stake-pool-wstx-diko-v1-1');
  axios({
    method: 'PATCH',
    url: tokenUrl + `ARKV1WSTXDIKO?key=${API_KEY}`,
    data: {
      total_staked: stxDikoStaked
    },
    headers: { 'Content-Type': 'application/json' },
  });

  const stxXbtcStaked = await getTotalStaked('arkadiko-stake-pool-wstx-xbtc-v1-1');
  axios({
    method: 'PATCH',
    url: tokenUrl + `ARKV1WSTXXBTC?key=${API_KEY}`,
    data: {
      total_staked: stxXbtcStaked
    },
    headers: { 'Content-Type': 'application/json' },
  });

  const xbtcUsdaStaked = await getTotalStaked('arkadiko-stake-pool-xbtc-usda-v1-1');
  axios({
    method: 'PATCH',
    url: tokenUrl + `arkv1xbtcusda?key=${API_KEY}`,
    data: {
      total_staked: xbtcUsdaStaked
    },
    headers: { 'Content-Type': 'application/json' },
  });

  const stxUsdaPriceInfo = await getPriceInfo('STX/USDA');
  axios({
    method: 'PATCH',
    url: tokenUrl + `stxusda?key=${API_KEY}`,
    data: {
      last_price: stxUsdaPriceInfo['last-price']['value'],
      price_last_updated: stxUsdaPriceInfo['last-block']['value']
    },
    headers: { 'Content-Type': 'application/json' },
  });
})();
