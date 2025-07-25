require('dotenv').config();
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const tx = require('@stacks/transactions');
const utils = require('./utils');
const network = utils.resolveNetwork();

// Epoch end
async function getEpochEndBlock() {
  const call = await tx.fetchCallReadOnlyFunction({
    contractAddress: CONTRACT_ADDRESS,
    contractName: 'arkadiko-liquidation-rewards-diko-v1-1',
    functionName: 'get-end-epoch-block',
    functionArgs: [],
    senderAddress: CONTRACT_ADDRESS,
    network: 'mainnet'
  });
  return tx.cvToJSON(call).value.value;
}

// Add rewards
async function addRewards() {
  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: 'arkadiko-liquidation-rewards-diko-v1-1',
    functionName: 'add-rewards',
    functionArgs: [
      tx.contractPrincipalCV(CONTRACT_ADDRESS, 'arkadiko-liquidation-rewards-v1-2'),
    ],
    senderKey: process.env.STACKS_PRIVATE_KEY,
    postConditionMode: 1,
    network
  };
  const transaction = await tx.makeContractCall(txOptions);
  const result = tx.broadcastTransaction(transaction, network);
  return await utils.processing(result, transaction.txid(), 0);
};

async function start() {

  // Check if rewards can be added
  const currentBlock = await utils.getBlockHeight();
  const epochEndBlock = await getEpochEndBlock();

  console.log("Check if liquidation pool rewards must be added..");
  console.log(" - Current block: ", currentBlock);
  console.log(" - Epoch end block: ", epochEndBlock);

  // Add rewards
  // if (currentBlock >= epochEndBlock + 10) {
  //   await addRewards();
  // }
}

start();
