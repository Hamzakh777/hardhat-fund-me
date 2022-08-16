import { assert, expect } from "chai";
import { ethers, getNamedAccounts, network } from "hardhat";
import { DEV_CHAINS } from "../../helper-hardhat-config";
import { FundMe, MockV3Aggregator } from "../../typechain-types";

DEV_CHAINS.includes(network.name)
  ? describe.skip
  : describe("FundMe", async function() {
      let fundMe: FundMe;
      let mockV3Aggregator: MockV3Aggregator;
      let deployer: string;
      const SEND_VALUE = ethers.utils.parseEther("20");
      beforeEach(async () => {
        // deploy all contract
        deployer = (await getNamedAccounts()).deployer;
        fundMe = await ethers.getContract("FundMe", deployer);
      });

      describe("Contructor", async function() {
        it("Should set the aggregator address correctly", async function() {
          const address = await fundMe.getPriceFeed();
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
          });
          const amount = await fundMe.getAddressToAmountFunded(deployer);
          assert.equal(amount.toString(), SEND_VALUE.toString());
        });

        it("Should update the s_funders", async function() {
          await fundMe.fund({
            value: SEND_VALUE,
            from: deployer,
          });
          const funder = await fundMe.getFunder(0);
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
          const startDeployerBalance = await fundMe.provider.getBalance(
            deployer
          );
          // act
          const transactionResponse = await fundMe.withdraw();
          const transactionReceipt = await transactionResponse.wait(1);
          const { gasUsed, effectiveGasPrice } = transactionReceipt;
          const gasCost = gasUsed.mul(effectiveGasPrice);
          const endFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
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
          const startDeployerBalance = await fundMe.provider.getBalance(
            deployer
          );

          // act
          const transactionResponse = await fundMe.withdraw();
          const transactionReceipt = await transactionResponse.wait(1);
          const { gasUsed, effectiveGasPrice } = transactionReceipt;
          const gasCost = gasUsed.mul(effectiveGasPrice);
          const endFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const endDeployerBalance = await fundMe.provider.getBalance(deployer);

          // assert
          assert.equal(endFundMeBalance.toString(), "0");
          assert.equal(
            startFundMeBalance.add(startDeployerBalance).toString(),
            endDeployerBalance.add(gasCost).toString()
          );

          // make sure that s_funders are reset properly
          expect(await fundMe.getFunders()).to.be.reverted;
          for (let i = 0; i < signers.length; i++) {
            assert.equal(
              await (
                await fundMe.getAddressToAmountFunded(signers[i].address)
              ).toString(),
              "0"
            );
          }
        });

        it("Should only allow the owner to withdraw", async function() {
          const signers = await ethers.getSigners();
          const attacker = signers[0];
          const attackerConnectedContract = await fundMe.connect(attacker);
          expect(await attackerConnectedContract.withdraw()).to.be.revertedWith(
            "FundMe_NotOwner"
          );
        });
      });
    });
