import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DEV_CHAINS, NETWORK_CONFIG } from "../helper-hardhat-config";

const func: DeployFunction = async function(hre: HardhatRuntimeEnvironment) {
  // these are added by hardhat-deploy
  const {
    deployments: { deploy, log, get },
    getNamedAccounts,
    getChainId,
    network,
  } = hre;
  const chainId = await getChainId();
  const { deployer } = await getNamedAccounts();
  let ethUsdPriceFeedAddress;

  if (DEV_CHAINS.includes(network.name)) {
    const ethUsdAggregator = await get("MockV3Aggregator");
    ethUsdPriceFeedAddress = ethUsdAggregator.address;
  } else {
    ethUsdPriceFeedAddress = NETWORK_CONFIG[chainId].ethUsdPriceFeedAddress;
  }

  // when going for localhost or hardhat network we want to use a mock
  const fundMe = await deploy("FundMe", {
    from: deployer,
    args: [ethUsdPriceFeedAddress], // put price feed address,
    log: true,
  });
  log("--------------------------------------------------");
};

export default func;
func.tags = ["all", 'FundMe'];
