// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IWhitelist} from "./PropertyToken.sol";

/**
 * @title Marketplace
 * @notice Offers to sell property units. Payment is in rupees, off-chain.
 *
 * Listed units STAY IN THE SELLER'S WALLET (no escrow), so the seller keeps
 * earning rent until the units are actually bought. Listing only reserves the
 * units; buy() moves them straight from seller to buyer using the seller's
 * approval.
 */
contract Marketplace {
    struct Listing {
        address seller;
        address token;
        uint256 amount;        // units still for sale
        uint256 pricePerToken; // rupees per unit
        bool active;
    }

    IWhitelist public immutable whitelist;
    mapping(uint256 => Listing) public listings;
    uint256 public nextListingId;
    /// units each seller has reserved in open listings, per token
    mapping(address => mapping(address => uint256)) public reserved;

    event Listed(uint256 indexed id, address indexed seller, address indexed token, uint256 amount, uint256 pricePerToken);
    event Bought(uint256 indexed id, address indexed buyer, uint256 amount, uint256 remaining);
    event Cancelled(uint256 indexed id, uint256 amountReturned);

    constructor(address whitelist_) {
        whitelist = IWhitelist(whitelist_);
    }

    function list(address token, uint256 amount, uint256 pricePerToken) external returns (uint256 id) {
        require(whitelist.isApproved(msg.sender), "Seller not KYC-approved");
        require(amount > 0, "Amount must be > 0");
        require(pricePerToken > 0, "Price must be > 0");
        uint256 total = reserved[token][msg.sender] + amount;
        require(IERC20(token).balanceOf(msg.sender) >= total, "Not enough units");
        require(IERC20(token).allowance(msg.sender, address(this)) >= total, "Approve the marketplace first");

        reserved[token][msg.sender] = total;
        id = nextListingId++;
        listings[id] = Listing(msg.sender, token, amount, pricePerToken, true);
        emit Listed(id, msg.sender, token, amount, pricePerToken);
    }

    function buy(uint256 id, uint256 amount) external {
        Listing storage l = listings[id];
        require(l.active, "Listing not active");
        require(whitelist.isApproved(msg.sender), "Buyer not KYC-approved");
        require(amount > 0 && amount <= l.amount, "Invalid amount");
        require(msg.sender != l.seller, "You can't buy your own units");

        l.amount -= amount;
        if (l.amount == 0) l.active = false;
        reserved[l.token][l.seller] -= amount;

        require(IERC20(l.token).transferFrom(l.seller, msg.sender, amount), "Transfer failed");
        emit Bought(id, msg.sender, amount, l.amount);
    }

    function cancel(uint256 id) external {
        Listing storage l = listings[id];
        require(l.seller == msg.sender, "Not seller");
        require(l.active, "Listing not active");
        uint256 left = l.amount;
        l.active = false;
        l.amount = 0;
        reserved[l.token][l.seller] -= left;
        emit Cancelled(id, left);
    }
}
