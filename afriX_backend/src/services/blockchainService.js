// src/services/blockchainService.js
const { ethers } = require("ethers");
const {
  TREASURY_ADDRESS,
  POLYGON_RPC,
  USDT_CONTRACT,
} = require("../config/treasury");

const USDT_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
];

const blockchainService = {
  /**
   * Verify USDT deposit to platform treasury
   * Checks blockchain for transaction from agent
   */
  async verifyDeposit(txHash, expectedAmount) {
    const provider = new ethers.JsonRpcProvider(POLYGON_RPC);
    const usdtContract = new ethers.Contract(USDT_CONTRACT, USDT_ABI, provider);

    try {
      // Validate txHash format
      if (!txHash || typeof txHash !== 'string') {
        throw new Error("Transaction hash is required");
      }

      // Remove 0x prefix for length check
      const cleanHash = txHash.startsWith('0x') ? txHash.slice(2) : txHash;

      // Transaction hashes are 64 hex characters (32 bytes)
      // Wallet addresses are 40 hex characters (20 bytes)
      if (cleanHash.length !== 64) {
        if (cleanHash.length === 40) {
          throw new Error("Invalid input: You entered a wallet address. Please enter the transaction hash from your USDT transfer.");
        }
        throw new Error(`Invalid transaction hash format. Expected 66 characters (0x + 64 hex), got ${txHash.length}`);
      }

      // Validate that it contains only hexadecimal characters
      if (!/^[0-9a-fA-F]{64}$/.test(cleanHash)) {
        throw new Error("Invalid transaction hash: Must contain only hexadecimal characters (0-9, a-f)");
      }

      // Get transaction receipt
      const receipt = await provider.getTransactionReceipt(txHash);

      if (!receipt) {
        throw new Error("Transaction not found or not confirmed");
      }

      if (!receipt.status) {
        throw new Error("Transaction failed on blockchain");
      }

      // Parse Transfer event logs
      const iface = new ethers.Interface(USDT_ABI);
      let transferEvent = null;

      for (const log of receipt.logs) {
        try {
          const parsed = iface.parseLog(log);
          if (
            parsed.name === "Transfer" &&
            parsed.args.to.toLowerCase() === TREASURY_ADDRESS.toLowerCase()
          ) {
            transferEvent = parsed;
            break;
          }
        } catch (e) {
          continue;
        }
      }

      if (!transferEvent) {
        throw new Error("No USDT transfer to treasury found in transaction");
      }

      // USDT has 6 decimals on Polygon
      const actualAmount = parseFloat(
        ethers.formatUnits(transferEvent.args.value, 6)
      );
      const expected = parseFloat(expectedAmount);

      // Allow 0.1% variance for decimals
      if (Math.abs(actualAmount - expected) > expected * 0.001) {
        throw new Error(
          `Amount mismatch: expected ${expected} USDT, got ${actualAmount} USDT`
        );
      }

      return {
        verified: true,
        amount: actualAmount,
        from: transferEvent.args.from,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
      };
    } catch (error) {
      // Throw the error message directly without adding prefix
      throw new Error(error.message);
    }
  },

  /**
   * Get treasury balance
   */
  async getTreasuryBalance() {
    const provider = new ethers.JsonRpcProvider(POLYGON_RPC);
    const usdtContract = new ethers.Contract(USDT_CONTRACT, USDT_ABI, provider);

    const balance = await usdtContract.balanceOf(TREASURY_ADDRESS);
    return parseFloat(ethers.formatUnits(balance, 6));
  },

  /**
   * Monitor pending deposits (for admin dashboard)
   */
  async getRecentDeposits(fromBlock = "latest", toBlock = "latest") {
    const provider = new ethers.JsonRpcProvider(POLYGON_RPC);
    const usdtContract = new ethers.Contract(USDT_CONTRACT, USDT_ABI, provider);

    const filter = usdtContract.filters.Transfer(null, TREASURY_ADDRESS);
    const events = await usdtContract.queryFilter(filter, fromBlock, toBlock);

    return events.map((event) => ({
      from: event.args.from,
      amount: parseFloat(ethers.formatUnits(event.args.value, 6)),
      txHash: event.transactionHash,
      blockNumber: event.blockNumber,
    }));
  },
};

module.exports = blockchainService;
