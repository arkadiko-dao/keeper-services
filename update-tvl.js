require('dotenv').config();
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const API_KEY = process.env.API_KEY;
const axios = require('axios');
const tx = require('@stacks/transactions');
const utils = require('./utils');
const network = utils.resolveNetwork();

const tvlUrl = 'https://arkadiko-api.herokuapp.com/api/v1/blockchains/1';
// const tvlUrl = 'http://localhost:3000/api/v1/blockchains/1';

const fetchVaultsTvl = async (prices) => {
  let url = `https://stacks-node-api.mainnet.stacks.co/extended/v1/address/SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.arkadiko-stacker-v3-1/balances`;
  let response = await fetch(url, { credentials: 'omit' });
  let data = await response.json();
  let sum = (data['stx']['balance'] / 1000000) * (prices['stx'] / 1000000);
  
  url = `https://stacks-node-api.mainnet.stacks.co/extended/v1/address/SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.arkadiko-stacker-2-v3-1/balances`;
  response = await fetch(url, { credentials: 'omit' });
  data = await response.json();
  sum += (data['stx']['balance'] / 1000000) * (prices['stx'] / 1000000);

  url = `https://stacks-node-api.mainnet.stacks.co/extended/v1/address/SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.arkadiko-stacker-3-v3-1/balances`;
  response = await fetch(url, { credentials: 'omit' });
  data = await response.json();
  sum += (data['stx']['balance'] / 1000000) * (prices['stx'] / 1000000);

  url = `https://stacks-node-api.mainnet.stacks.co/extended/v1/address/SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.arkadiko-stacker-4-v3-1/balances`;
  response = await fetch(url, { credentials: 'omit' });
  data = await response.json();
  sum += (data['stx']['balance'] / 1000000) * (prices['stx'] / 1000000);

  url = `https://stacks-node-api.mainnet.stacks.co/extended/v1/address/SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.arkadiko-stx-reserve-v1-1/balances`;
  response = await fetch(url, { credentials: 'omit' });
  data = await response.json();
  sum += (data['stx']['balance'] / 1000000) * (prices['stx'] / 1000000);

  url = `https://stacks-node-api.mainnet.stacks.co/extended/v1/address/SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.arkadiko-claim-yield-v2-1/balances`;
  response = await fetch(url, { credentials: 'omit' });
  data = await response.json();
  sum += (data['stx']['balance'] / 1000000) * (prices['stx'] / 1000000);

  return sum;
};

const fetchSwapTvl = async (prices) => {
  const url = `https://stacks-node-api.mainnet.stacks.co/extended/v1/address/SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.arkadiko-swap-v2-1/balances`;
  const response = await fetch(url, { credentials: 'omit' });
  const data = await response.json();
  let sum = 0;

  sum += (data['stx']['balance'] / 1000000) * (prices['stx'] / 1000000);
  sum += (data['fungible_tokens']['SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.arkadiko-token::diko']['balance'] / 1000000) * (prices['diko'] / 1000000);
  sum += (data['fungible_tokens']['SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.usda-token::usda']['balance'] / 1000000);
  sum += (data['fungible_tokens']['SP3DX3H4FEYZJZ586MFBS25ZW3HZDMEW92260R2PR.Wrapped-Bitcoin::wrapped-bitcoin']['balance'] / 100000000) * (prices['xbtc'] / 100000000);

  return sum;
};

const fetchPrices = async () => {
  const url = 'https://arkadiko-api.herokuapp.com/api/v1/pages/oracle';
  const response = await fetch(url, { credentials: 'omit' });
  const data = await response.json();

  const hsh = {
    'stx': data['wstx']['last_price'],
    'diko': data['diko']['last_price'],
    'usda': data['usda']['last_price'],
    'xbtc': data['xbtc']['last_price']
  };

  return hsh;
};

(async () => {
  const prices = await fetchPrices();
  const vaultsTvl = await fetchVaultsTvl(prices);
  const swapTvl = await fetchSwapTvl(prices);
  axios({
    method: 'PATCH',
    url: tvlUrl + `?key=${API_KEY}`,
    data: {
      vaults_tvl: vaultsTvl,
      swap_tvl: swapTvl
    },
    headers: { 'Content-Type': 'application/json' },
  });
})();
