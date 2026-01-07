// blockchain/hardhat.config.cjs

// require("dotenv").config();
// require("@nomicfoundation/hardhat-toolbox");

// const {
//   PRIVATE_KEY,
//   POLYGON_RPC_URL,
//   POLYGON_MAINNET_RPC_URL,
//   POLYGON_AMOY_RPC_URL,
// } = process.env;

// module.exports = {
//   solidity: "0.8.20",
//   networks: {
//     amoy: {
//       url: POLYGON_AMOY_RPC_URL || POLYGON_RPC_URL,
//       accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
//       chainId: 80002,
//     },
//     polygon: {
//       url: POLYGON_MAINNET_RPC_URL,
//       accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
//       chainId: 137,
//     },
//   },
// };

// hardhat.config.js
require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");

const {
  PRIVATE_KEY,
  AGENT_PRIVATE_KEY,
  POLYGON_RPC_URL,
  POLYGON_MAINNET_RPC_URL,
  POLYGON_AMOY_RPC_URL,
} = process.env;

module.exports = {
  solidity: "0.8.20",
  networks: {
    amoy: {
      url: POLYGON_AMOY_RPC_URL || POLYGON_RPC_URL,
      accounts: [
        PRIVATE_KEY, // Account 0: Treasury/Platform
        ...(AGENT_PRIVATE_KEY ? [AGENT_PRIVATE_KEY] : []), // Account 1: Agent (optional)
      ].filter(Boolean),
      chainId: 80002,
    },
    polygon: {
      url: POLYGON_MAINNET_RPC_URL,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 137,
    },
  },
};
