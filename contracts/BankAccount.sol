// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

contract BankAccount {

    event Deposit(address indexed user, uint indexed accountId, uint value, uint timestamp);
    event WithdrawRequested(address indexed user, uint indexed accountId, uint indexed withdrawId, uint amount, uint timestamp);
    event Withdraw(uint indexed withdrawId, uint timestamp);
    event AccountCreated(address[] owners, uint indexed id, uint timestamp);

    struct WithdrawRequest {
        address user;
        uint amount;
        uint approvals;
        mapping(address => bool) ownersApproved;
        bool approved;
    }

    struct Account {
        address[] owners;
        uint balance;
        mapping(uint => WithdrawRequest) withdrawRequest;
    }

    mapping(uint => Account) accounts;
    mapping(address => uint[]) userAccounts;

    uint nextAccountId;
    uint nextWithdrawId;

    modifier isAccountOwner(uint accountId) {
        bool isOwner;

        for (uint i; i < accounts[accountId].owners.length; i++) {
            if (accounts[accountId].owners[i] == msg.sender) {
                isOwner = true;
                break;
            }
        }

        require(isOwner, "You may not deposit to an account your are not an owner of.");
        _;
    }

    modifier validOwners(address[] calldata owners) {
        require(owners.length <= 3, "Each account can have a maximum of 4 owners.");

        for(uint i; i < owners.length; i++) {
            for (uint j = i + 1; j < owners.length; j++) {
                if (owners[i] == owners[j] || owners[i] == msg.sender || owners[j] == msg.sender) {
                    revert("No duplicate owners possible.");
                }
            }
        }
        _;
    }

    modifier sufficientBalance(uint accountId, uint amount) {
        require(accounts[accountId].balance >= amount, "Insufficient balance.");
        _;
    }

    function deposit(uint accountId) external payable isAccountOwner(accountId) {
        accounts[accountId].balance += msg.value;
        emit Deposit(msg.sender, accountId, msg.value, block.timestamp);
    }

    function createAccount(address[] calldata otherOwners) external validOwners(otherOwners) {
        address[] memory owners = new address[](otherOwners.length + 1);
        owners[otherOwners.length] = msg.sender;

        uint id = nextAccountId;

        for (uint i; i < owners.length; i++) {
            if (i < owners.length - 1) {
                owners[i] = otherOwners[i];
            }

            if (userAccounts[owners[i]].length >= 3) {
                revert("User can have a maximum of 3 accounts.");
            }
            userAccounts[owners[i]].push(id);
        }

        accounts[id].owners = owners;
        nextAccountId++;
        emit AccountCreated(owners, id, block.timestamp);
    }

    function requestWithdrawl(uint accountId, uint amount) external isAccountOwner(accountId) sufficientBalance(accountId, amount) {
        uint id = nextWithdrawId;
        WithdrawRequest storage request = accounts[accountId].withdrawRequest[id];
        request.user = msg.sender;
        request.amount = amount;
        nextWithdrawId++;
        emit WithdrawRequested(msg.sender, accountId, id, amount, block.timestamp);
    }

    function approveWithdrawl(uint accountId, uint withdrawId) external isAccountOwner(accountId) {
        WithdrawRequest storage request = accounts[accountId].withdrawRequest[withdrawId];
        request.approvals++;
        request.ownersApproved[msg.sender] = true;

        if (request.approvals == accounts[accountId].owners.length - 1) {
            request.approved = true;
        }
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
