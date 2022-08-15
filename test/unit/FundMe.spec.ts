import { assert, expect } from "chai";
import { deployments, ethers, getNamedAccounts } from "hardhat";
import { FundMe, MockV3Aggregator } from "../../typechain-types";

describe("FundMe", async function() {
  let fundMe: FundMe;
  let mockV3Aggregator: MockV3Aggregator;
  let deployer: string;
  beforeEach(async () => {
    // deploy all contract
    deployer = (await getNamedAccounts()).deployer;
    await deployments.fixture("all");
    fundMe = await ethers.getContract("FundMe", deployer);
    mockV3Aggregator = await ethers.getContract("MockV3Aggregator", deployer);
  });

  describe("Contructor", async function() {
    it("Should set the aggregator address correctly", async function() {
      const address = await fundMe.priceFeed();
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
  });
});
