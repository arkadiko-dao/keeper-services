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
const fetchTotalSupply = async () => {
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

(async () => {
  const stDikoSupply = await fetchTotalSupply();
  axios({
    method: 'PATCH',
    url: url + `stdiko?key=${API_KEY}`, 
    data: {
      total_supply: stDikoSupply,
    },
    headers: { 'Content-Type': 'application/json' },
  })
  .then(function (response) {
    console.log(response.data);
  })
  .catch(function (error) {
    console.log(error);
  });

  
})();
