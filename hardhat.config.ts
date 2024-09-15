import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-chai-matchers";
import "hardhat-abi-exporter";
import "solidity-coverage";
import "hardhat-contract-sizer";
import "hardhat-gas-reporter";
import "@nomicfoundation/hardhat-verify";
import '@openzeppelin/hardhat-upgrades';

import dotenv from "dotenv";
dotenv.config();

const config: HardhatUserConfig = {
  networks: {
    mainnet: {
      chainId: 1,
      url: `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: [process.env.WALLET_PK || ""],
    },
    polygon: {
      chainId: 137,
      url: `https://polygon-mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: [process.env.WALLET_PK || ""],
    },
    base: {
      chainId: 8453,
      url: `https://mainnet.base.org/`,
      accounts: [process.env.WALLET_PK || ""],
    },
    avalanche: {
      chainId: 43114,
      url: `https://api.avax.network/ext/bc/C/rpc`,
      accounts: [process.env.WALLET_PK || ""],
    },
    hardhat: {
      forking: {
        url: `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
        blockNumber: 19093800,
      },
      accounts: {
        count: 150,
      },
    },
  },
  etherscan: {
    apiKey: {
      mainnet: process.env.ETHERSCAN_API_KEY || "",
      polygon: process.env.POLYGONSCAN_API_KEY || "",
      base: process.env.BASESCAN_API_KEY || "",
      avalanche: process.env.SNOWTRACE_API_KEY || "",
    },
    customChains: [
      {
        network: "avalanche",
        chainId: 43114,
        urls: {
          apiURL:
            "https://api.routescan.io/v2/network/mainnet/evm/43114/etherscan",
          browserURL: "https://snowtrace.io",
        },
      },
    ],
  },
  solidity: {
    version: "0.8.21",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  gasReporter: {
    enabled: true,
  },
};

export default config;
