interface NetworkConfig {
  name: string;
  ethUsdPriceFeedAddress: string;
}

export const NETWORK_CONFIG: { [key: string]: NetworkConfig } = {
  "4": {
    name: "rinkeby",
    ethUsdPriceFeedAddress: "0x8A753747A1Fa494EC906cE90E9f37563A8AF630e",
  },
  "138": {
    name: "polygon",
    ethUsdPriceFeedAddress: "0xF9680D99D6C9589e2a93a78A04A279e509205945",
  },
  // 31337
};

export const DEV_CHAINS: string[] = ["hardhat", "localhost"];

export const DECIMALS = 8;
export const INITIAL_ANSWER = 200000000;
