import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DEV_CHAINS, NETWORK_CONFIG } from "../helper-hardhat-config";
import { verify } from "../utils/verify";

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
  const args = [ethUsdPriceFeedAddress];
  const fundMe = await deploy("FundMe", {
    from: deployer,
    args, // put price feed address,
    log: true,
    waitConfirmations: DEV_CHAINS.includes(network.name) ? 1 : 6
  });

  if (!DEV_CHAINS.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
    await verify(fundMe.address, args);
  }

  log("--------------------------------------------------");
};

export default func;
func.tags = ["all", "fundme"];
