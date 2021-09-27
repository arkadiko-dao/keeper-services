# Arkadiko Keeper Services

This repo contains a few node.js scripts that allow you to query for unhealthy vaults.
Ideally a keeper sets up an event listener for new vaults, or keeps an off-chain database with all Arkadiko vaults. 
We will provide other scripts (or a Ruby on Rails API or similar) in the future for this.

1. Scan vaults

Iterates all vaults and checks a vault's collateralization ratio against the collateral type's liquidation ratio. Marks the vault for liquidation if insufficiently collateralized.

2. Liquidate vault

Takes a vault ID as parameter and liquidates that vault. The liquidation contract call will fail if the vault is still sufficiently collateralized.
