// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// Self-service KYC list for the demo. Unchanged from the current version.
contract Whitelist {
    mapping(address => bool) public isApproved;
    event Registered(address indexed account);

    function register() external {
        require(!isApproved[msg.sender], "Already registered");
        isApproved[msg.sender] = true;
        emit Registered(msg.sender);
    }
}
