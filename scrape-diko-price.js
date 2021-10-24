require('dotenv').config();
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const CONTRACT_NAME = 'arkadiko-oracle-v1-1';
const tx = require('@stacks/transactions');
const fs = require('fs');
const utils = require('./utils');
const network = utils.resolveNetwork();

if (!fs.existsSync('prices.json')) {
  fs.writeFile('prices.json', JSON.stringify({}), (err) => {
    if (err) {
      console.log(err);
    } else {
      console.log("File written successfully");
    }
  });
} else {
  fs.readFile('prices.json', async (err, data) => {
    if (err) {
      console.log(err);
    } else {
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

      const pair = await fetchPair();
      if (pair.success) {
        const pairDetails = pair.value.value.value;
        const dikoPrice = (pairDetails['balance-y'].value / pairDetails['balance-x'].value).toFixed(4);
        const timestamp = Date.now();

        obj = JSON.parse(data);
        obj[timestamp] = {};
        obj[timestamp]['diko-usda'] = dikoPrice;
        json = JSON.stringify(obj);
        fs.writeFile('prices.json', json, (err) => {
          if (err) {
            console.log(err);
          } else {
            console.log("File written successfully");
          }
        });
      }
    }
  });
}
