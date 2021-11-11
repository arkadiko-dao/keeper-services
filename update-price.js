require('dotenv').config();
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const CONTRACT_NAME = 'arkadiko-oracle-v1-1';
const FUNCTION_NAME = 'update-price';
const rp = require('request-promise');
const tx = require('@stacks/transactions');
const BN = require('bn.js');
const utils = require('./utils');
const network = utils.resolveNetwork();

const setPrice = async (stxPrice, btcPrice) => {
  let nonce = await utils.getNonce('SP17BSF329AQEY7YA3CWQHN3KGQYTYYP7208CQH4G');
  const priceWithDecimals = stxPrice.toFixed(4) * 1000000;

  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: FUNCTION_NAME,
    functionArgs: [tx.stringAsciiCV('STX'), tx.uintCV(new BN(priceWithDecimals)), tx.uintCV(1000000)],
    senderKey: process.env.STACKS_PRIVATE_KEY,
    nonce: new BN(nonce),
    postConditionMode: 1,
    network
  };
  const transaction = await tx.makeContractCall(txOptions);
  const result = tx.broadcastTransaction(transaction, network);
  await utils.processing(result, transaction.txid(), 0);

  const xTxOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: FUNCTION_NAME,
    functionArgs: [tx.stringAsciiCV('xSTX'), tx.uintCV(new BN(priceWithDecimals)), tx.uintCV(1000000)],
    senderKey: process.env.STACKS_PRIVATE_KEY,
    nonce: new BN(nonce + 1),
    postConditionMode: 1,
    network
  };
  const transaction2 = await tx.makeContractCall(xTxOptions);
  const result2 = tx.broadcastTransaction(transaction2, network);
  await utils.processing(result2, transaction2.txid(), 0);

  const xBtcTxOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: FUNCTION_NAME,
    functionArgs: [tx.stringAsciiCV('xBTC'), tx.uintCV(new BN(btcPrice.toFixed(0) * 1000000)), tx.uintCV(100000000)],
    senderKey: process.env.STACKS_PRIVATE_KEY,
    nonce: new BN(nonce + 2),
    postConditionMode: 1,
    network
  };
  const transaction3 = await tx.makeContractCall(xBtcTxOptions);
  const result3 = tx.broadcastTransaction(transaction3, network);
  await utils.processing(result3, transaction3.txid(), 0);

  const fetchPair = async () => {
    let details = await tx.callReadOnlyFunction({
      contractAddress: CONTRACT_ADDRESS,
      contractName: "arkadiko-swap-v2-1",
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

  const pair = await fetchPair();
  if (pair.success) {
    const pairDetails = pair.value.value.value;
    const dikoPrice = (pairDetails['balance-y'].value / pairDetails['balance-x'].value).toFixed(4);

    const dikoTxOptions = {
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: FUNCTION_NAME,
      functionArgs: [tx.stringAsciiCV('DIKO'), tx.uintCV(new BN(dikoPrice * 1000000)), tx.uintCV(1000000)],
      senderKey: process.env.STACKS_PRIVATE_KEY,
      nonce: new BN(nonce + 3),
      postConditionMode: 1,
      network
    };
    const transaction4 = await tx.makeContractCall(dikoTxOptions);
    const result4 = tx.broadcastTransaction(transaction4, network);
    await utils.processing(result4, transaction4.txid(), 0);
  }

  const fetchPairStxUsda = async () => {
    let details = await tx.callReadOnlyFunction({
      contractAddress: CONTRACT_ADDRESS,
      contractName: "arkadiko-swap-v2-1",
      functionName: "get-pair-details",
      functionArgs: [
        tx.contractPrincipalCV(CONTRACT_ADDRESS, 'wrapped-stx-token'),
        tx.contractPrincipalCV(CONTRACT_ADDRESS, 'usda-token')
      ],
      senderAddress: CONTRACT_ADDRESS,
      network: network,
    });

    return tx.cvToJSON(details);
  };
  const stxUsda = await fetchPairStxUsda();
  if (stxUsda.success) {
    const stxUsdaDetails = stxUsda.value.value.value;
    const stxAMMPrice = (stxUsdaDetails['balance-y'].value / stxUsdaDetails['balance-x'].value).toFixed(4);
    const usdaPrice = (stxPrice/stxAMMPrice).toFixed(4);

    const usdaTxOptions = {
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: FUNCTION_NAME,
      functionArgs: [tx.stringAsciiCV('USDA'), tx.uintCV(new BN(usdaPrice * 1000000)), tx.uintCV(1000000)],
      senderKey: process.env.STACKS_PRIVATE_KEY,
      nonce: new BN(nonce + 4),
      postConditionMode: 1,
      network
    };
    const transaction5 = await tx.makeContractCall(usdaTxOptions);
    const result5 = tx.broadcastTransaction(transaction5, network);
    await utils.processing(result5, transaction5.txid(), 0);
  }
};

const requestOptions = {
  method: 'GET',
  uri: 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest',
  qs: {
    'id': '4847,1',
    'convert': 'USD'
  },
  headers: {
    'X-CMC_PRO_API_KEY': process.env.CMC_API_KEY
  },
  json: true,
  gzip: true
};

rp(requestOptions).then(async (response) => {
  let stxPrice = response['data']['4847']['quote']['USD']['price'];
  let btcPrice = response['data']['1']['quote']['USD']['price'];
  if (stxPrice && btcPrice && stxPrice != 0 && btcPrice != 0) {
    await setPrice(stxPrice, btcPrice);
  }
});

// setPrice(0.5); // 0.5 USD
