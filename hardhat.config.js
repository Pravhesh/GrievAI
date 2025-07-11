require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const GOERLI_RPC_URL = process.env.GOERLI_RPC_URL || "";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
  networks: {
    goerli: {
      url: GOERLI_RPC_URL,
      accounts: PRIVATE_KEY !== "0x" ? [PRIVATE_KEY] : [],
    },
  },
};
