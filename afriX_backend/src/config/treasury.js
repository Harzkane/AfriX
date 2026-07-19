// src/config/treasury.js
const rawAddress = process.env.TREASURY_WALLET_ADDRESS;
const fallbackAddress = "0x7c26C161F7b3b1b975489DA1a1672a9D9178a16e";

// Fail-safe check for placeholder or missing env variable
const treasuryAddress = (!rawAddress || 
  rawAddress.trim() === "" || 
  rawAddress.toLowerCase().includes("your") || 
  !rawAddress.startsWith("0x")) 
  ? fallbackAddress 
  : rawAddress.trim();

const rawRpc = process.env.POLYGON_RPC_URL;
const fallbackRpc = "https://polygon-amoy.drpc.org";
const polygonRpc = (!rawRpc || 
  rawRpc.trim() === "" || 
  rawRpc.includes("rpc-amoy.polygon.technology"))
  ? fallbackRpc
  : rawRpc.trim();

module.exports = {
  TREASURY_ADDRESS: treasuryAddress,
  POLYGON_RPC: polygonRpc,
  USDT_CONTRACT: "0x7c26C161F7b3b1b975489DA1a1672a9D9178a16e", // Amoy Testnet USDT
};
