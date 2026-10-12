# Parcel.io contracts

Solidity contracts for Parcel.io, deployed to the **Sepolia test network only**.

| Contract | What it does |
|---|---|
| `Whitelist` | Self-service KYC list. Wallets call `register()` once. |
| `PropertyTokenFactory` | `registerLand(...)` creates one `PropertyToken` per property. |
| `PropertyToken` | The units of one property (whole units). Rent is shared by **units × time held**. |
| `Marketplace` | Offers to sell units. Units stay in the seller's wallet (and keep earning) until bought. |

## Setup (once)
```
cd blockchain
npm install
cp .env.example .env      # then fill in SEPOLIA_RPC_URL and PRIVATE_KEY
```

## Test
```
npm test
```

## Deploy
```
npm run deploy
```
This deploys to Sepolia and rewrites `../public/addresses.json` and `../public/abis.json`,
so the website points at the new contracts. Then from the repo root:
```
git add public blockchain
git commit -m "Deploy contracts"
git push
```
Properties registered on older contracts don't carry over; register them again on the site.

## Safety
- `.env` holds your private key. It is in `.gitignore`; check with `git ls-files | grep -i env` (must print nothing).
- Use a testnet-only wallet. Never add mainnet to `hardhat.config.js`.
