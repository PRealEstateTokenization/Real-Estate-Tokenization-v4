const { expect } = require('chai')
const { ethers, network } = require('hardhat')

const DAY = 86400
async function at(day, t0) { await network.provider.send('evm_setNextBlockTimestamp', [t0 + day * DAY]) }

describe('Rent shared by time held', function () {
  let wl, factory, market, token, owner, A, B, C, t0

  beforeEach(async () => {
    ;[owner, A, B, C] = await ethers.getSigners()
    wl = await (await ethers.getContractFactory('Whitelist')).deploy()
    for (const s of [owner, A, B, C]) await wl.connect(s).register()
    factory = await (await ethers.getContractFactory('PropertyTokenFactory')).deploy(await wl.getAddress())
    market = await (await ethers.getContractFactory('Marketplace')).deploy(await wl.getAddress())
    const blk = await ethers.provider.getBlock('latest')
    t0 = blk.timestamp + 100
    await at(0, t0)
    await factory.registerLand('Tower A', 'PRVK-A', 1000, ethers.ZeroHash, 'demo')
    token = await ethers.getContractAt('PropertyToken', (await factory.getAllTokens())[0])
  })

  it('splits rent by days held: owner 0-5, A 5-10, B 10-30', async () => {
    const m = await market.getAddress()
    // day 2: owner lists 100 units
    await at(2, t0); await token.approve(m, 100)
    await at(2.1, t0); await market.list(await token.getAddress(), 100, 200000)
    // day 5: A buys them
    await at(5, t0); await market.connect(A).buy(0, 100)
    // day 8: A lists (keeps earning while listed), day 10: B buys
    await at(8, t0); await token.connect(A).approve(m, 100)
    await at(8.1, t0); await market.connect(A).list(await token.getAddress(), 100, 210000)
    await at(10, t0); await market.connect(B).buy(1, 100)
    // day 30: ₹30,000 rent  ->  ₹1 per unit per day
    await at(30, t0); await token.depositYield(30000)

    expect(await token.pendingYield(owner.address)).to.equal(27500n) // 900×30 + 100×5
    expect(await token.pendingYield(A.address)).to.equal(500n)       // 100×5 (days 5-10)
    expect(await token.pendingYield(B.address)).to.equal(2000n)      // 100×20 (days 10-30)

    // second window, days 30-60, ₹6,000 -> ₹0.2 per unit per day
    await at(60, t0); await token.depositYield(6000)
    expect(await token.pendingYield(owner.address)).to.equal(27500n + 5400n)
    expect(await token.pendingYield(A.address)).to.equal(500n)
    expect(await token.pendingYield(B.address)).to.equal(2000n + 600n)
  })

  it('claims, then keeps accruing correctly after more transfers', async () => {
    await at(10, t0); await token.transfer(C.address, 500)    // C holds 500 from day 10
    await at(20, t0); await token.depositYield(20000)          // ₹1 per unit-day over 20 days
    expect(await token.pendingYield(C.address)).to.equal(5000n) // 500×10
    await at(21, t0); await token.connect(C).claimYield()
    expect(await token.pendingYield(C.address)).to.equal(0n)
    await at(25, t0); await token.connect(C).transfer(A.address, 250) // C keeps 250
    await at(40, t0); await token.depositYield(20000)          // days 20-40, ₹1 per unit-day
    // C: 500×5 (20-25) + 250×15 (25-40) = 6250 ; A: 250×15 = 3750 ; owner: 500×20 = 10000
    expect(await token.pendingYield(C.address)).to.equal(6250n)
    expect(await token.pendingYield(A.address)).to.equal(3750n)
    expect(await token.pendingYield(owner.address)).to.equal(15000n + 10000n)
    expect(await token.totalEarned(C.address)).to.equal(11250n)
  })

  it('rent windows add up to what was deposited', async () => {
    await at(3, t0); await token.transfer(A.address, 333)
    await at(7, t0); await token.connect(A).transfer(B.address, 111)
    await at(13, t0); await token.depositYield(123457)
    const sum = (await token.pendingYield(owner.address)) + (await token.pendingYield(A.address)) + (await token.pendingYield(B.address))
    const diff = sum > 123457n ? sum - 123457n : 123457n - sum
    expect(diff).to.be.lte(1n) // at most ₹1 of rounding across all holders
  })

  it('marketplace guards', async () => {
    const m = await market.getAddress(); const tk = await token.getAddress()
    await token.approve(m, 1000)
    await market.list(tk, 600, 100)
    await expect(market.list(tk, 500, 100)).to.be.revertedWith('Not enough units')
    await expect(market.buy(0, 1)).to.be.revertedWith("You can't buy your own units")
    await market.connect(A).buy(0, 200)
    expect((await market.listings(0))[2]).to.equal(400n)
    await market.cancel(0)
    expect((await market.listings(0))[4]).to.equal(false)
    expect(await token.balanceOf(owner.address)).to.equal(800n)
    await expect(token.connect(A).depositYield(1)).to.be.revertedWith('Only the property owner can distribute rent')
  })
})
