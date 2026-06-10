import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import CandidateCard from '../components/CandidateCard';
import { ChevronLeft, Info, AlertTriangle } from 'lucide-react';
import { getResults, getElection } from '../services/blockchain';

const Candidates = () => {
  const { electionId } = useParams();
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [electionDetails, setElectionDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCandidatesAndElection = async () => {
      try {
        setLoading(true);
        const rawCandidates = await getResults(Number(electionId));
        setCandidates(rawCandidates.map(c => ({
          id: c.id,
          name: c.name,
          party: c.party,
          description: `Representative candidate for the ${c.party} party. Committed to transparency and accountability in governance.`,
          image: c.imageUrl
        })));
        
        const details = await getElection(Number(electionId));
        setElectionDetails(details);
      } catch (error) {
        console.error("Error loading candidate page data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCandidatesAndElection();
  }, [electionId]);

  const handleSelect = (id) => {
    setSelectedId(id);
  };

  const handleVoteClick = () => {
    if (selectedId) {
      navigate(`/vote/${electionId}?candidateId=${selectedId}`);
    }
  };

  if (loading) {
    return (
      <div className="pt-32 pb-24 container mx-auto px-6 text-center min-h-[60vh] flex flex-col justify-center items-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-6"></div>
        <p className="text-muted text-lg animate-pulse">Loading election candidates from blockchain...</p>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-24 container mx-auto px-6">
      <button 
        onClick={() => navigate('/elections')}
        className="flex items-center space-x-2 text-muted hover:text-primary transition-colors mb-8 group"
      >
        <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span>Back to Elections</span>
      </button>

      <div className="flex flex-col lg:flex-row justify-between items-start gap-12 mb-16">
        <div className="max-w-2xl">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">Meet the <span className="gradient-text">Candidates</span></h1>
          <p className="text-muted text-lg">
            Research the candidates carefully before casting your immutable vote. Each candidate has presented their vision for the <strong>{electionDetails?.title || 'Election'}</strong>.
          </p>
        </div>
        
        <div className="glass-card p-6 rounded-3xl border-primary/20 bg-primary/5 flex items-start space-x-4 max-w-sm">
           <Info className="w-6 h-6 text-primary shrink-0" />
           <p className="text-sm text-muted">
             You can only select one candidate. Your choice will be recorded permanently on the blockchain after confirmation.
           </p>
        </div>
      </div>

      {candidates.length === 0 ? (
        <div className="text-center py-12 glass-card rounded-3xl p-8 max-w-xl mx-auto border border-white/5">
          <AlertTriangle className="w-12 h-12 text-accent mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">No Candidates Found</h3>
          <p className="text-muted text-sm">No candidates have been registered for this election yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {candidates.map((candidate) => (
            <CandidateCard 
              key={candidate.id} 
              candidate={candidate} 
              isSelected={selectedId === candidate.id}
              onVote={handleSelect}
            />
          ))}
        </div>
      )}

      <div className="fixed bottom-8 left-0 w-full px-6 z-40 pointer-events-none">
         <div className="container mx-auto flex justify-center">
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ 
                opacity: selectedId ? 1 : 0, 
                y: selectedId ? 0 : 100 
              }}
              className="glass-card p-4 rounded-3xl border-primary/30 shadow-2xl shadow-primary/20 flex items-center space-x-8 pointer-events-auto"
            >
               <div className="hidden md:block">
                  <p className="text-xs text-muted">Selected Candidate</p>
                  <p className="font-bold">{candidates.find(c => c.id === selectedId)?.name}</p>
               </div>
               <motion.button
                 whileHover={{ scale: 1.02 }}
                 whileTap={{ scale: 0.98 }}
                 onClick={handleVoteClick}
                 className="bg-primary hover:bg-secondary text-white px-10 py-4 rounded-2xl font-bold shadow-lg shadow-primary/30 transition-all flex items-center space-x-2"
               >
                 <span>Proceed to Vote</span>
                 <AlertTriangle className="w-4 h-4" />
               </motion.button>
            </motion.div>
         </div>
      </div>
    </div>
  );
};

export default Candidates;
