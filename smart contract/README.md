# VoteChain: Smart Contracts

<p align="center">
  <img src="../frontend/src/assets/votechain_banner.png" alt="VoteChain Banner" width="100%" />
</p>

Welcome to the **VoteChain** smart contracts directory. This folder contains the Ethereum-based smart contract implementation of the decentralized e-voting system, built on **Solidity 0.8.24** using the **Hardhat** development framework and **OpenZeppelin** contract libraries.

---

## ⛓️ Smart Contract: VoteChain.sol

The core smart contract logic is defined in [contracts/VoteChain.sol](file:///d:/WorkSpace/Project/E%20voting%20sytem/smart%20contract/contracts/VoteChain.sol). It handles the complete lifecycle of multiple elections, candidate registrations, voter whitelisting, and ballot casting.

### 🌟 Key Design Features

1. **Gas-Optimized Custom Errors**: Replaces expensive string reverts with custom errors (e.g. `VoteChain__AlreadyVoted()`), saving significant gas during deployment and transaction execution.
2. **Access Control**: Implements OpenZeppelin's `AccessControl` for role-based governance. It separates administrative roles into:
   * `DEFAULT_ADMIN_ROLE` (Super admin)
   * `ELECTION_MANAGER_ROLE` (Admins who manage elections, candidates, and voters)
3. **Pausable Pattern**: Integrates OpenZeppelin's `Pausable` to allow administrators to freeze voting functions in case of emergency.
4. **Independent Elections**: Supports creating and running multiple independent elections concurrently, each with its own list of candidates, eligible voters, start/end bounds, and status.

---

## 🛠️ Hardhat Project Structure

*   **[contracts/VoteChain.sol](file:///d:/WorkSpace/Project/E%20voting%20sytem/smart%20contract/contracts/VoteChain.sol):** The main Solidity contract.
*   **[scripts/deploy.js](file:///d:/WorkSpace/Project/E%20voting%20sytem/smart%20contract/scripts/deploy.js):** Hardhat deployment script.
*   **[test/VoteChain.test.js](file:///d:/WorkSpace/Project/E%20voting%20sytem/smart%20contract/test/VoteChain.test.js):** Full test suite with assertions for roles, voting logic, election boundaries, pauses, and custom errors.
*   **[hardhat.config.js](file:///d:/WorkSpace/Project/E%20voting%20sytem/smart%20contract/hardhat.config.js):** Configuration containing compiler optimization settings (200 runs) and network definitions (`sepolia`, `baseSepolia`, `localhost`).

---

## ⚙️ Setup & Execution Instructions

### 1. Configure Environment Variables
Duplicate `.env.example` to `.env`:
```powershell
cp .env.example .env
```
Open `.env` and fill in the required variables (only required if deploying to Sepolia / Base Sepolia):
```env
ALCHEMY_API_URL="https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY"
PRIVATE_KEY="YOUR_WALLET_PRIVATE_KEY"
ETHERSCAN_API_KEY="YOUR_ETHERSCAN_API_KEY"
```

### 2. Install Dependencies
Restore the required development packages:
```powershell
npm install
```

### 3. Compile Contracts
Compile Solidity source files and generate compiled artifacts (ABI and Bytecode):
```powershell
npx hardhat compile
```

### 4. Run Test Suite
Run the test scripts and verify that all test assertions pass:
```powershell
npx hardhat test
```

### 5. Local Node Deployment
To test smart contracts locally with MetaMask:
```powershell
# Start local EVM network node (provides 20 pre-funded test accounts)
npx hardhat node

# Deploy contracts to the local localhost network (in a new terminal)
npx hardhat run scripts/deploy.js --network localhost
```

### 6. Testnet Deployment
To deploy to Sepolia or Base Sepolia:
```powershell
npx hardhat run scripts/deploy.js --network sepolia
npx hardhat run scripts/deploy.js --network baseSepolia
```
