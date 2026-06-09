import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Vote, 
  Calendar, 
  Plus, 
  Settings, 
  Shield, 
  BarChart3, 
  Play, 
  Square,
  X,
  UserPlus,
  Link as LinkIcon
} from 'lucide-react';
import { useWallet } from '../context/WalletContext';

const AdminDashboard = () => {
  const { 
    account, 
    isAdmin, 
    elections, 
    createNewElection, 
    addNewCandidate, 
    registerNewVoter, 
    startExistingElection, 
    endExistingElection, 
    loading 
  } = useWallet();

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAddCandidateModalOpen, setIsAddCandidateModalOpen] = useState(false);

  // Form states
  const [electionForm, setElectionForm] = useState({ title: '', description: '', startTime: '', endTime: '' });
  const [candidateForm, setCandidateForm] = useState({ electionId: '', name: '', party: '', imageUrl: '' });
  const [voterForm, setVoterForm] = useState({ electionId: '', voterAddress: '' });

  // Status logs
  const [message, setMessage] = useState({ text: '', isError: false });

  const showMessage = (text, isError = false) => {
    setMessage({ text, isError });
    setTimeout(() => setMessage({ text: '', isError: false }), 5000);
  };

  const handleCreateElection = async (e) => {
    e.preventDefault();
    try {
      const startUnix = Math.floor(new Date(electionForm.startTime).getTime() / 1000);
      const endUnix = Math.floor(new Date(electionForm.endTime).getTime() / 1000);
      
      if (isNaN(startUnix) || isNaN(endUnix)) {
        showMessage("Please select valid dates", true);
        return;
      }

      await createNewElection(electionForm.title, electionForm.description, startUnix, endUnix);
      showMessage("Election created successfully!");
      setIsCreateModalOpen(false);
      setElectionForm({ title: '', description: '', startTime: '', endTime: '' });
    } catch (error) {
      console.error(error);
      showMessage(error.reason || error.message || "Failed to create election", true);
    }
  };

  const handleAddCandidate = async (e) => {
    e.preventDefault();
    try {
      if (!candidateForm.electionId) {
        showMessage("Please select an election", true);
        return;
      }
      await addNewCandidate(
        Number(candidateForm.electionId), 
        candidateForm.name, 
        candidateForm.party, 
        candidateForm.imageUrl || "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?q=80&w=200&h=200&fit=crop"
      );
      showMessage("Candidate added successfully!");
      setIsAddCandidateModalOpen(false);
      setCandidateForm({ electionId: '', name: '', party: '', imageUrl: '' });
    } catch (error) {
      console.error(error);
      showMessage(error.reason || error.message || "Failed to add candidate", true);
    }
  };

  const handleRegisterVoter = async (e) => {
    e.preventDefault();
    try {
      if (!voterForm.electionId || !voterForm.voterAddress) {
        showMessage("Please complete all voter fields", true);
        return;
      }
      await registerNewVoter(Number(voterForm.electionId), voterForm.voterAddress);
      showMessage("Voter registered successfully!");
      setVoterForm({ electionId: '', voterAddress: '' });
    } catch (error) {
      console.error(error);
      showMessage(error.reason || error.message || "Failed to register voter", true);
    }
  };

  const handleStartElection = async (electionId) => {
    try {
      await startExistingElection(electionId);
      showMessage("Election started successfully!");
    } catch (error) {
      console.error(error);
      showMessage(error.reason || error.message || "Failed to start election", true);
    }
  };

  const handleEndElection = async (electionId) => {
    try {
      await endExistingElection(electionId);
      showMessage("Election ended successfully!");
    } catch (error) {
      console.error(error);
      showMessage(error.reason || error.message || "Failed to end election", true);
    }
  };

  if (!isAdmin) {
    return (
      <div className="pt-32 pb-24 container mx-auto px-6 text-center min-h-[80vh] flex flex-col justify-center items-center">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
          <Shield className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
        <p className="text-muted mb-8 max-w-md mx-auto">
          You do not have the required `ELECTION_MANAGER_ROLE` to access this dashboard. Please connect your administrator wallet.
        </p>
      </div>
    );
  }

  // Calculate statistics
  const totalElections = elections.length;
  const activeElections = elections.filter(e => e.status === 1).length;
  const totalVotesCast = elections.reduce((sum, e) => sum + e.totalVotes, 0);

  const stats = [
    { label: 'Total Elections', value: totalElections, icon: Calendar, color: 'text-blue-400' },
    { label: 'Active Elections', value: activeElections, icon: Play, color: 'text-green-400' },
    { label: 'Total Votes Cast', value: totalVotesCast, icon: Vote, color: 'text-primary' },
    { label: 'Admin Status', value: 'Authorized', icon: Shield, color: 'text-accent' },
  ];

  return (
    <div className="pt-32 pb-24 container mx-auto px-6 min-h-screen">
      
      {/* Messages */}
      {message.text && (
        <div className={`fixed top-24 right-6 p-4 rounded-2xl shadow-2xl border backdrop-blur-md z-50 max-w-md transition-all ${
          message.isError 
            ? 'bg-red-500/15 border-red-500/30 text-red-200' 
            : 'bg-green-500/15 border-green-500/30 text-green-200'
        }`}>
          <p className="text-sm font-semibold">{message.text}</p>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">Admin <span className="gradient-text">Dashboard</span></h1>
          <p className="text-muted text-sm flex items-center">
            <Shield className="w-4 h-4 mr-2 text-primary" />
            Connected Admin: <span className="font-mono text-white/80 ml-1">{account ? `${account.substring(0, 8)}...${account.substring(account.length - 6)}` : 'N/A'}</span>
          </p>
        </div>
        <div className="flex space-x-4">
           <motion.button 
             whileHover={{ scale: 1.05 }}
             whileTap={{ scale: 0.95 }}
             onClick={() => setIsAddCandidateModalOpen(true)}
             className="bg-white/5 border border-white/10 px-6 py-3 rounded-2xl font-bold flex items-center space-x-2 text-sm"
           >
              <Plus className="w-4 h-4" />
              <span>Add Candidate</span>
           </motion.button>
           <motion.button 
             whileHover={{ scale: 1.05 }}
             whileTap={{ scale: 0.95 }}
             onClick={() => setIsCreateModalOpen(true)}
             className="bg-primary hover:bg-secondary text-white px-6 py-3 rounded-2xl font-bold flex items-center space-x-2 text-sm shadow-lg shadow-primary/20"
           >
              <Calendar className="w-4 h-4" />
              <span>Create Election</span>
           </motion.button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {stats.map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-6 rounded-3xl"
          >
            <div className={`w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-4 ${stat.color}`}>
               <stat.icon className="w-6 h-6" />
            </div>
            <p className="text-muted text-xs uppercase tracking-widest font-bold mb-1">{stat.label}</p>
            <h3 className="text-3xl font-extrabold">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Election Management */}
         <div className="lg:col-span-2 glass-card rounded-3xl overflow-hidden">
            <div className="p-8 border-b border-white/5 flex justify-between items-center">
               <h3 className="text-xl font-bold flex items-center">
                  <BarChart3 className="w-5 h-5 mr-3 text-primary" />
                  Elections Under Management
               </h3>
               {loading && <span className="text-sm text-muted animate-pulse">Updating Blockchain...</span>}
            </div>
            <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead>
                     <tr className="bg-white/5 text-muted text-xs uppercase tracking-widest">
                        <th className="px-8 py-4">Title</th>
                        <th className="px-8 py-4">Status</th>
                        <th className="px-8 py-4">Candidates</th>
                        <th className="px-8 py-4">Votes</th>
                        <th className="px-8 py-4 text-right">Actions</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                     {elections.length === 0 ? (
                        <tr>
                           <td colSpan="5" className="text-center py-8 text-muted">
                              No elections found. Create one to get started!
                           </td>
                        </tr>
                     ) : (
                        elections.map((election) => (
                           <tr key={election.id} className="hover:bg-white/[0.02] transition-colors">
                              <td className="px-8 py-5 font-bold">
                                 <div>
                                   <p>{election.title}</p>
                                   <p className="text-xs text-muted font-normal mt-0.5">ID: {election.id}</p>
                                 </div>
                              </td>
                              <td className="px-8 py-5">
                                 <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                    election.status === 1 ? 'bg-green-500/10 text-green-400' :
                                    election.status === 0 ? 'bg-blue-500/10 text-blue-400' :
                                    'bg-red-500/10 text-red-400'
                                 }`}>
                                    {election.status === 0 ? 'Upcoming' : election.status === 1 ? 'Active' : 'Ended'}
                                 </span>
                              </td>
                              <td className="px-8 py-5 font-mono text-sm">{election.candidateIds.length}</td>
                              <td className="px-8 py-5 font-mono text-sm">{election.totalVotes}</td>
                              <td className="px-8 py-5 text-right">
                                 <div className="flex justify-end space-x-2">
                                    {election.status === 0 ? (
                                       <button 
                                          onClick={() => handleStartElection(election.id)}
                                          disabled={loading}
                                          className="px-4 py-2 hover:bg-green-500/20 text-green-400 rounded-xl text-xs font-bold transition-all flex items-center space-x-1" 
                                          title="Start Election"
                                       >
                                          <Play className="w-3.5 h-3.5" />
                                          <span>Start</span>
                                       </button>
                                    ) : election.status === 1 ? (
                                       <button 
                                          onClick={() => handleEndElection(election.id)}
                                          disabled={loading}
                                          className="px-4 py-2 hover:bg-red-500/20 text-red-400 rounded-xl text-xs font-bold transition-all flex items-center space-x-1" 
                                          title="End Election"
                                       >
                                          <Square className="w-3.5 h-3.5" />
                                          <span>End</span>
                                       </button>
                                    ) : (
                                       <span className="text-xs text-muted italic pr-2">Completed</span>
                                    )}
                                 </div>
                              </td>
                           </tr>
                        ))
                     )}
                  </tbody>
               </table>
            </div>
         </div>

         {/* Voter Registration Sidebar Panel */}
         <div className="glass-card rounded-3xl p-8 h-fit">
            <h3 className="text-xl font-bold mb-6 flex items-center">
               <UserPlus className="w-5 h-5 mr-3 text-accent" />
               Register Voter
            </h3>
            
            <form onSubmit={handleRegisterVoter} className="space-y-4">
               <div>
                  <label className="block text-xs uppercase tracking-wider text-muted font-bold mb-2">Select Election</label>
                  <select
                     value={voterForm.electionId}
                     onChange={(e) => setVoterForm({ ...voterForm, electionId: e.target.value })}
                     className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-primary/50 transition-all text-sm"
                     required
                  >
                     <option value="" disabled className="bg-background">Choose Election...</option>
                     {elections.map((elec) => (
                        <option key={elec.id} value={elec.id} className="bg-background">
                           ID {elec.id}: {elec.title} ({elec.status === 0 ? 'Upcoming' : elec.status === 1 ? 'Active' : 'Ended'})
                        </option>
                     ))}
                  </select>
               </div>

               <div>
                  <label className="block text-xs uppercase tracking-wider text-muted font-bold mb-2">Voter Address (Wallet)</label>
                  <input
                     type="text"
                     placeholder="0x..."
                     value={voterForm.voterAddress}
                     onChange={(e) => setVoterForm({ ...voterForm, voterAddress: e.target.value })}
                     className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-mono text-xs focus:outline-none focus:border-primary/50 transition-all"
                     required
                  />
               </div>

               <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-accent hover:bg-accent/80 text-white rounded-2xl font-bold transition-all disabled:opacity-50 text-sm mt-4 shadow-lg shadow-accent/20"
               >
                  {loading ? 'Processing...' : 'Register Voter'}
               </motion.button>
            </form>
         </div>
      </div>

      {/* CREATE ELECTION MODAL */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card p-8 rounded-3xl w-full max-w-xl border border-white/10 relative shadow-2xl"
            >
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="absolute top-6 right-6 text-muted hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <h3 className="text-2xl font-bold mb-6 flex items-center">
                <Calendar className="w-6 h-6 mr-3 text-primary" />
                Create New Election
              </h3>

              <form onSubmit={handleCreateElection} className="space-y-6">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-muted font-bold mb-2">Election Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Student Council 2026"
                    value={electionForm.title}
                    onChange={(e) => setElectionForm({ ...electionForm, title: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-primary/50 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-muted font-bold mb-2">Description</label>
                  <textarea
                    placeholder="Describe the purpose of this election..."
                    value={electionForm.description}
                    onChange={(e) => setElectionForm({ ...electionForm, description: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white h-24 focus:outline-none focus:border-primary/50 transition-all resize-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-muted font-bold mb-2">Start Time</label>
                    <input
                      type="datetime-local"
                      value={electionForm.startTime}
                      onChange={(e) => setElectionForm({ ...electionForm, startTime: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-primary/50 transition-all text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-muted font-bold mb-2">End Time</label>
                    <input
                      type="datetime-local"
                      value={electionForm.endTime}
                      onChange={(e) => setElectionForm({ ...electionForm, endTime: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-primary/50 transition-all text-sm"
                      required
                    />
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-primary hover:bg-secondary text-white rounded-2xl font-bold transition-all disabled:opacity-50 text-sm shadow-lg shadow-primary/20"
                >
                  {loading ? 'Creating Election...' : 'Submit to Blockchain'}
                </motion.button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADD CANDIDATE MODAL */}
      <AnimatePresence>
        {isAddCandidateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card p-8 rounded-3xl w-full max-w-xl border border-white/10 relative shadow-2xl"
            >
              <button 
                onClick={() => setIsAddCandidateModalOpen(false)}
                className="absolute top-6 right-6 text-muted hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <h3 className="text-2xl font-bold mb-6 flex items-center">
                <Plus className="w-6 h-6 mr-3 text-accent" />
                Add Candidate
              </h3>

              <form onSubmit={handleAddCandidate} className="space-y-6">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-muted font-bold mb-2">Select Election</label>
                  <select
                     value={candidateForm.electionId}
                     onChange={(e) => setCandidateForm({ ...candidateForm, electionId: e.target.value })}
                     className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-primary/50 transition-all text-sm"
                     required
                  >
                     <option value="" disabled className="bg-background">Choose Election...</option>
                     {elections.map((elec) => (
                        <option key={elec.id} value={elec.id} className="bg-background">
                           ID {elec.id}: {elec.title}
                        </option>
                     ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-muted font-bold mb-2">Candidate Name</label>
                  <input
                    type="text"
                    placeholder="e.g. John Doe"
                    value={candidateForm.name}
                    onChange={(e) => setCandidateForm({ ...candidateForm, name: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-primary/50 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-muted font-bold mb-2">Party/Affiliation</label>
                  <input
                    type="text"
                    placeholder="e.g. Democratic / Independent"
                    value={candidateForm.party}
                    onChange={(e) => setCandidateForm({ ...candidateForm, party: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-primary/50 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-muted font-bold mb-2 flex items-center">
                    <LinkIcon className="w-3.5 h-3.5 mr-1" /> Candidate Image URL (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. https://images.unsplash.com/..."
                    value={candidateForm.imageUrl}
                    onChange={(e) => setCandidateForm({ ...candidateForm, imageUrl: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-primary/50 transition-all"
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-accent hover:bg-accent/80 text-white rounded-2xl font-bold transition-all disabled:opacity-50 text-sm shadow-lg shadow-accent/20"
                >
                  {loading ? 'Adding Candidate...' : 'Register Candidate on Blockchain'}
                </motion.button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default AdminDashboard;
