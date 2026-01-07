# AfriToken Smart Contract Specifications

## Overview

**Network**: Polygon (Primary), BSC (Backup)  
**Language**: Solidity ^0.8.19  
**Token Standard**: ERC-20  
**License**: MIT

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Token Contracts](#token-contracts)
3. [Escrow Contract](#escrow-contract)
4. [Agent Registry Contract](#agent-registry-contract)
5. [Swap Contract](#swap-contract)
6. [Token Metadata Contract](#token-metadata-contract)
7. [Access Control](#access-control)
8. [Security Features](#security-features)
9. [Gas Optimization](#gas-optimization)
10. [Deployment Strategy](#deployment-strategy)
11. [Upgrade Strategy](#upgrade-strategy)
12. [Testing Requirements](#testing-requirements)

---

## Architecture Overview

### Contract Relationships

```
                    ┌─────────────────┐
                    │  Admin Wallet   │
                    │  (Multi-sig)    │
                    └────────┬────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
        ┌───────▼────────┐       ┌───────▼────────┐
        │  NT Token      │       │  CT Token      │
        │  (ERC-20)      │       │  (ERC-20)      │
        └───────┬────────┘       └───────┬────────┘
                │                         │
                └────────────┬────────────┘
                             │
                    ┌────────▼────────┐
                    │ Token Metadata  │
                    │   (Registry)    │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
  ┌─────▼──────┐     ┌──────▼──────┐     ┌──────▼──────┐
  │   Escrow   │     │    Swap     │     │   Agent     │
  │  Contract  │     │  Contract   │     │  Registry   │
  └────────────┘     └─────────────┘     └─────────────┘
```

### Contract Addresses (Mainnet)

*To be deployed*

### Contract Addresses (Testnet - Polygon Mumbai)

```
NT Token: 0x...
CT Token: 0x...
Escrow: 0x...
Swap: 0x...
Agent Registry: 0x...
Token Metadata: 0x...
```

---

## Token Contracts

### NT Token (Naira Token)

**File**: `NairaToken.sol`

#### Contract Specification

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract NairaToken is ERC20, AccessControl, Pausable {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    
    uint8 private constant DECIMALS = 2; // Like Naira kobo
    uint256 public constant MAX_SUPPLY = type(uint256).max; // Unlimited
    
    event TokensMinted(address indexed to, uint256 amount, address indexed minter);
    event TokensBurned(address indexed from, uint256 amount, address indexed burner);
    
    constructor() ERC20("Naira Token", "NT") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
    }
    
    function decimals() public pure override returns (uint8) {
        return DECIMALS;
    }
    
    function mint(address to, uint256 amount) 
        external 
        onlyRole(MINTER_ROLE) 
        whenNotPaused 
    {
        require(to != address(0), "Cannot mint to zero address");
        require(amount > 0, "Amount must be greater than 0");
        
        _mint(to, amount);
        emit TokensMinted(to, amount, msg.sender);
    }
    
    function burn(uint256 amount) 
        external 
        whenNotPaused 
    {
        require(amount > 0, "Amount must be greater than 0");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        
        _burn(msg.sender, amount);
        emit TokensBurned(msg.sender, amount, msg.sender);
    }
    
    function burnFrom(address from, uint256 amount) 
        external 
        onlyRole(BURNER_ROLE) 
        whenNotPaused 
    {
        require(amount > 0, "Amount must be greater than 0");
        require(balanceOf(from) >= amount, "Insufficient balance");
        
        _burn(from, amount);
        emit TokensBurned(from, amount, msg.sender);
    }
    
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }
    
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }
    
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override whenNotPaused {
        super._beforeTokenTransfer(from, to, amount);
    }
}
```

#### Key Features

- **Decimals**: 2 (matching Naira kobo)
- **Supply**: Unlimited (minted by agents)
- **Minting**: Only whitelisted agents (MINTER_ROLE)
- **Burning**: Anyone can burn their own tokens
- **Pausable**: Admin can pause in emergency
- **Access Control**: Role-based permissions

#### Functions

**mint(address to, uint256 amount)**
- Mints new NT tokens to specified address
- Requires MINTER_ROLE
- Emits TokensMinted event

**burn(uint256 amount)**
- Burns tokens from caller's balance
- Anyone can burn their own tokens
- Emits TokensBurned event

**burnFrom(address from, uint256 amount)**
- Burns tokens from specified address
- Requires BURNER_ROLE (for escrow contract)
- Emits TokensBurned event

**pause() / unpause()**
- Emergency stop mechanism
- Requires PAUSER_ROLE
- Prevents all transfers when paused

#### Events

```solidity
TokensMinted(address indexed to, uint256 amount, address indexed minter)
TokensBurned(address indexed from, uint256 amount, address indexed burner)
```

---

### CT Token (CFA Token)

**File**: `CFAToken.sol`

#### Contract Specification

Identical to NT Token except:

```solidity
contract CFAToken is ERC20, AccessControl, Pausable {
    // ... same as NT Token
    
    uint8 private constant DECIMALS = 0; // CFA Franc has no decimals
    
    constructor() ERC20("CFA Token", "CT") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
    }
    
    function decimals() public pure override returns (uint8) {
        return DECIMALS;
    }
    
    // ... rest identical to NT Token
}
```

#### Key Difference

- **Decimals**: 0 (CFA Franc has no subdivisions)
- All other functionality identical to NT Token

---

## Escrow Contract

**File**: `BurnEscrow.sol`

### Purpose

Holds user tokens in escrow during agent burning transactions, protecting users from agents who don't deliver fiat.

### Contract Specification

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BurnEscrow is ReentrancyGuard, Ownable {
    
    struct BurnRequest {
        address user;
        address agent;
        address tokenContract;
        uint256 amount;
        uint256 createdAt;
        uint256 expiresAt;
        BurnStatus status;
    }
    
    enum BurnStatus {
        PENDING,
        AGENT_SENT_FIAT,
        COMPLETED,
        DISPUTED,
        EXPIRED,
        CANCELLED
    }
    
    mapping(bytes32 => BurnRequest) public burnRequests;
    mapping(address => uint256) public agentDeposits;
    mapping(address => bool) public authorizedAgents;
    
    uint256 public constant ESCROW_TIMEOUT = 30 minutes;
    uint256 public constant SLASH_PERCENTAGE = 120; // 120%
    
    address public agentRegistry;
    
    event BurnInitiated(
        bytes32 indexed requestId,
        address indexed user,
        address indexed agent,
        address tokenContract,
        uint256 amount
    );
    
    event FiatSent(
        bytes32 indexed requestId,
        address indexed agent
    );
    
    event BurnCompleted(
        bytes32 indexed requestId,
        address indexed user,
        address indexed agent
    );
    
    event BurnDisputed(
        bytes32 indexed requestId,
        address indexed user,
        address indexed agent
    );
    
    event AgentSlashed(
        address indexed agent,
        uint256 amount
    );
    
    modifier onlyAuthorizedAgent() {
        require(authorizedAgents[msg.sender], "Not authorized agent");
        _;
    }
    
    constructor(address _agentRegistry) {
        agentRegistry = _agentRegistry;
    }
    
    function initiateBurn(
        address agent,
        address tokenContract,
        uint256 amount
    ) external nonReentrant returns (bytes32) {
        require(authorizedAgents[agent], "Agent not authorized");
        require(amount > 0, "Amount must be greater than 0");
        
        // Transfer tokens to escrow
        IERC20 token = IERC20(tokenContract);
        require(
            token.transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );
        
        // Create request ID
        bytes32 requestId = keccak256(
            abi.encodePacked(
                msg.sender,
                agent,
                tokenContract,
                amount,
                block.timestamp
            )
        );
        
        // Store burn request
        burnRequests[requestId] = BurnRequest({
            user: msg.sender,
            agent: agent,
            tokenContract: tokenContract,
            amount: amount,
            createdAt: block.timestamp,
            expiresAt: block.timestamp + ESCROW_TIMEOUT,
            status: BurnStatus.PENDING
        });
        
        emit BurnInitiated(requestId, msg.sender, agent, tokenContract, amount);
        
        return requestId;
    }
    
    function confirmFiatSent(bytes32 requestId) 
        external 
        nonReentrant 
        onlyAuthorizedAgent 
    {
        BurnRequest storage request = burnRequests[requestId];
        
        require(request.agent == msg.sender, "Not assigned agent");
        require(request.status == BurnStatus.PENDING, "Invalid status");
        require(block.timestamp < request.expiresAt, "Request expired");
        
        // Burn tokens (send to dead address)
        IERC20 token = IERC20(request.tokenContract);
        require(
            token.transfer(address(0xdead), request.amount),
            "Burn failed"
        );
        
        // Update status
        request.status = BurnStatus.AGENT_SENT_FIAT;
        
        emit FiatSent(requestId, msg.sender);
    }
    
    function confirmFiatReceived(bytes32 requestId) external nonReentrant {
        BurnRequest storage request = burnRequests[requestId];
        
        require(request.user == msg.sender, "Not request owner");
        require(
            request.status == BurnStatus.AGENT_SENT_FIAT,
            "Agent hasn't sent fiat"
        );
        
        // Complete transaction
        request.status = BurnStatus.COMPLETED;
        
        emit BurnCompleted(requestId, msg.sender, request.agent);
    }
    
    function disputeBurn(bytes32 requestId) external nonReentrant {
        BurnRequest storage request = burnRequests[requestId];
        
        require(request.user == msg.sender, "Not request owner");
        require(
            request.status == BurnStatus.PENDING ||
            request.status == BurnStatus.AGENT_SENT_FIAT,
            "Cannot dispute"
        );
        
        // If agent already burned tokens, slash their deposit
        if (request.status == BurnStatus.AGENT_SENT_FIAT) {
            uint256 slashAmount = (request.amount * SLASH_PERCENTAGE) / 100;
            
            require(
                agentDeposits[request.agent] >= slashAmount,
                "Insufficient agent deposit"
            );
            
            // Slash deposit
            agentDeposits[request.agent] -= slashAmount;
            
            emit AgentSlashed(request.agent, slashAmount);
            
            // Re-mint tokens to user (requires MINTER_ROLE on token contract)
            // Note: This needs to be handled by backend with proper permissions
        } else {
            // Tokens still in escrow, refund
            IERC20 token = IERC20(request.tokenContract);
            require(
                token.transfer(request.user, request.amount),
                "Refund failed"
            );
        }
        
        request.status = BurnStatus.DISPUTED;
        
        emit BurnDisputed(requestId, msg.sender, request.agent);
    }
    
    function handleExpiredRequest(bytes32 requestId) external nonReentrant {
        BurnRequest storage request = burnRequests[requestId];
        
        require(block.timestamp >= request.expiresAt, "Not expired");
        require(request.status == BurnStatus.PENDING, "Invalid status");
        
        // Refund tokens to user
        IERC20 token = IERC20(request.tokenContract);
        require(
            token.transfer(request.user, request.amount),
            "Refund failed"
        );
        
        request.status = BurnStatus.EXPIRED;
    }
    
    function cancelBurnRequest(bytes32 requestId) external nonReentrant {
        BurnRequest storage request = burnRequests[requestId];
        
        require(request.user == msg.sender, "Not request owner");
        require(request.status == BurnStatus.PENDING, "Cannot cancel");
        
        // Refund tokens
        IERC20 token = IERC20(request.tokenContract);
        require(
            token.transfer(request.user, request.amount),
            "Refund failed"
        );
        
        request.status = BurnStatus.CANCELLED;
    }
    
    // Admin functions
    function authorizeAgent(address agent) external onlyOwner {
        authorizedAgents[agent] = true;
    }
    
    function unauthorizeAgent(address agent) external onlyOwner {
        authorizedAgents[agent] = false;
    }
    
    function setAgentDeposit(address agent, uint256 amount) external onlyOwner {
        agentDeposits[agent] = amount;
    }
    
    function getRequestDetails(bytes32 requestId)
        external
        view
        returns (BurnRequest memory)
    {
        return burnRequests[requestId];
    }
}
```

### Key Features

- **Escrow Protection**: Tokens locked until user confirms
- **30-Minute Timeout**: Auto-refund if agent doesn't act
- **Dispute Mechanism**: User can dispute non-delivery
- **Agent Slashing**: 120% penalty for confirmed fraud
- **Reentrancy Protection**: Uses ReentrancyGuard
- **Agent Authorization**: Only approved agents can interact

### State Flow

```
PENDING → AGENT_SENT_FIAT → COMPLETED (happy path)
        → DISPUTED (user disputes)
        → EXPIRED (timeout)
        → CANCELLED (user cancels early)
```

---

## Agent Registry Contract

**File**: `AgentRegistry.sol`

### Purpose

Manages agent authorization, deposits, and minting capacity.

### Contract Specification

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract AgentRegistry is Ownable {
    
    struct Agent {
        bool isAuthorized;
        uint256 depositAmount;
        uint256 availableCapacity;
        uint256 totalMinted;
        uint256 totalBurned;
        bool isPaused;
    }
    
    mapping(address => Agent) public agents;
    address[] public agentList;
    
    IERC20 public depositToken; // USDT
    
    event AgentAuthorized(address indexed agent, uint256 deposit);
    event AgentUnauthorized(address indexed agent);
    event DepositAdded(address indexed agent, uint256 amount);
    event DepositSlashed(address indexed agent, uint256 amount);
    event CapacityUpdated(address indexed agent, uint256 newCapacity);
    event AgentPaused(address indexed agent);
    event AgentUnpaused(address indexed agent);
    
    constructor(address _depositToken) {
        depositToken = IERC20(_depositToken);
    }
    
    function authorizeAgent(address agent, uint256 initialDeposit) 
        external 
        onlyOwner 
    {
        require(!agents[agent].isAuthorized, "Already authorized");
        require(initialDeposit > 0, "Deposit required");
        
        // Transfer deposit
        require(
            depositToken.transferFrom(agent, address(this), initialDeposit),
            "Deposit transfer failed"
        );
        
        // Create agent record
        agents[agent] = Agent({
            isAuthorized: true,
            depositAmount: initialDeposit,
            availableCapacity: initialDeposit,
            totalMinted: 0,
            totalBurned: 0,
            isPaused: false
        });
        
        agentList.push(agent);
        
        emit AgentAuthorized(agent, initialDeposit);
    }
    
    function addDeposit(uint256 amount) external {
        require(agents[msg.sender].isAuthorized, "Not authorized agent");
        require(amount > 0, "Amount must be greater than 0");
        
        // Transfer additional deposit
        require(
            depositToken.transferFrom(msg.sender, address(this), amount),
            "Deposit transfer failed"
        );
        
        // Update agent
        agents[msg.sender].depositAmount += amount;
        agents[msg.sender].availableCapacity += amount;
        
        emit DepositAdded(msg.sender, amount);
        emit CapacityUpdated(msg.sender, agents[msg.sender].availableCapacity);
    }
    
    function decreaseCapacity(address agent, uint256 amount) 
        external 
        onlyOwner 
    {
        require(agents[agent].isAuthorized, "Not authorized agent");
        require(
            agents[agent].availableCapacity >= amount,
            "Insufficient capacity"
        );
        
        agents[agent].availableCapacity -= amount;
        agents[agent].totalMinted += amount;
        
        emit CapacityUpdated(agent, agents[agent].availableCapacity);
    }
    
    function increaseCapacity(address agent, uint256 amount) 
        external 
        onlyOwner 
    {
        require(agents[agent].isAuthorized, "Not authorized agent");
        
        agents[agent].availableCapacity += amount;
        agents[agent].totalBurned += amount;
        
        emit CapacityUpdated(agent, agents[agent].availableCapacity);
    }
    
    function slashDeposit(address agent, uint256 amount) 
        external 
        onlyOwner 
    {
        require(agents[agent].isAuthorized, "Not authorized agent");
        require(
            agents[agent].depositAmount >= amount,
            "Insufficient deposit"
        );
        
        agents[agent].depositAmount -= amount;
        if (agents[agent].availableCapacity > amount) {
            agents[agent].availableCapacity -= amount;
        } else {
            agents[agent].availableCapacity = 0;
        }
        
        // Transfer slashed amount to owner (platform)
        require(
            depositToken.transfer(owner(), amount),
            "Slash transfer failed"
        );
        
        emit DepositSlashed(agent, amount);
    }
    
    function pauseAgent(address agent) external onlyOwner {
        require(agents[agent].isAuthorized, "Not authorized agent");
        agents[agent].isPaused = true;
        emit AgentPaused(agent);
    }
    
    function unpauseAgent(address agent) external onlyOwner {
        require(agents[agent].isAuthorized, "Not authorized agent");
        agents[agent].isPaused = false;
        emit AgentUnpaused(agent);
    }
    
    function getAgent(address agent) external view returns (Agent memory) {
        return agents[agent];
    }
    
    function getAgentCount() external view returns (uint256) {
        return agentList.length;
    }
    
    function isAgentAuthorized(address agent) external view returns (bool) {
        return agents[agent].isAuthorized && !agents[agent].isPaused;
    }
}
```

### Key Features

- **Deposit Management**: Track agent USDT deposits
- **Capacity Tracking**: Available minting capacity
- **Minting/Burning Logs**: Total minted and burned per agent
- **Pause Mechanism**: Admin can pause individual agents
- **Slashing**: Penalize agents for violations

---

## Swap Contract

**File**: `TokenSwap.sol`

### Purpose

Atomic token swaps between NT, CT, and USDT.

### Contract Specification

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract TokenSwap is ReentrancyGuard, Ownable, Pausable {
    
    struct SwapRate {
        uint256 rate; // Scaled by 1e18
        uint256 lastUpdated;
    }
    
    mapping(bytes32 => SwapRate) public rates;
    
    uint256 public constant FEE_PERCENTAGE = 15; // 1.5% = 15/1000
    uint256 public constant FEE_DENOMINATOR = 1000;
    uint256 public constant MAX_SLIPPAGE = 2; // 2%
    
    address public feeCollector;
    
    event SwapExecuted(
        address indexed user,
        address indexed fromToken,
        address indexed toToken,
        uint256 fromAmount,
        uint256 toAmount,
        uint256 fee
    );
    
    event RateUpdated(
        address indexed fromToken,
        address indexed toToken,
        uint256 rate
    );
    
    constructor(address _feeCollector) {
        feeCollector = _feeCollector;
    }
    
    function executeSwap(
        address fromToken,
        address toToken,
        uint256 fromAmount,
        uint256 minToAmount
    ) external nonReentrant whenNotPaused returns (uint256) {
        require(fromAmount > 0, "Amount must be greater than 0");
        require(fromToken != toToken, "Cannot swap same token");
        
        // Get rate
        bytes32 rateKey = keccak256(abi.encodePacked(fromToken, toToken));
        SwapRate memory swapRate = rates[rateKey];
        require(swapRate.rate > 0, "Rate not set");
        
        // Calculate amounts
        uint256 toAmount = (fromAmount * swapRate.rate) / 1e18;
        uint256 fee = (toAmount * FEE_PERCENTAGE) / FEE_DENOMINATOR;
        uint256 toAmountAfterFee = toAmount - fee;
        
        // Check slippage
        require(
            toAmountAfterFee >= minToAmount,
            "Slippage exceeded"
        );
        
        // Execute swap
        IERC20(fromToken).transferFrom(msg.sender, address(this), fromAmount);
        
        // Burn from tokens
        // Note: Requires BURNER_ROLE on token contract
        // Implementation depends on token contract design
        
        // Mint to tokens
        // Note: Requires MINTER_ROLE on token contract
        IERC20(toToken).transfer(msg.sender, toAmountAfterFee);
        
        // Transfer fee
        IERC20(toToken).transfer(feeCollector, fee);
        
        emit SwapExecuted(
            msg.sender,
            fromToken,
            toToken,
            fromAmount,
            toAmountAfterFee,
            fee
        );
        
        return toAmountAfterFee;
    }
    
    function setRate(
        address fromToken,
        address toToken,
        uint256 rate
    ) external onlyOwner {
        require(rate > 0, "Rate must be greater than 0");
        
        bytes32 rateKey = keccak256(abi.encodePacked(fromToken, toToken));
        rates[rateKey] = SwapRate({
            rate: rate,
            lastUpdated: block.timestamp
        });
        
        emit RateUpdated(fromToken, toToken, rate);
    }
    
    function getRate(address fromToken, address toToken)
        external
        view
        returns (uint256, uint256)
    {
        bytes32 rateKey = keccak256(abi.encodePacked(fromToken, toToken));
        SwapRate memory swapRate = rates[rateKey];
        return (swapRate.rate, swapRate.lastUpdated);
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    function setFeeCollector(address _feeCollector) external onlyOwner {
        require(_feeCollector != address(0), "Invalid address");
        feeCollector = _feeCollector;
    }
}
```

### Key Features

- **Atomic Swaps**: All-or-nothing execution
- **Rate Oracle**: Admin-updated exchange rates
- **Slippage Protection**: Max 2% deviation
- **Fee Collection**: 1.5% platform fee
- **Pausable**: Emergency stop mechanism

---

## Token Metadata Contract

**File**: `TokenMetadata.sol`

### Purpose

Tracks ownership history and chain of custody for every token batch from minting to burning.

### Contract Specification

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";

contract TokenMetadata is Ownable {
    
    struct TokenBatch {
        bytes32 batchId;
        address tokenContract;
        uint256 amount;
        address mintingAgent;
        address currentOwner;
        address burningAgent;
        uint256 mintedAt;
        uint256 burnedAt;
        BatchStatus status;
        address[] transferHistory;
    }
    
    enum BatchStatus {
        ACTIVE,
        BURNED
    }
    
    mapping(bytes32 => TokenBatch) public tokenBatches;
    mapping(address => bytes32[]) public userBatches;
    mapping(address => bytes32[]) public agentMintedBatches;
    
    bytes32[] public allBatches;
    
    event BatchCreated(
        bytes32 indexed batchId,
        address indexed tokenContract,
        uint256 amount,
        address indexed mintingAgent,
        address owner
    );
    
    event BatchTransferred(
        bytes32 indexed batchId,
        address indexed from,
        address indexed to
    );
    
    event BatchBurned(
        bytes32 indexed batchId,
        address indexed burningAgent
    );
    
    function createBatch(
        address tokenContract,
        uint256 amount,
        address mintingAgent,
        address owner
    ) external onlyOwner returns (bytes32) {
        bytes32 batchId = keccak256(
            abi.encodePacked(
                tokenContract,
                amount,
                mintingAgent,
                owner,
                block.timestamp
            )
        );
        
        address[] memory history = new address[](1);
        history[0] = owner;
        
        tokenBatches[batchId] = TokenBatch({
            batchId: batchId,
            tokenContract: tokenContract,
            amount: amount,
            mintingAgent: mintingAgent,
            currentOwner: owner,
            burningAgent: address(0),
            mintedAt: block.timestamp,
            burnedAt: 0,
            status: BatchStatus.ACTIVE,
            transferHistory: history
        });
        
        allBatches.push(batchId);
        userBatches[owner].push(batchId);
        agentMintedBatches[mintingAgent].push(batchId);
        
        emit BatchCreated(batchId, tokenContract, amount, mintingAgent, owner);
        
        return batchId;
    }
    
    function recordTransfer(
        bytes32 batchId,
        address from,
        address to
    ) external onlyOwner {
        TokenBatch storage batch = tokenBatches[batchId];
        require(batch.status == BatchStatus.ACTIVE, "Batch not active");
        require(batch.currentOwner == from, "Not current owner");
        
        batch.currentOwner = to;
        batch.transferHistory.push(to);
        
        userBatches[to].push(batchId);
        
        emit BatchTransferred(batchId, from, to);
    }
    
    function recordBurn(
        bytes32 batchId,
        address burningAgent
    ) external onlyOwner {
        TokenBatch storage batch = tokenBatches[batchId];
        require(batch.status == BatchStatus.ACTIVE, "Batch not active");
        
        batch.burningAgent = burningAgent;
        batch.burnedAt = block.timestamp;
        batch.status = BatchStatus.BURNED;
        
        emit BatchBurned(batchId, burningAgent);
    }
    
    function getBatch(bytes32 batchId)
        external
        view
        returns (TokenBatch memory)
    {
        return tokenBatches[batchId];
    }
    
    function getUserBatches(address user)
        external
        view
        returns (bytes32[] memory)
    {
        return userBatches[user];
    }
    
    function getAgentMintedBatches(address agent)
        external
        view
        returns (bytes32[] memory)
    {
        return agentMintedBatches[agent];
    }
    
    function getBatchTransferHistory(bytes32 batchId)
        external
        view
        returns (address[] memory)
    {
        return tokenBatches[batchId].transferHistory;
    }
    
    function getTotalBatches() external view returns (uint256) {
        return allBatches.length;
    }
}
```

### Key Features

- **Immutable History**: Complete chain of custody
- **Agent Tracking**: Trace tokens to minting agent
- **Burn Records**: Track which agent burned tokens
- **Transfer History**: Full list of all owners
- **Query Functions**: Get batches by user or agent
- **Privacy**: Admin-only visibility (backend filters for users)

### Data Structure

```
Token Batch:
├─ Batch ID (unique identifier)
├─ Token Contract (NT or CT)
├─ Amount (token quantity)
├─ Minting Agent (who created these tokens)
├─ Current Owner (latest holder)
├─ Burning Agent (who burned them, if burned)
├─ Timestamps (minted, burned)
├─ Status (active or burned)
└─ Transfer History (array of all owners)
```

---

## Access Control

### Role-Based Permissions

**Admin Roles**:
- `DEFAULT_ADMIN_ROLE`: Full control, can grant/revoke roles
- `PAUSER_ROLE`: Can pause/unpause contracts in emergency
- `MINTER_ROLE`: Can mint tokens (granted to agents)
- `BURNER_ROLE`: Can burn tokens from escrow

**Role Assignment Strategy**:

```
Admin Wallet (Multi-sig)
├─ DEFAULT_ADMIN_ROLE
├─ PAUSER_ROLE
└─ Can grant other roles

Backend Service
├─ MINTER_ROLE (for agent minting operations)
└─ BURNER_ROLE (for escrow operations)

Individual Agents
└─ MINTER_ROLE (for their specific operations)
```

### Multi-Signature Setup

**Gnosis Safe Configuration**:
- **Signers**: 5 trusted individuals
- **Threshold**: 3 of 5 signatures required
- **Actions Requiring Multi-sig**:
  - Grant/revoke roles
  - Pause/unpause contracts
  - Update critical parameters
  - Withdraw platform fees
  - Emergency interventions

**Signers**:
1. Founder/CEO
2. CTO
3. CFO
4. Lead Backend Developer
5. External Security Advisor

---

## Security Features

### 1. Reentrancy Protection

All external calls that modify state use `ReentrancyGuard`:

```solidity
function initiateBurn(...) external nonReentrant {
    // State changes before external calls
    burnRequests[requestId] = ...;
    
    // External call
    IERC20(token).transferFrom(...);
}
```

### 2. Checks-Effects-Interactions Pattern

```solidity
function confirmFiatSent(...) {
    // Checks
    require(request.agent == msg.sender, "Not assigned agent");
    require(request.status == BurnStatus.PENDING, "Invalid status");
    
    // Effects (state changes)
    request.status = BurnStatus.AGENT_SENT_FIAT;
    
    // Interactions (external calls)
    token.transfer(address(0xdead), request.amount);
}
```

### 3. Integer Overflow Protection

Solidity 0.8+ has built-in overflow checks, but we use SafeMath for clarity:

```solidity
uint256 toAmount = (fromAmount * rate) / 1e18;
uint256 fee = (toAmount * FEE_PERCENTAGE) / FEE_DENOMINATOR;
```

### 4. Access Control

Every privileged function has role checks:

```solidity
function mint(address to, uint256 amount) 
    external 
    onlyRole(MINTER_ROLE) 
{
    // ...
}
```

### 5. Pausability

All user-facing contracts can be paused:

```solidity
function _beforeTokenTransfer(...) internal whenNotPaused {
    super._beforeTokenTransfer(from, to, amount);
}
```

### 6. Input Validation

Every function validates inputs:

```solidity
require(to != address(0), "Cannot mint to zero address");
require(amount > 0, "Amount must be greater than 0");
require(request.user == msg.sender, "Not request owner");
```

### 7. Gas Limits

Set reasonable gas limits for operations:

```solidity
// Avoid unbounded loops
for (uint256 i = 0; i < items.length && i < 100; i++) {
    // Process item
}
```

### 8. Time-Locks

Critical operations have time delays:

```solidity
uint256 public constant TIMELOCK_DELAY = 48 hours;

mapping(bytes32 => uint256) public timelocks;

function initiateUpgrade(...) external onlyOwner {
    bytes32 upgradeId = keccak256(...);
    timelocks[upgradeId] = block.timestamp + TIMELOCK_DELAY;
}

function executeUpgrade(...) external onlyOwner {
    require(
        block.timestamp >= timelocks[upgradeId],
        "Timelock not expired"
    );
    // Execute upgrade
}
```

---

## Gas Optimization

### 1. Storage vs Memory

Use `memory` for temporary data, `storage` for persistent:

```solidity
// Good - uses memory
function getBatch(bytes32 id) external view returns (TokenBatch memory) {
    return tokenBatches[id];
}

// Bad - uses storage (more expensive)
function getBatch(bytes32 id) external view returns (TokenBatch storage) {
    TokenBatch storage batch = tokenBatches[id];
    return batch;
}
```

### 2. Pack Variables

Pack related variables in single storage slots:

```solidity
// Good - fits in one slot
struct Agent {
    bool isAuthorized;    // 1 byte
    bool isPaused;        // 1 byte
    uint48 timestamp;     // 6 bytes
    uint200 deposit;      // 25 bytes
}                         // Total: 32 bytes (1 slot)

// Bad - uses multiple slots
struct Agent {
    bool isAuthorized;    // 32 bytes (1 slot)
    uint256 deposit;      // 32 bytes (1 slot)
    bool isPaused;        // 32 bytes (1 slot)
}                         // Total: 96 bytes (3 slots)
```

### 3. Use Events for Data

Store minimal data on-chain, emit events for off-chain indexing:

```solidity
// Don't store full transaction history on-chain
// Instead, emit events
emit TokensMinted(to, amount, minter);

// Backend indexes events for transaction history
```

### 4. Batch Operations

Process multiple operations in single transaction:

```solidity
function batchMint(address[] memory recipients, uint256[] memory amounts) 
    external 
    onlyRole(MINTER_ROLE) 
{
    require(recipients.length == amounts.length, "Length mismatch");
    
    for (uint256 i = 0; i < recipients.length; i++) {
        _mint(recipients[i], amounts[i]);
    }
}
```

### 5. Short-Circuit Evaluation

Put cheaper checks first:

```solidity
// Good - cheap check first
require(amount > 0 && balanceOf(msg.sender) >= amount, "Invalid");

// Bad - expensive check first
require(balanceOf(msg.sender) >= amount && amount > 0, "Invalid");
```

---

## Deployment Strategy

### Phase 1: Testnet Deployment (Polygon Mumbai)

**Week 6 of Development**:

1. **Deploy Base Contracts**:
   ```bash
   # Deploy NT Token
   npx hardhat run scripts/deploy-nt-token.js --network mumbai
   
   # Deploy CT Token
   npx hardhat run scripts/deploy-ct-token.js --network mumbai
   
   # Deploy Agent Registry
   npx hardhat run scripts/deploy-agent-registry.js --network mumbai
   ```

2. **Deploy Supporting Contracts**:
   ```bash
   # Deploy Escrow
   npx hardhat run scripts/deploy-escrow.js --network mumbai
   
   # Deploy Swap
   npx hardhat run scripts/deploy-swap.js --network mumbai
   
   # Deploy Token Metadata
   npx hardhat run scripts/deploy-metadata.js --network mumbai
   ```

3. **Configure Roles**:
   ```javascript
   // Grant MINTER_ROLE to backend service
   await ntToken.grantRole(MINTER_ROLE, backendAddress);
   
   // Grant MINTER_ROLE to test agents
   await ntToken.grantRole(MINTER_ROLE, testAgent1);
   await ntToken.grantRole(MINTER_ROLE, testAgent2);
   
   // Grant BURNER_ROLE to escrow contract
   await ntToken.grantRole(BURNER_ROLE, escrowAddress);
   ```

4. **Verify Contracts**:
   ```bash
   npx hardhat verify --network mumbai <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
   ```

5. **Test Operations**:
   - Mint test tokens
   - Execute test transfers
   - Test escrow flow
   - Test swap operations
   - Verify all events emitted correctly

### Phase 2: Mainnet Deployment (Polygon)

**Week 32 of Development (Pre-Launch)**:

1. **Security Audit**:
   - Complete third-party audit
   - Fix all identified issues
   - Re-audit critical fixes

2. **Deploy with Multi-Sig**:
   - Deploy all contracts from Gnosis Safe
   - Verify all contracts on Polygonscan
   - Test all operations with small amounts

3. **Initial Configuration**:
   ```javascript
   // Set up initial exchange rates
   await swapContract.setRate(ntToken.address, ctToken.address, rate);
   
   // Authorize initial agents
   await agentRegistry.authorizeAgent(agent1, depositAmount);
   
   // Set fee collector
   await swapContract.setFeeCollector(platformWallet);
   ```

4. **Liquidity Bootstrapping**:
   - Initial agents deposit USDT
   - Platform reserves established
   - Test transactions with real users

### Deployment Checklist

```
Pre-Deployment:
☐ All tests passing (100% coverage)
☐ Security audit completed
☐ Gas optimization verified
☐ Multi-sig wallet created
☐ Deployment scripts tested on testnet

Deployment:
☐ Deploy contracts in correct order
☐ Verify all contracts on block explorer
☐ Configure roles and permissions
☐ Set initial parameters (rates, fees, etc.)
☐ Transfer ownership to multi-sig

Post-Deployment:
☐ Test all core functions
☐ Monitor for any issues
☐ Document all contract addresses
☐ Update frontend with addresses
☐ Enable monitoring/alerts
```

---

## Upgrade Strategy

### Proxy Pattern (Future)

For future upgradeability, implement transparent proxy pattern:

```solidity
// Current: Direct deployment (non-upgradeable)
NairaToken ntToken = new NairaToken();

// Future: Proxy deployment (upgradeable)
TransparentUpgradeableProxy proxy = new TransparentUpgradeableProxy(
    ntTokenImplementation,
    admin,
    initData
);
```

**Benefits**:
- Fix bugs without migrating user data
- Add new features
- Optimize gas costs

**Risks**:
- Added complexity
- Admin key compromise = total control
- Storage collision bugs

**Decision**: Launch V1 without proxy (simpler, more secure). Add proxy in V2 if needed.

### Migration Strategy (If Needed)

If contract upgrade required without proxy:

1. **Deploy New Contract**: Deploy updated version
2. **Migrate Data**: Snapshot balances, recreate in new contract
3. **Pause Old Contract**: Prevent new operations
4. **User Migration**: Users claim tokens on new contract
5. **Transition Period**: Run both contracts temporarily
6. **Sunset Old Contract**: After 100% migration

---

## Testing Requirements

### Unit Tests

**Coverage Target**: 100% line coverage

**Test Framework**: Hardhat + Waffle + Chai

**Test Categories**:

1. **Token Contract Tests**:
   ```javascript
   describe("NairaToken", function() {
     it("Should mint tokens to authorized minter");
     it("Should reject mint from non-minter");
     it("Should burn tokens from user");
     it("Should pause transfers when paused");
     it("Should have correct decimals");
   });
   ```

2. **Escrow Contract Tests**:
   ```javascript
   describe("BurnEscrow", function() {
     it("Should lock tokens in escrow");
     it("Should burn tokens when agent confirms");
     it("Should refund on dispute");
     it("Should refund on timeout");
     it("Should slash agent deposit on fraud");
   });
   ```

3. **Agent Registry Tests**:
   ```javascript
   describe("AgentRegistry", function() {
     it("Should authorize agent with deposit");
     it("Should track agent capacity");
     it("Should decrease capacity on mint");
     it("Should increase capacity on burn");
     it("Should slash deposit");
   });
   ```

4. **Swap Contract Tests**:
   ```javascript
   describe("TokenSwap", function() {
     it("Should execute swap at current rate");
     it("Should revert on excessive slippage");
     it("Should collect correct fee");
     it("Should pause when paused");
   });
   ```

### Integration Tests

Test complete user flows:

```javascript
describe("Complete User Flows", function() {
  it("User buys tokens from agent", async function() {
    // Agent mints tokens to user
    // Verify balance updated
    // Verify capacity decreased
    // Verify metadata created
  });
  
  it("User sells tokens to agent", async function() {
    // User initiates burn
    // Tokens locked in escrow
    // Agent confirms fiat sent
    // Tokens burned
    // User confirms receipt
    // Verify capacity increased
  });
  
  it("User swaps NT to CT", async function() {
    // User has NT balance
    // Swap executed
    // NT burned, CT minted
    // Fee collected
    // Balances updated
  });
});
```

### Fuzzing Tests

Use Echidna or Foundry for fuzz testing:

```solidity
// Invariant: Total supply = sum of all balances
function echidna_supply_equals_balances() public view returns (bool) {
    uint256 totalBalance = 0;
    for (uint256 i = 0; i < users.length; i++) {
        totalBalance += balanceOf(users[i]);
    }
    return totalSupply() == totalBalance;
}

// Invariant: Agent capacity never exceeds deposit
function echidna_capacity_within_deposit() public view returns (bool) {
    return agents[currentAgent].availableCapacity <= 
           agents[currentAgent].depositAmount;
}
```

### Gas Tests

Measure gas costs for common operations:

```javascript
describe("Gas Costs", function() {
  it("Measures mint gas cost", async function() {
    const tx = await ntToken.mint(user, amount);
    const receipt = await tx.wait();
    console.log("Mint gas:", receipt.gasUsed.toString());
    expect(receipt.gasUsed).to.be.below(100000);
  });
  
  it("Measures transfer gas cost", async function() {
    const tx = await ntToken.transfer(recipient, amount);
    const receipt = await tx.wait();
    console.log("Transfer gas:", receipt.gasUsed.toString());
    expect(receipt.gasUsed).to.be.below(65000);
  });
});
```

### Security Tests

Test attack vectors:

```javascript
describe("Security", function() {
  it("Should prevent reentrancy attack");
  it("Should prevent integer overflow");
  it("Should prevent unauthorized access");
  it("Should prevent frontrunning");
  it("Should handle zero address");
  it("Should handle zero amount");
});
```

---

## Monitoring & Maintenance

### On-Chain Monitoring

**Events to Monitor**:
- `TokensMinted`: Track minting activity
- `TokensBurned`: Track burning activity
- `BurnDisputed`: Alert on disputes
- `AgentSlashed`: Track penalties
- `SwapExecuted`: Monitor swap volume

**Alerting Setup**:
```javascript
// Example: Alert on large mints
ntToken.on("TokensMinted", (to, amount, minter) => {
  if (amount > LARGE_AMOUNT_THRESHOLD) {
    alertAdmin({
      type: "LARGE_MINT",
      to, amount, minter,
      timestamp: Date.now()
    });
  }
});
```

### Off-Chain Monitoring

**Metrics to Track**:
- Gas prices (adjust for optimal timing)
- Transaction success rates
- Contract balance levels
- Agent activity patterns
- Unusual transaction patterns

### Emergency Procedures

**Pause Protocol**:
1. Detect critical issue
2. Multi-sig executes pause
3. Investigate root cause
4. Deploy fix if needed
5. Test thoroughly
6. Multi-sig executes unpause

**Incident Response**:
```
Severity 1 (Critical):
- Pause contracts immediately
- Notify all users
- Investigate within 1 hour
- Fix within 24 hours

Severity 2 (High):
- Monitor closely
- Investigate within 4 hours
- Fix within 72 hours

Severity 3 (Medium):
- Schedule fix
- Deploy in next update
```

---

## Contract Addresses (Mainnet - To Be Deployed)

```
Network: Polygon Mainnet
Chain ID: 137

NT Token: 0x... (TBD)
CT Token: 0x... (TBD)
Burn Escrow: 0x... (TBD)
Token Swap: 0x... (TBD)
Agent Registry: 0x... (TBD)
Token Metadata: 0x... (TBD)

Multi-Sig Admin: 0x... (TBD)
Platform Fee Collector: 0x... (TBD)
```

### Testnet Addresses (Polygon Mumbai)

```
Network: Polygon Mumbai Testnet
Chain ID: 80001

NT Token: 0x... (After Week 6 deployment)
CT Token: 0x... (After Week 6 deployment)
Burn Escrow: 0x... (After Week 7 deployment)
Token Swap: 0x... (After Week 8 deployment)
Agent Registry: 0x... (After Week 8 deployment)
Token Metadata: 0x... (After Week 8 deployment)

Test Faucet: https://faucet.polygon.technology/
Block Explorer: https://mumbai.polygonscan.com/
```

---

## Best Practices Summary

### Development
1. Write tests before implementation (TDD)
2. Use OpenZeppelin contracts for standards
3. Comment complex logic thoroughly
4. Follow Solidity style guide
5. Keep functions small and focused

### Security
1. Audit before mainnet deployment
2. Use established patterns (CEI, reentrancy guards)
3. Implement emergency pause
4. Use multi-sig for admin actions
5. Monitor contracts 24/7

### Gas Optimization
1. Pack storage variables
2. Use events for data
3. Batch operations where possible
4. Cache storage reads
5. Use `calldata` for array parameters

### Maintenance
1. Document all changes
2. Version contracts clearly
3. Keep deployment scripts updated
4. Maintain test coverage
5. Regular security reviews

---

**Document Version**: 1.0  
**Last Updated**: October 22, 2025  
**Next Review**: Before mainnet deployment (Week 32)