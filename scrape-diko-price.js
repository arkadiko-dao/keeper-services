require('dotenv').config();
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const CONTRACT_NAME = 'arkadiko-oracle-v1-1';
const tx = require('@stacks/transactions');
const fs = require('fs');
const utils = require('./utils');
const network = utils.resolveNetwork();
const AWS = require('aws-sdk');
const BUCKET_NAME = 'arkadiko-prices';
const axios = require('axios');

const fetchPair = async () => {
  let details = await tx.callReadOnlyFunction({
    contractAddress: CONTRACT_ADDRESS,
    contractName: "arkadiko-swap-v1-1",
    functionName: "get-pair-details",
    functionArgs: [
      tx.contractPrincipalCV(CONTRACT_ADDRESS, 'arkadiko-token'),
      tx.contractPrincipalCV(CONTRACT_ADDRESS, 'usda-token')
    ],
    senderAddress: CONTRACT_ADDRESS,
    network: network,
  });

  return tx.cvToJSON(details);
};

(async () => {
  const pair = await fetchPair();
  if (pair.success) {
    const pairDetails = pair.value.value.value;
    const dikoPrice = (pairDetails['balance-y'].value / pairDetails['balance-x'].value).toFixed(4);
    const timestamp = Date.now();

    const s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_ACCESS_KEY_SECRET
    });

    const url = 'https://arkadiko-prices.s3.eu-central-1.amazonaws.com/prices.json';
    const response = await axios.get(url);
    let obj = response.data;
    obj[timestamp] = {};
    obj[timestamp]['diko-usda'] = dikoPrice;
    json = JSON.stringify(obj);

    const params = {
      Bucket: BUCKET_NAME,
      Key: 'prices.json',
      Body: json
    };
    s3.upload(params, function(err, data) {
      if (err) {
        throw err;
      }
      console.log(`File uploaded successfully. ${data.Location}`);
    });
  }
})();
