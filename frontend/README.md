# VoteChain: Web3 React Frontend



Welcome to the **VoteChain** frontend. This directory contains the user interface for the decentralized e-voting system, built as a premium single-page application (SPA) using **React**, **Vite**, **Tailwind CSS**, and **Ethers.js**. It integrates directly with the Ethereum Virtual Machine (EVM) smart contract via browser extensions like **MetaMask**.

---

## 🎨 Design & Theme

The user interface features a premium, state-of-the-art design following modern high-contrast minimalist guidelines:
*   **Color Palette:** Clean light-mode design with deep charcoal, zinc, and black accents (utilizing custom CSS variables such as `--color-primary` and `.glass-card` to render premium interfaces).
*   **Typography:** Combines **Syne** (for structural, premium headings) and **Inter** (for high-legibility body text).
*   **Micro-Animations:** Sleek scale-in transitions on card hover, loading states, and dynamic charts that update live as blocks are mined.

---

## 🛠️ Tech Stack & Key Libraries

*   **Vite + React:** Fast build tool and component-based UI library.
*   **Ethers.js (v6):** Client library for interacting with EVM networks and calling smart contract functions.
*   **Tailwind CSS:** Modern utility-first CSS framework for layout styling.
*   **Lucide React:** Premium clean icon packs.

---

## 📂 Project Structure

Here is a breakdown of the key files and directories:

*   **[src/services/blockchain.js](file:///d:/WorkSpace/Project/E%20voting%20sytem/frontend/src/services/blockchain.js):** The Web3 gateway. Defines the contract ABI, initializes Ethers providers/signers, decodes smart contract custom revert errors (e.g., `VoteChain__AlreadyVoted`), and maps hex selectors to human-readable error descriptions.
*   **[src/context/WalletContext.jsx](file:///d:/WorkSpace/Project/E%20voting%20sytem/frontend/src/context/WalletContext.jsx):** React Context Provider for global state. Handles MetaMask account connection events, listens to network/chain changes (`accountsChanged`, `chainChanged`), maps user authorization checks, and exposes contract write functions.
*   **[src/pages/](file:///d:/WorkSpace/Project/E%20voting%20sytem/frontend/src/pages/):**
    *   [Home.jsx](file:///d:/WorkSpace/Project/E%20voting%20sytem/frontend/src/pages/Home.jsx): Landing dashboard displaying network details, account status, and call-to-actions.
    *   [Elections.jsx](file:///d:/WorkSpace/Project/E%20voting%20sytem/frontend/src/pages/Elections.jsx): Panel displaying current, upcoming, and past elections.
    *   [Candidates.jsx](file:///d:/WorkSpace/Project/E%20voting%20sytem/frontend/src/pages/Candidates.jsx): Directory listing candidate files, political party names, and avatars.
    *   [VotePage.jsx](file:///d:/WorkSpace/Project/E%20voting%20sytem/frontend/src/pages/VotePage.jsx): The secure voting booth that checks registration eligibility and submits choice payloads.
    *   [Results.jsx](file:///d:/WorkSpace/Project/E%20voting%20sytem/frontend/src/pages/Results.jsx): LIVE tally page rendering bar charts and automatic winner declarations.
    *   [AdminDashboard.jsx](file:///d:/WorkSpace/Project/E%20voting%20sytem/frontend/src/pages/AdminDashboard.jsx): Closed administration interface containing controls to create new elections, register candidates, whitelist voter addresses, and toggle election states (Start / End).
    *   [NotFound.jsx](file:///d:/WorkSpace/Project/E%20voting%20sytem/frontend/src/pages/NotFound.jsx): Standard 404 fallback page.
*   **[src/components/](file:///d:/WorkSpace/Project/E%20voting%20sytem/frontend/src/components/):** Reusable layout components such as `Navbar.jsx`, `CandidateCard.jsx`, and custom feedback displays.
*   **[src/index.css](file:///d:/WorkSpace/Project/E%20voting%20sytem/frontend/src/index.css):** Root stylesheet extending Tailwind, declaring global typography, theme tokens, customized scrolls, and glassmorphic card classes.

---

## ⚙️ Setup & Execution Instructions

Ensure you have installed the project-wide prerequisites before running the frontend.

### 1. Configure Environment Variables
Copy `.env.example` to `.env` inside the `frontend` folder:
```powershell
cp .env.example .env
```
Open the `.env` file and set the address of your deployed smart contract:
```env
VITE_CONTRACT_ADDRESS="0xYOUR_DEPLOYED_CONTRACT_ADDRESS"
```

### 2. Install Dependencies
Restore the required package files:
```powershell
npm install
```

### 3. Run in Development Mode
Start the local Vite HMR server:
```powershell
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your web browser. Make sure MetaMask is unlocked and connected to your local network (e.g. Hardhat local RPC `http://127.0.0.1:8545`).

### 4. Build for Production
Generate the optimized static assets inside the `dist` directory:
```powershell
npm run build
```

### 5. Lint Code
Run ESLint to check for potential bugs or code style warnings:
```powershell
npm run lint
```
