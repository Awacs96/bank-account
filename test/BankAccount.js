const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

describe("BankAccount", function () {
  async function deployBankAccount() {

    // Get whatever can sign the transactions, returns accounts that can sign a tx
    const [addr0, addr1, addr2, addr3, addr4] = await ethers.getSigners();

    const BankAccount = await ethers.getContractFactory("BankAccount");
    const bankAccount = await BankAccount.deploy();

    return { bankAccount, addr0, addr1, addr2, addr3, addr4 };
  }

  async function deployBankAccountWithAccounts(owners=1, deposit=0, withdrawlAmounts=[]) {
    const { bankAccount, addr0, addr1, addr2, addr3, addr4 } = await loadFixture(deployBankAccount);
    let addresses = [];

    if (owners == 2) {
      addresses = [addr1];
    } else if (owners == 3) {
      addresses = [addr1, addr2];
    } else if (owners == 4) {
      addresses = [addr1, addr2, addr3];
    }

    await bankAccount.connect(addr0).createAccount(addresses);

    if (deposit > 0) {
      await bankAccount.connect(addr0).deposit(0, { value: deposit.toString() });
    }

    for (const withdrawlAmount of withdrawlAmounts) {
      await bankAccount.connect(addr0).requestWithdrawl(0, withdrawlAmount);
    }

    return { bankAccount, addr0, addr1, addr2, addr3 };
  }

  describe("Deployment", () => {
    it("Should deploy without error", async () => {
      await loadFixture(deployBankAccount);
    });
  });

  describe("Creating an account", () => {
    it("Should allow creating a single user account", async () => {
      const { bankAccount, addr0 } = await loadFixture(deployBankAccount);
      await bankAccount.connect(addr0).createAccount([]);
      const accounts = await bankAccount.connect(addr0).getAccounts();
      expect(accounts.length).to.equal(1);
    });

    it("Should allow creating a double user account", async () => {
      const { bankAccount, addr0, addr1 } = await loadFixture(deployBankAccount);
      await bankAccount.connect(addr0).createAccount([addr1]);
      const accounts1 = await bankAccount.connect(addr0).getAccounts();
      expect(accounts1.length).to.equal(1);

      const accounts2 = await bankAccount.connect(addr1).getAccounts();
      expect(accounts2.length).to.equal(1);
    });

    it("Should allow creating a triple user account", async () => {
      const { bankAccount, addr0, addr1, addr2 } = await loadFixture(deployBankAccount);
      await bankAccount.connect(addr0).createAccount([addr1, addr2]);
      const accounts1 = await bankAccount.connect(addr0).getAccounts();
      expect(accounts1.length).to.equal(1);

      const accounts2 = await bankAccount.connect(addr1).getAccounts();
      expect(accounts2.length).to.equal(1);

      const accounts3 = await bankAccount.connect(addr2).getAccounts();
      expect(accounts3.length).to.equal(1);
    });

    it("Should allow creating a four-user account", async () => {
      const { bankAccount, addr0, addr1, addr2, addr3 } = await loadFixture(deployBankAccount);
      await bankAccount.connect(addr0).createAccount([addr1, addr2, addr3]);
      const accounts1 = await bankAccount.connect(addr0).getAccounts();
      expect(accounts1.length).to.equal(1);

      const accounts2 = await bankAccount.connect(addr1).getAccounts();
      expect(accounts2.length).to.equal(1);

      const accounts3 = await bankAccount.connect(addr2).getAccounts();
      expect(accounts3.length).to.equal(1);

      const accounts4 = await bankAccount.connect(addr3).getAccounts();
      expect(accounts4.length).to.equal(1);
    });

    it("Should not allow creating account with duplicate owners", async () => {
      const { bankAccount, addr0 } = await loadFixture(deployBankAccount);
      await expect(bankAccount.connect(addr0).createAccount([addr0])).to.be.reverted;
    });

    it("Should not allow creating account with 5 owners", async () => {
      const { bankAccount, addr0, addr1, addr2, addr3, addr4 } = await loadFixture(deployBankAccount);
      await expect(bankAccount.connect(addr0).createAccount([addr0, addr1, addr2, addr3, addr4])).to.be.reverted;
    });

    it("Should not allow creating account with 5 owners", async () => {
      const { bankAccount, addr0 } = await loadFixture(deployBankAccount);

      for (let i = 0; i < 3; i++) {
        await bankAccount.connect(addr0).createAccount([]);
      }

      await expect(bankAccount.connect(addr0).createAccount([])).to.be.reverted;
    });
  });

  describe("Depositing", () => {
    it("Should allow deposit to our account from the owner", async () => {
      const { bankAccount, addr0 } = await deployBankAccountWithAccounts(1);
      await expect(bankAccount.connect(addr0).deposit(0, { value: "100" })).to.changeEtherBalances([bankAccount, addr0], ["100", "-100"]);
    });

    it("Should not allow deposit to our account from the owner", async () => {
      const { bankAccount, addr1 } = await deployBankAccountWithAccounts(1);
      await expect(bankAccount.connect(addr1).deposit(0, { value: "100" })).to.be.reverted;
    });
  });

  describe("Withdrawal", () => {
    describe("Request a withdrawal", () => {
      it("Account owner can request a withdraw", async () => {
        const { bankAccount, addr0 } = await deployBankAccountWithAccounts(1, 100);
        await bankAccount.connect(addr0).requestWithdrawl(0, 100);
      });

      it("Account owner can not request a withdraw with invalid amount", async () => {
        const { bankAccount, addr0 } = await deployBankAccountWithAccounts(1, 100);
        await expect(bankAccount.connect(addr0).requestWithdrawl(0, 101)).to.be.reverted;
      });

      it("Non-account owner can not request a withdraw", async () => {
        const { bankAccount, addr1 } = await deployBankAccountWithAccounts(1, 100);
        await expect(bankAccount.connect(addr1).requestWithdrawl(0, 90)).to.be.reverted;
      });

      it("Account owner can request a withdraw multiple times", async () => {
        const { bankAccount, addr0 } = await deployBankAccountWithAccounts(1, 100);
        await bankAccount.connect(addr0).requestWithdrawl(0, 20);
        await bankAccount.connect(addr0).requestWithdrawl(0, 80);
      });
    });

    describe("Approve a withdrawal", () => {
      it("Should allow account owner to approve withdrawl", async () => {
        const { bankAccount, addr1 } = await deployBankAccountWithAccounts(2, 100, [100]);
        await bankAccount.connect(addr1).approveWithdrawl(0, 0);
        expect(await bankAccount.getApprovals(0, 0)).to.equal(1);
      });

      it("Should not allow non-account owner to approve withdrawl", async () => {
        const { bankAccount, addr2 } = await deployBankAccountWithAccounts(2, 100, [100]);
        await expect(bankAccount.connect(addr2).approveWithdrawl(0, 0)).to.be.reverted;
      });

      it("Should not allow account owner to approve withdrawl multiple times", async () => {
        const { bankAccount, addr1 } = await deployBankAccountWithAccounts(2, 100, [100]);
        await bankAccount.connect(addr1).approveWithdrawl(0, 0);
        await expect(bankAccount.connect(addr1).approveWithdrawl(0, 0)).to.be.reverted;
      });

      it("Should not allow request creator to approve withdrawl", async () => {
        const { bankAccount, addr0 } = await deployBankAccountWithAccounts(2, 100, [100]);
        await expect(bankAccount.connect(addr0).approveWithdrawl(0, 0)).to.be.reverted;
      });
    });

    describe("Make a withdrawal", () => {
      it("Should allow request creator to withdraw approved request", async () => {
        const { bankAccount, addr0, addr1 } = await deployBankAccountWithAccounts(2, 100, [100]);
        await bankAccount.connect(addr1).approveWithdrawl(0, 0);
        await expect(bankAccount.connect(addr0).withdraw(0, 0)).to.changeEtherBalances([bankAccount, addr0], [-100, 100]);
      });

      it("Should not allow request creator to withdraw already withdrawn request", async () => {
        const { bankAccount, addr0, addr1 } = await deployBankAccountWithAccounts(2, 200, [100]);
        await bankAccount.connect(addr1).approveWithdrawl(0, 0);
        await expect(bankAccount.connect(addr0).withdraw(0, 0)).to.changeEtherBalances([bankAccount, addr0], [-100, 100]);
        await expect(bankAccount.connect(addr0).withdraw(0, 0)).to.be.reverted;
      });

      it("Should not allow non-creator of the request to withdraw", async () => {
        const { bankAccount, addr1 } = await deployBankAccountWithAccounts(2, 100, [100]);
        await bankAccount.connect(addr1).approveWithdrawl(0, 0);
        await expect(bankAccount.connect(addr1).withdraw(0, 0)).to.be.reverted;
      });

      it("Should not allow to withdraw a non-approved request", async () => {
        const { bankAccount, addr0, addr1 } = await deployBankAccountWithAccounts(2, 100, [100]);
        await expect(bankAccount.connect(addr0).withdraw(0, 0)).to.be.reverted;
      });
    });
  });
  
});
