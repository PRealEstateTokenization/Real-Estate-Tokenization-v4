// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

interface IWhitelist {
    function isApproved(address account) external view returns (bool);
}

/**
 * @title PropertyToken
 * @notice Units of one rent-earning property. Whole units only (decimals = 0).
 *
 * Rent is shared by TIME HELD, not by who holds units on the day it is paid.
 *
 *   Each distribution covers the time since the previous one (or since the
 *   property was listed). A holder's share is
 *
 *       (units they held x seconds they held them during that window)
 *       ----------------------------------------------------------------
 *              (total units x length of the window)
 *
 *   Example: listed on day 0, rent paid on day 30. A buys 100 units from the
 *   owner on day 5 and sells them to B on day 10. For those 100 units, the owner
 *   earns days 0-5, A earns days 5-10 and B earns days 10-30.
 *
 * Rupees never move on-chain. depositYield records a rent payment and
 * claimYield records that a holder has been paid their share.
 *
 * Accounting is O(1) per transfer: each account keeps the unit-seconds it has
 * built up in the current window, and finished windows are settled lazily the
 * next time the account is touched (or read through pendingYield).
 */
contract PropertyToken is ERC20 {
    bytes32 public immutable docHash;
    address public immutable registrant;
    IWhitelist public immutable whitelist;
    string public metadataURI;

    uint256 private constant SCALE = 1e30; // high precision so whole-rupee results come out exact

    /// One finished rent window.
    struct Period {
        uint64 start;
        uint64 end;
        uint256 amount;   // rupees distributed for this window
        uint256 rate;     // rupees per unit-second, scaled by 1e30
    }
    Period[] private _periods;
    /// _cumPerUnit[k] = rupees (scaled) earned by ONE unit held through windows 0..k
    uint256[] private _cumPerUnit;
    /// Start of the window that is currently running.
    uint64 public currentPeriodStart;

    struct Account {
        uint64 last;          // last time this account was settled
        uint32 period;        // window index at that time
        uint256 unitSeconds;  // unit-seconds built up in that window so far
        uint256 earnedScaled; // rent earned in finished windows (scaled by 1e30)
        uint256 claimed;      // rupees already claimed
    }
    mapping(address => Account) private _acct;

    uint256 public totalYieldDeposited;
    uint256 public totalYieldClaimed;

    event YieldDeposited(uint256 indexed period, uint256 amount, uint64 fromTime, uint64 toTime);
    event YieldClaimed(address indexed holder, uint256 amount);

    constructor(
        string memory name_,
        string memory symbol_,
        uint256 totalTokens,
        bytes32 docHash_,
        string memory metadataURI_,
        address whitelist_,
        address registrant_
    ) ERC20(name_, symbol_) {
        docHash = docHash_;
        metadataURI = metadataURI_;
        whitelist = IWhitelist(whitelist_);
        registrant = registrant_;
        currentPeriodStart = uint64(block.timestamp);
        _mint(registrant_, totalTokens);
    }

    function decimals() public pure override returns (uint8) {
        return 0;
    }

    /* ------------------------------------------------------------------ */
    /*  Rent                                                               */
    /* ------------------------------------------------------------------ */

    /// Record a rent payment (in rupees) for the window since the last one.
    function depositYield(uint256 amount) external {
        require(msg.sender == registrant, "Only the property owner can distribute rent");
        require(amount > 0, "Amount must be > 0");
        uint64 nowT = uint64(block.timestamp);
        require(nowT > currentPeriodStart, "Wait a moment before distributing again");

        uint256 duration = nowT - currentPeriodStart;
        uint256 rate = (amount * SCALE) / (totalSupply() * duration);
        uint256 prev = _cumPerUnit.length == 0 ? 0 : _cumPerUnit[_cumPerUnit.length - 1];

        _periods.push(Period(currentPeriodStart, nowT, amount, rate));
        _cumPerUnit.push(prev + rate * duration);
        emit YieldDeposited(_periods.length - 1, amount, currentPeriodStart, nowT);

        currentPeriodStart = nowT;
        totalYieldDeposited += amount;
    }

    /// Rent this account can claim now, from all finished windows.
    function pendingYield(address account) public view returns (uint256) {
        Account memory s = _acct[account];
        return _rupees(_settledScaled(s, balanceOf(account))) - s.claimed;
    }

    /// Mark your share of distributed rent as paid out.
    function claimYield() external {
        _settle(msg.sender);
        Account storage s = _acct[msg.sender];
        uint256 amount = _rupees(s.earnedScaled) - s.claimed;
        require(amount > 0, "Nothing to claim");
        s.claimed += amount;
        totalYieldClaimed += amount;
        emit YieldClaimed(msg.sender, amount);
    }

    /// Lifetime rent earned by an account (claimed + unclaimed).
    function totalEarned(address account) external view returns (uint256) {
        return _rupees(_settledScaled(_acct[account], balanceOf(account)));
    }

    function periodCount() external view returns (uint256) {
        return _periods.length;
    }

    function periodAt(uint256 i) external view returns (uint64 start, uint64 end, uint256 amount) {
        Period memory p = _periods[i];
        return (p.start, p.end, p.amount);
    }

    /* ------------------------------------------------------------------ */
    /*  Internals                                                          */
    /* ------------------------------------------------------------------ */

    /// Scaled amount to whole rupees, rounded to the nearest rupee.
    function _rupees(uint256 scaled) private pure returns (uint256) {
        return (scaled + SCALE / 2) / SCALE;
    }

    /// earnedScaled including any windows that finished since the last settle.
    function _settledScaled(Account memory s, uint256 bal) private view returns (uint256 e) {
        e = s.earnedScaled;
        uint256 n = _periods.length;
        if (s.last == 0 || s.period >= n) return e;
        Period memory p = _periods[s.period];
        // rest of the window the account was in
        e += (s.unitSeconds + bal * (p.end - s.last)) * p.rate;
        // whole windows after it, at a constant balance
        if (n - 1 > s.period) e += bal * (_cumPerUnit[n - 1] - _cumPerUnit[s.period]);
    }

    /// Bring an account up to now. Must run BEFORE its balance changes.
    function _settle(address a) private {
        Account storage s = _acct[a];
        uint64 nowT = uint64(block.timestamp);
        uint32 n = uint32(_periods.length);
        uint256 bal = balanceOf(a);
        if (s.last == 0) {
            s.last = nowT;
            s.period = n;
            return;
        }
        if (s.period < n) {
            s.earnedScaled = _settledScaled(s, bal);
            s.unitSeconds = bal * (nowT - currentPeriodStart);
        } else {
            s.unitSeconds += bal * (nowT - s.last);
        }
        s.period = n;
        s.last = nowT;
    }

    /// KYC on every transfer, and settle both sides before balances move.
    function _update(address from, address to, uint256 value) internal override {
        if (from != address(0)) {
            require(whitelist.isApproved(from), "Sender not KYC-approved");
            _settle(from);
        }
        if (to != address(0)) {
            require(whitelist.isApproved(to), "Recipient not KYC-approved");
            _settle(to);
        }
        super._update(from, to, value);
    }
}
