import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import {
  DECIMALS,
  DEV_CHAINS,
  INITIAL_ANSWER,
  NETWORK_CONFIG,
} from "../helper-hardhat-config";

const func: DeployFunction = async function(hre: HardhatRuntimeEnvironment) {
  const {
    deployments: { deploy, log },
    getNamedAccounts,
    getChainId,
  } = hre;
  const { deployer } = await getNamedAccounts();

  if (DEV_CHAINS.includes(hre.network.name)) {
    log("Local network detected! Deploying mocks...");
    await deploy("MockV3Aggregator", {
      from: deployer,
      log: true,
      args: [DECIMALS, INITIAL_ANSWER],
    });
    log("Mocks deployed!");
    log("--------------------------------------------------");
  }
};

export default func;
func.tags = ["all", "mocks"];
