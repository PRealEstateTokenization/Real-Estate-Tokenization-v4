// Deploys the contracts to Sepolia and updates the website's config in ../public/
//
//   npm run deploy
//
// Reuses the Whitelist already in ../public/addresses.json, so wallets that
// registered before stay approved. Set FRESH_WHITELIST=1 in .env for a new one.
const fs = require('fs')
const path = require('path')
const hre = require('hardhat')

const PUBLIC = path.join(__dirname, '..', '..', 'public')

async function main() {
  const { ethers } = hre
  const [deployer] = await ethers.getSigners()
  console.log(`Deploying from ${deployer.address} on ${hre.network.name}\n`)

  const addrFile = path.join(PUBLIC, 'addresses.json')
  const old = fs.existsSync(addrFile) ? JSON.parse(fs.readFileSync(addrFile, 'utf8')) : {}

  let whitelist = !process.env.FRESH_WHITELIST && old.whitelist
  if (whitelist) {
    console.log('Whitelist             reusing', whitelist)
  } else {
    const wl = await (await ethers.getContractFactory('Whitelist')).deploy()
    await wl.waitForDeployment()
    whitelist = await wl.getAddress()
    console.log('Whitelist            ', whitelist)
  }

  const factory = await (await ethers.getContractFactory('PropertyTokenFactory')).deploy(whitelist)
  await factory.waitForDeployment()
  console.log('PropertyTokenFactory ', await factory.getAddress())

  const market = await (await ethers.getContractFactory('Marketplace')).deploy(whitelist)
  await market.waitForDeployment()
  console.log('Marketplace          ', await market.getAddress())

  const addresses = {
    ...old,
    rpc: old.rpc || process.env.SEPOLIA_RPC_URL,
    whitelist,
    factory: await factory.getAddress(),
    marketplace: await market.getAddress(),
  }
  const abi = (name) => hre.artifacts.readArtifactSync(name).abi
  const abis = {
    Whitelist: abi('Whitelist'),
    PropertyToken: abi('PropertyToken'),
    PropertyTokenFactory: abi('PropertyTokenFactory'),
    Marketplace: abi('Marketplace'),
  }
  fs.mkdirSync(PUBLIC, { recursive: true })
  fs.writeFileSync(addrFile, JSON.stringify(addresses, null, 2) + '\n')
  fs.writeFileSync(path.join(PUBLIC, 'abis.json'), JSON.stringify(abis) + '\n')
  console.log('\nUpdated public/addresses.json and public/abis.json. Commit and push to update the site.')
}

main().catch((e) => { console.error(e); process.exitCode = 1 })
