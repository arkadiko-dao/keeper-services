require('dotenv').config();
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const tx = require('@stacks/transactions');
const utils = require('./utils');
const network = utils.resolveNetwork();
const axios = require('axios');

const apiUrl = 'https://api.hiro.so';
const sinceBlock = 116250;

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

async function getVaultById(vaultId) {
  const vaultTx = await tx.callReadOnlyFunction({
    contractAddress: CONTRACT_ADDRESS,
    contractName: "arkadiko-freddie-v1-1",
    functionName: "get-vault-by-id",
    functionArgs: [tx.uintCV(vaultId)],
    senderAddress: CONTRACT_ADDRESS,
    network
  });

  return tx.cvToJSON(vaultTx).value;
}

async function getTransactions() {
  const unstackContract = 'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.arkadiko-pox-unstack-unlock-v2-4';
  let url = `${apiUrl}/extended/v1/address/${unstackContract}/transactions?limit=50`;
  let response = await axios.get(url);
  let totalCollateral = 0;
  let additionalCollateral = 0;

  await asyncForEach(response.data['results'], async (result) => {
    if (result['tx_status'] === 'success' && result['tx_type'] === 'contract_call' && result['block_height'] >= sinceBlock) {
      const vaultId = result['contract_call']['function_args'][0]['repr'].replace('u', '');

      if (vaultId != 2050) {
        const vault = await getVaultById(vaultId);
        totalCollateral += vault['collateral']['value'];
        console.log('Vault with ID', vaultId, 'unstacking', vault['collateral']['value'] / 1000000, 'STX');
      }
    }
  });

  console.log('Total STX unstacking:', totalCollateral / 1000000);

  const depositContract = 'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.arkadiko-stx-reserve-v1-1';
  url = `${apiUrl}/extended/v1/address/${depositContract}/transactions?limit=50`;
  response = await axios.get(url);

  await asyncForEach(response.data['results'], async (result) => {
    if (result['tx_status'] === 'success' &&
      result['tx_type'] === 'contract_call' &&
      result['block_height'] >= sinceBlock &&
      (result['contract_call']['function_name'] === 'deposit' || result['contract_call']['function_name'] === 'collateralize-and-mint')
    ) {
      const index = result['contract_call']['function_name'] === 'deposit' ? 1 : 0;
      const amount = result['contract_call']['function_args'][index]['repr'].replace('u', '');

      additionalCollateral += parseInt(amount, 10)
      console.log('Added', amount / 1000000, 'STX');
    }
 });

  console.log('Total STX added:', additionalCollateral / 1000000);
  console.log('Total inflow/outflow:', (totalCollateral - additionalCollateral) / 1000000);
}

getTransactions();
