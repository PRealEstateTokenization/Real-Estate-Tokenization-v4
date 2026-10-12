// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {PropertyToken, IWhitelist} from "./PropertyToken.sol";

contract PropertyTokenFactory {
    IWhitelist public immutable whitelist;
    address[] private _all;
    mapping(address => address[]) private _byOwner;

    event LandRegistered(address indexed owner, address indexed tokenAddress, bytes32 docHash, uint256 totalTokens);

    constructor(address whitelist_) {
        whitelist = IWhitelist(whitelist_);
    }

    function registerLand(
        string calldata name_,
        string calldata symbol_,
        uint256 totalTokens,
        bytes32 docHash,
        string calldata metadataURI
    ) external returns (address tokenAddress) {
        require(whitelist.isApproved(msg.sender), "Caller not KYC-approved");
        require(totalTokens > 0, "Token count must be > 0");
        PropertyToken t = new PropertyToken(name_, symbol_, totalTokens, docHash, metadataURI, address(whitelist), msg.sender);
        tokenAddress = address(t);
        _all.push(tokenAddress);
        _byOwner[msg.sender].push(tokenAddress);
        emit LandRegistered(msg.sender, tokenAddress, docHash, totalTokens);
    }

    function getAllTokens() external view returns (address[] memory) {
        return _all;
    }

    function getTokensByOwner(address owner) external view returns (address[] memory) {
        return _byOwner[owner];
    }
}
