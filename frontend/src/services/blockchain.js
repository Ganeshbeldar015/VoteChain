import { ethers } from 'ethers';

// Contract Address (Replace with deployed address)
export const CONTRACT_ADDRESS = (import.meta.env.VITE_CONTRACT_ADDRESS || "0xYourDeployedContractAddressHere").replace(/['"]/g, '').trim();

window.ethers = ethers;
window.CONTRACT_ADDRESS = CONTRACT_ADDRESS;

// Contract ABI including custom errors
export const CONTRACT_ABI = [
  // Custom Errors
  "error VoteChain__InvalidTime()",
  "error VoteChain__ElectionNotExists()",
  "error VoteChain__ElectionNotActive()",
  "error VoteChain__ElectionAlreadyActive()",
  "error VoteChain__ElectionEnded()",
  "error VoteChain__EmptyString()",
  "error VoteChain__CandidateNotExists()",
  "error VoteChain__VoterAlreadyRegistered()",
  "error VoteChain__VoterNotRegistered()",
  "error VoteChain__AlreadyVoted()",
  "error AccessControlUnauthorizedAccount(address account, bytes32 neededRole)",

  // Functions
  "function createElection(string title, string description, uint256 startTime, uint256 endTime) external returns (uint256)",
  "function addCandidate(uint256 electionId, string name, string party, string imageUrl) external",
  "function registerVoter(uint256 electionId, address voter) external",
  "function startElection(uint256 electionId) external",
  "function endElection(uint256 electionId) external",
  "function vote(uint256 electionId, uint256 candidateId) external",
  "function getCandidateVotes(uint256 electionId, uint256 candidateId) external view returns (uint256)",
  "function getAllCandidates(uint256 electionId) external view returns (tuple(uint256 id, string name, string party, string imageUrl, uint256 voteCount, bool exists)[])",
  "function getWinner(uint256 electionId) external view returns (tuple(uint256 id, string name, string party, string imageUrl, uint256 voteCount, bool exists))",
  "function getElectionDetails(uint256 electionId) external view returns (tuple(uint256 id, string title, string description, uint256 startTime, uint256 endTime, uint8 status, uint256 totalVotes, uint256[] candidateIds))",
  "function isRegisteredVoter(uint256 electionId, address voterAddress) external view returns (bool)",
  "function hasVoted(uint256 electionId, address voterAddress) external view returns (bool)",
  "function totalVotes(uint256 electionId) external view returns (uint256)",
  "function totalCandidates(uint256 electionId) external view returns (uint256)",
  "function hasRole(bytes32 role, address account) external view returns (bool)"
];

/**
 * Parses Ethereum contract transaction errors to provide human-readable feedback.
 */
export const parseError = (error) => {
  // Check if action was rejected by the user
  if (
    error.code === 'ACTION_REJECTED' || 
    error.message?.includes('rejected') || 
    error.message?.includes('User denied')
  ) {
    return 'Transaction rejected by user';
  }

  // Look for contract custom error details decoded by Ethers
  if (error.code === 'CALL_EXCEPTION' || error.revert) {
    const errorName = error.revert?.name || error.errorName;
    if (errorName) {
      switch (errorName) {
        case 'VoteChain__InvalidTime':
          return 'Invalid time: Start time must be in the future, and end time must be after start time.';
        case 'VoteChain__ElectionNotExists':
          return 'Election does not exist.';
        case 'VoteChain__ElectionNotActive':
          return 'Election is not currently active.';
        case 'VoteChain__ElectionAlreadyActive':
          return 'Election is already active.';
        case 'VoteChain__ElectionEnded':
          return 'Election has already ended.';
        case 'VoteChain__EmptyString':
          return 'Required field cannot be empty.';
        case 'VoteChain__CandidateNotExists':
          return 'Candidate does not exist.';
        case 'VoteChain__VoterAlreadyRegistered':
          return 'Voter is already registered for this election.';
        case 'VoteChain__VoterNotRegistered':
          return 'You are not registered to vote in this election.';
        case 'VoteChain__AlreadyVoted':
          return 'You have already cast your vote in this election.';
        case 'AccessControlUnauthorizedAccount':
          return 'Unauthorized: Connected wallet does not have permission to perform this action.';
        default:
          return `Contract error: ${errorName}`;
      }
    }

    // Fallback: Check raw hex selector signatures if ABI decoding failed
    const data = error.data || error.error?.data;
    if (data && typeof data === 'string') {
      if (data.includes('0x6fc9cba1')) return 'Invalid time: Start time must be in the future, and end time must be after start time.';
      if (data.includes('0x9b22d9cb')) return 'Election does not exist.';
      if (data.includes('0x3ccd0d5c')) return 'Election is not currently active.';
      if (data.includes('0x70c307ee')) return 'Election is already active.';
      if (data.includes('0xac069831')) return 'Election has already ended.';
      if (data.includes('0xf34548e0')) return 'Required field cannot be empty.';
      if (data.includes('0xff65b59a')) return 'Candidate does not exist.';
      if (data.includes('0xab91d364')) return 'Voter is already registered for this election.';
      if (data.includes('0xf79b2524')) return 'You are not registered to vote in this election.';
      if (data.includes('0xc6167230')) return 'You have already cast your vote in this election.';
      if (data.includes('0xe2517d3f')) return 'Unauthorized: Connected wallet does not have permission to perform this action.';
    }
  }

  return error.reason || error.message || 'An unknown blockchain error occurred';
};


export const getProvider = () => {
  if (window.ethereum) {
    return new ethers.BrowserProvider(window.ethereum);
  }
  return null;
};

export const getSigner = async () => {
  const provider = getProvider();
  if (provider) {
    return await provider.getSigner();
  }
  return null;
};

export const getContract = async (withSigner = false) => {
  const provider = getProvider();
  if (!provider) throw new Error("No provider found");
  
  if (withSigner) {
    const signer = await getSigner();
    return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
  }
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
};

export const connectWallet = async () => {
  if (window.ethereum) {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    return accounts[0];
  }
  throw new Error("MetaMask not installed");
};

export const getElection = async (electionId) => {
  try {
    const contract = await getContract();
    const details = await contract.getElectionDetails(electionId);
    return {
      id: Number(details.id),
      title: details.title,
      description: details.description,
      startTime: Number(details.startTime),
      endTime: Number(details.endTime),
      status: Number(details.status), // 0: NotStarted, 1: Active, 2: Ended
      totalVotes: Number(details.totalVotes),
      candidateIds: details.candidateIds.map(cid => Number(cid))
    };
  } catch (error) {
    console.error("Error fetching election details", error);
    return null;
  }
};

export const castVote = async (electionId, candidateId) => {
  try {
    const contract = await getContract(true);
    const tx = await contract.vote(electionId, candidateId);
    await tx.wait(); // Wait for transaction to be mined
    return tx.hash;
  } catch (error) {
    console.error("Error casting vote", error);
    throw new Error(parseError(error));
  }
};

export const getResults = async (electionId) => {
  try {
    const contract = await getContract();
    const candidates = await contract.getAllCandidates(electionId);
    return candidates.map(c => ({
      id: Number(c.id),
      name: c.name,
      party: c.party,
      imageUrl: c.imageUrl,
      votes: Number(c.voteCount)
    }));
  } catch (error) {
    console.error("Error fetching results", error);
    return [];
  }
};

export const createElection = async (title, description, startTime, endTime) => {
  try {
    const contract = await getContract(true);
    const tx = await contract.createElection(title, description, startTime, endTime);
    await tx.wait();
    return tx.hash;
  } catch (error) {
    console.error("Error creating election", error);
    throw new Error(parseError(error));
  }
};

export const addCandidate = async (electionId, name, party, imageUrl) => {
  try {
    const contract = await getContract(true);
    const tx = await contract.addCandidate(electionId, name, party, imageUrl);
    await tx.wait();
    return tx.hash;
  } catch (error) {
    console.error("Error adding candidate", error);
    throw new Error(parseError(error));
  }
};

export const registerVoter = async (electionId, voterAddress) => {
  try {
    const contract = await getContract(true);
    const tx = await contract.registerVoter(electionId, voterAddress);
    await tx.wait();
    return tx.hash;
  } catch (error) {
    console.error("Error registering voter", error);
    throw new Error(parseError(error));
  }
};

export const startElection = async (electionId) => {
  try {
    const contract = await getContract(true);
    const tx = await contract.startElection(electionId);
    await tx.wait();
    return tx.hash;
  } catch (error) {
    console.error("Error starting election", error);
    throw new Error(parseError(error));
  }
};

export const endElection = async (electionId) => {
  try {
    const contract = await getContract(true);
    const tx = await contract.endElection(electionId);
    await tx.wait();
    return tx.hash;
  } catch (error) {
    console.error("Error ending election", error);
    throw new Error(parseError(error));
  }
};

export const getAllElections = async () => {
  try {
    const provider = getProvider();
    if (!provider) return [];

    const code = await provider.getCode(CONTRACT_ADDRESS);
    if (code === "0x" || code === "0x0" || !code) {
      console.warn("WARNING: The contract does not exist on the network MetaMask is currently connected to!");
      return [];
    }

    const contract = await getContract();
    const elections = [];
    let id = 1;
    while (true) {
      const details = await contract.getElectionDetails(id);
      if (Number(details.id) === 0) {
        break;
      }
      elections.push({
        id: Number(details.id),
        title: details.title,
        description: details.description,
        startTime: Number(details.startTime),
        endTime: Number(details.endTime),
        status: Number(details.status), // 0: NotStarted, 1: Active, 2: Ended
        totalVotes: Number(details.totalVotes),
        candidateIds: details.candidateIds.map(cid => Number(cid))
      });
      id++;
    }
    return elections;
  } catch (error) {
    console.error("Error fetching all elections", error);
    return [];
  }
};

export const checkIsAdmin = async (account) => {
  try {
    if (!account) return false;
    const provider = getProvider();
    if (!provider) throw new Error("No provider found");

    const code = await provider.getCode(CONTRACT_ADDRESS);
    if (code === "0x" || code === "0x0" || !code) {
      console.warn("WARNING: The contract does not exist on the network MetaMask is currently connected to!");
      return false;
    }

    const contract = await getContract();
    const role = ethers.keccak256(ethers.toUtf8Bytes("ELECTION_MANAGER_ROLE"));
    const hasRole = await contract.hasRole(role, account);
    return hasRole;
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
};
