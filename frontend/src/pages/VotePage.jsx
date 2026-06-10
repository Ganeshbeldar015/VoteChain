import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, CheckCircle2, Loader2, AlertCircle, ArrowRight, Lock, Wallet } from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { getResults, getElection } from '../services/blockchain';

const VotePage = () => {
  const { electionId } = useParams();
  const [searchParams] = useSearchParams();
  const candidateId = searchParams.get('candidateId');
  const navigate = useNavigate();

  const { voteForCandidate } = useWallet();

  const [status, setStatus] = useState('review'); // review, processing, success, error
  const [txHash, setTxHash] = useState(null);
  const [candidate, setCandidate] = useState(null);
  const [election, setElection] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    const loadMetadata = async () => {
      try {
        setPageLoading(true);
        const details = await getElection(Number(electionId));
        setElection(details);

        const list = await getResults(Number(electionId));
        const foundCandidate = list.find(c => c.id === Number(candidateId));
        setCandidate(foundCandidate);
      } catch (error) {
        console.error("Failed to load vote page metadata:", error);
      } finally {
        setPageLoading(false);
      }
    };

    if (candidateId) {
      loadMetadata();
    }
  }, [electionId, candidateId]);

  const handleConfirmVote = async () => {
    setStatus('processing');
    try {
      const hash = await voteForCandidate(Number(electionId), Number(candidateId));
      setTxHash(hash);
      setStatus('success');
    } catch (error) {
      console.error("Voting failed:", error);
      setErrorMessage(error.reason || error.message || "An unknown error occurred while submitting your vote.");
      setStatus('error');
    }
  };

  if (!candidateId) {
    return (
      <div className="pt-32 pb-24 container mx-auto px-6 text-center">
        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-6" />
        <h2 className="text-2xl font-bold mb-4">No Candidate Selected</h2>
        <button onClick={() => navigate(`/candidates/${electionId}`)} className="text-primary hover:underline">
          Go back to candidate list
        </button>
      </div>
    );
  }

  if (pageLoading) {
    return (
      <div className="pt-32 pb-24 container mx-auto px-6 text-center min-h-[60vh] flex flex-col justify-center items-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-6"></div>
        <p className="text-muted text-lg animate-pulse">Verifying voting details...</p>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-24 container mx-auto px-6 flex justify-center">
      <div className="max-w-2xl w-full">
        <AnimatePresence mode="wait">
          {status === 'review' && (
            <motion.div
              key="review"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass-card p-8 md:p-12 rounded-[2rem] border-white/10"
            >
              <div className="flex items-center space-x-4 mb-8">
                <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Review Your Vote</h2>
                  <p className="text-muted">Verification required before final submission</p>
                </div>
              </div>

               <div className="bg-white/5 rounded-3xl p-8 mb-8 border border-white/5">
                 <p className="text-muted text-sm uppercase tracking-widest mb-2 font-semibold">Casting Vote For</p>
                 <h3 className="text-3xl font-extrabold mb-1">{candidate?.name || 'Loading candidate...'}</h3>
                 <p className="text-primary font-bold">{candidate?.party || ''}</p>
                 
                 <div className="mt-8 pt-8 border-t border-white/5 grid grid-cols-2 gap-4">
                    <div>
                       <p className="text-xs text-muted mb-1">Election</p>
                       <p className="text-sm font-bold">{election?.title || 'Loading election...'}</p>
                    </div>
                    <div>
                       <p className="text-xs text-muted mb-1">Network</p>
                       <p className="text-sm font-bold flex items-center">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                          Sepolia / Localhost
                       </p>
                    </div>
                 </div>
              </div>

              <div className="space-y-4 mb-10">
                 <div className="flex items-start space-x-3 text-sm text-muted">
                    <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
                    <p>Wallet connected and verified</p>
                 </div>
                 <div className="flex items-start space-x-3 text-sm text-muted">
                    <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
                    <p>Voting eligibility confirmed on-chain</p>
                 </div>
              </div>

              <div className="flex flex-col md:flex-row gap-4">
                 <button 
                   onClick={() => navigate(-1)}
                   className="flex-1 py-4 rounded-2xl border border-white/10 font-bold hover:bg-white/5 transition-all"
                 >
                    Cancel
                 </button>
                 <motion.button 
                   whileHover={{ scale: 1.02 }}
                   whileTap={{ scale: 0.98 }}
                   onClick={handleConfirmVote}
                   className="flex-[2] py-4 rounded-2xl bg-primary hover:bg-secondary text-white font-bold shadow-xl shadow-primary/20 flex items-center justify-center space-x-2 transition-all"
                 >
                    <Lock className="w-4 h-4" />
                    <span>Confirm & Sign Transaction</span>
                 </motion.button>
              </div>
            </motion.div>
          )}

          {status === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card p-12 rounded-[2rem] text-center"
            >
              <div className="relative w-24 h-24 mx-auto mb-8">
                 <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
                 <motion.div 
                   animate={{ rotate: 360 }}
                   transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                   className="absolute inset-0 border-4 border-t-primary rounded-full"
                 />
                 <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-primary animate-pulse" />
                 </div>
              </div>
              <h2 className="text-3xl font-bold mb-4">Processing Vote</h2>
              <p className="text-muted max-w-sm mx-auto mb-8">
                Your vote is being encrypted and broadcast to the network. Please confirm and sign the transaction in MetaMask.
              </p>
              <div className="bg-white/5 p-4 rounded-2xl flex items-center justify-center space-x-3 text-sm font-mono text-muted">
                 <Wallet className="w-4 h-4" />
                 <span>Waiting for network confirmation...</span>
              </div>
            </motion.div>
          )}

          {status === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-12 rounded-[2rem] text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-green-500" />
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-8">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
              <h2 className="text-3xl font-bold mb-4">Vote Cast Successfully!</h2>
              <p className="text-muted mb-10 max-w-sm mx-auto">
                Thank you for participating. Your vote has been recorded on the blockchain and is now immutable.
              </p>
              
              <div className="bg-white/5 p-6 rounded-2xl mb-10 text-left border border-white/5">
                 <p className="text-xs text-muted uppercase tracking-widest mb-3 font-semibold">Transaction Details</p>
                 <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                       <span className="text-muted">Status</span>
                       <span className="text-green-400 font-bold">Confirmed</span>
                    </div>
                    <div className="flex justify-between text-sm">
                       <span className="text-muted">Transaction Hash</span>
                       <span className="text-primary font-mono truncate ml-4">{txHash ? `${txHash.substring(0, 24)}...` : 'N/A'}</span>
                    </div>
                 </div>
              </div>

              <div className="flex flex-col md:flex-row gap-4">
                 <button 
                   onClick={() => navigate('/results')}
                   className="flex-1 py-4 rounded-2xl bg-white/5 hover:bg-white/10 font-bold border border-white/10 transition-all"
                 >
                    View Results
                 </button>
                 <button 
                   onClick={() => navigate('/')}
                   className="flex-1 py-4 rounded-2xl bg-primary hover:bg-secondary text-white font-bold transition-all flex items-center justify-center space-x-2"
                 >
                    <span>Back Home</span>
                    <ArrowRight className="w-4 h-4" />
                 </button>
              </div>
            </motion.div>
          )}

          {status === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-12 rounded-[2rem] text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-red-500" />
              <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-8">
                <AlertCircle className="w-10 h-10 text-red-500" />
              </div>
              <h2 className="text-3xl font-bold mb-4 font-extrabold text-red-600">Transaction Failed</h2>
              <p className="text-muted mb-10 max-w-sm mx-auto">
                {errorMessage || "An error occurred while casting your vote. Make sure you are registered and have not already voted."}
              </p>
              <div className="flex flex-col md:flex-row gap-4">
                 <button 
                   onClick={() => navigate(-1)}
                   className="flex-1 py-4 rounded-2xl bg-white/5 hover:bg-white/10 font-bold border border-white/10 transition-all"
                 >
                    Try Again
                 </button>
                 <button 
                   onClick={() => navigate('/')}
                   className="flex-1 py-4 rounded-2xl bg-primary hover:bg-secondary text-white font-bold transition-all"
                 >
                    Back Home
                 </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default VotePage;
