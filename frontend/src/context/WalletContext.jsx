import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  connectWallet, 
  checkIsAdmin, 
  getAllElections,
  createElection as scCreateElection,
  addCandidate as scAddCandidate,
  registerVoter as scRegisterVoter,
  startElection as scStartElection,
  endElection as scEndElection,
  castVote as scCastVote
} from '../services/blockchain';

const WalletContext = createContext();

export const WalletProvider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadBlockchainData = useCallback(async (currentAccount) => {
    try {
      setLoading(true);
      const allElections = await getAllElections();
      setElections(allElections);

      if (currentAccount) {
        const adminStatus = await checkIsAdmin(currentAccount);
        setIsAdmin(adminStatus);
      } else {
        setIsAdmin(false);
      }
    } catch (error) {
      console.error("Error loading blockchain data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const connect = async () => {
    try {
      setLoading(true);
      const connectedAcc = await connectWallet();
      setAccount(connectedAcc);
      await loadBlockchainData(connectedAcc);
      return connectedAcc;
    } catch (error) {
      console.error("Wallet connection failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const disconnect = () => {
    setAccount(null);
    setIsAdmin(false);
  };

  const reloadElections = async () => {
    const allElections = await getAllElections();
    setElections(allElections);
  };

  // Wrapper functions to auto-refresh state after transaction success
  const createNewElection = async (title, description, startTime, endTime) => {
    setLoading(true);
    try {
      const txHash = await scCreateElection(title, description, startTime, endTime);
      await reloadElections();
      return txHash;
    } finally {
      setLoading(false);
    }
  };

  const addNewCandidate = async (electionId, name, party, imageUrl) => {
    setLoading(true);
    try {
      const txHash = await scAddCandidate(electionId, name, party, imageUrl);
      await reloadElections();
      return txHash;
    } finally {
      setLoading(false);
    }
  };

  const registerNewVoter = async (electionId, voterAddress) => {
    setLoading(true);
    try {
      const txHash = await scRegisterVoter(electionId, voterAddress);
      return txHash;
    } finally {
      setLoading(false);
    }
  };

  const startExistingElection = async (electionId) => {
    setLoading(true);
    try {
      const txHash = await scStartElection(electionId);
      await reloadElections();
      return txHash;
    } finally {
      setLoading(false);
    }
  };

  const endExistingElection = async (electionId) => {
    setLoading(true);
    try {
      const txHash = await scEndElection(electionId);
      await reloadElections();
      return txHash;
    } finally {
      setLoading(false);
    }
  };

  const voteForCandidate = async (electionId, candidateId) => {
    setLoading(true);
    try {
      const txHash = await scCastVote(electionId, candidateId);
      await reloadElections();
      return txHash;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initConnection = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            await loadBlockchainData(accounts[0]);
          } else {
            await loadBlockchainData(null);
          }
        } catch (error) {
          console.error("Error checking initial wallet connection:", error);
          await loadBlockchainData(null);
        }
      } else {
        await loadBlockchainData(null);
      }
    };

    initConnection();

    // Listen to MetaMask account switches or chain changes
    if (window.ethereum) {
      const handleAccountsChanged = async (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          await loadBlockchainData(accounts[0]);
        } else {
          disconnect();
        }
      };

      const handleChainChanged = () => {
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [loadBlockchainData]);

  return (
    <WalletContext.Provider value={{
      account,
      isAdmin,
      elections,
      loading,
      connect,
      disconnect,
      createNewElection,
      addNewCandidate,
      registerNewVoter,
      startExistingElection,
      endExistingElection,
      voteForCandidate,
      reloadElections
    }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);
