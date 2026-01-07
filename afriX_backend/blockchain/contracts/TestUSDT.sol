// afriX_backend/src/contracts/TestUSDT.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title TestUSDT
 * @dev A simple ERC20 token for testnet usage.
 * - Decimals = 6 (like real USDT)
 * - Owner can mint unlimited tokens for testing.
 */

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// This version will compile instantly on Remix without needing local files.
// import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.0.2/contracts/token/ERC20/ERC20.sol";
// import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.0.2/contracts/access/Ownable.sol";

contract TestUSDT is ERC20, Ownable {
    constructor() ERC20("Test USDT", "tUSDT") Ownable(msg.sender) {
        // Mint 1,000 tUSDT to deployer at start (for convenience)
        _mint(msg.sender, 1000 * 10 ** decimals());
    }

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    /// @notice Mint tokens to any address (testing only)
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
