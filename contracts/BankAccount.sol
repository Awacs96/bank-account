// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

contract BankAccount {

    event Deposit(address indexed user, uint indexed accountId, uint value, uint timestamp);
    event WithdrawRequested(address indexed user, uint indexed accountId, uint indexed withdrawId, uint amount, uint timestamp);
    event Withdraw(uint indexed withdrawId, uint timestamp);
    event AccountCreated(address[] owners, uint indexed id, uint timestamp);

    struct WithdrawRequest {
        address user;
        uint amout;
        uint approvals;
        mapping(address => bool) ownersApproved;
        bool approved;
    }

    struct Account {
        address[]owners;
        uint balance;
        mapping(uint => WithdrawRequest) withdrawRequest;
    }

    mapping(uint =>Account) accounts;
    mapping(address => uint[]) userAccounts;

    uint nextAccountId;
    uint nextWithdrawId;

    function deposit(uint accountId) external payable {

    }

    function createAccount(address[] calldata owners) external {

    }

    function requestWithdrawl(uint accountId, uint amount) external {

    }

    function approveWithdrawl(uint accountId, uint withdrawId) external {

    }

    function withdraw(uint accountId, uint withdrawId) external {

    }

    function getBalance(uint accountId) public view returns(uint) {

    }

    function getOwners(uint accountId) public view returns(address [] memory) {

    }

    function getApprovals(uint accountId, uint withdrawId) public view returns(uint) {

    }

    function getAccounts() public view returns(uint[] memory) {

    }

}
