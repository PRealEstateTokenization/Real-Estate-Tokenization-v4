require('@nomicfoundation/hardhat-ethers')
require('@nomicfoundation/hardhat-chai-matchers')
require('dotenv').config()

const { SEPOLIA_RPC_URL, PRIVATE_KEY } = process.env

module.exports = {
  solidity: { version: '0.8.24', settings: { optimizer: { enabled: true, runs: 200 } } },
  networks: {
    // Sepolia test network only. Never add mainnet here.
    ...(SEPOLIA_RPC_URL && PRIVATE_KEY ? { sepolia: { url: SEPOLIA_RPC_URL, accounts: [PRIVATE_KEY] } } : {}),
  },
}
