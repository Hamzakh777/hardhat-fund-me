import { assert, expect } from "chai";
import { deployments, ethers, getNamedAccounts } from "hardhat";
import { FundMe, MockV3Aggregator } from "../../typechain-types";

describe("FundMe", async function() {
  let fundMe: FundMe;
  let mockV3Aggregator: MockV3Aggregator;
  let deployer: string;
  const SEND_VALUE = ethers.utils.parseEther("20");
  beforeEach(async () => {
    // deploy all contract
    deployer = (await getNamedAccounts()).deployer;
    await deployments.fixture("all");
    fundMe = await ethers.getContract("FundMe", deployer);
    mockV3Aggregator = await ethers.getContract("MockV3Aggregator", deployer);
  });

  describe("Contructor", async function() {
    it("Should set the aggregator address correctly", async function() {
      const address = await fundMe.s_priceFeed();
      assert.equal(address, mockV3Aggregator.address);
    });
  });

  describe("Fund", async function() {
    it("Should fail when the eth amount sent is not enough", async function() {
      const contractTransaction = fundMe.fund();
      await expect(contractTransaction).to.be.revertedWith(
        "You need to spend more ETH!"
      );
    });

    it("Should update s_addressToAmountFunded when funded", async function() {
      await fundMe.fund({
        value: SEND_VALUE,
        from: deployer,
      });
      const amount = await fundMe.s_addressToAmountFunded(deployer);
      assert.equal(amount.toString(), SEND_VALUE.toString());
    });

    it("Should update the s_funders", async function() {
      await fundMe.fund({
        value: SEND_VALUE,
        from: deployer,
      });
      const funder = await fundMe.s_funders(0);
      assert.equal(funder, deployer);
    });
  });

  describe("Withdraw", async function() {
    beforeEach(async function() {
      // funds to the contract
      await fundMe.fund({
        value: SEND_VALUE,
      });
    });

    it("Should only allow the owner to withdraw", async function() {
      // arrange
      const startFundMeBalance = await fundMe.provider.getBalance(
        fundMe.address
      );
      const startDeployerBalance = await fundMe.provider.getBalance(deployer);
      // act
      const transactionResponse = await fundMe.withdraw();
      const transactionReceipt = await transactionResponse.wait(1);
      const { gasUsed, effectiveGasPrice } = transactionReceipt;
      const gasCost = gasUsed.mul(effectiveGasPrice);
      const endFundMeBalance = await fundMe.provider.getBalance(fundMe.address);
      const endDeployerBalance = await fundMe.provider.getBalance(deployer);
      // assert
      assert.equal(endFundMeBalance.toString(), "0");
      assert.equal(
        startFundMeBalance.add(startDeployerBalance).toString(),
        endDeployerBalance.add(gasCost).toString()
      );
    });

    it("Should allow to withdraw with multiple s_funders", async function() {
      // arrange
      const signers = await ethers.getSigners();
      for (let i = 0; i < signers.length; i++) {
        const fundMeConnection = await fundMe.connect(signers[i]);
        await fundMe.fund({
          value: SEND_VALUE,
        });
      }
      const startFundMeBalance = await fundMe.provider.getBalance(
        fundMe.address
      );
      const startDeployerBalance = await fundMe.provider.getBalance(deployer);

      // act
      const transactionResponse = await fundMe.withdraw();
      const transactionReceipt = await transactionResponse.wait(1);
      const { gasUsed, effectiveGasPrice } = transactionReceipt;
      const gasCost = gasUsed.mul(effectiveGasPrice);
      const endFundMeBalance = await fundMe.provider.getBalance(fundMe.address);
      const endDeployerBalance = await fundMe.provider.getBalance(deployer);

      // assert
      assert.equal(endFundMeBalance.toString(), "0");
      assert.equal(
        startFundMeBalance.add(startDeployerBalance).toString(),
        endDeployerBalance.add(gasCost).toString()
      );

      // make sure that s_funders are reset properly
      expect(await fundMe.s_funders).to.be.reverted;
      for (let i = 0; i < signers.length; i++) {
        assert.equal(await (await fundMe.s_addressToAmountFunded(signers[i].address)).toString(), "0");
      }
    });

    it("Should only allow the owner to withdraw", async function() {
       const signers = await ethers.getSigners();
       const attacker = signers[0];
       const attackerConnectedContract = await fundMe.connect(attacker);
       expect(await attackerConnectedContract.withdraw()).to.be.revertedWith("FundMe_NotOwner");
    });
  });
});
