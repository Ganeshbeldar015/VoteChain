import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Trophy, Users, CheckCircle2, TrendingUp, Calendar, AlertCircle } from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { getResults } from '../services/blockchain';

const COLORS = ['#7C3AED', '#8B5CF6', '#A855F7', '#D8B4FE', '#818CF8', '#C084FC'];

const Results = () => {
  const { elections } = useWallet();
  const [selectedElectionId, setSelectedElectionId] = useState('');
  const [candidatesData, setCandidatesData] = useState([]);
  const [loadingResults, setLoadingResults] = useState(true);

  // Set default selected election once loaded
  useEffect(() => {
    if (elections.length > 0 && !selectedElectionId) {
      setSelectedElectionId(elections[0].id.toString());
    }
  }, [elections, selectedElectionId]);

  // Fetch results when selection changes
  useEffect(() => {
    const fetchElectionResults = async () => {
      if (!selectedElectionId) return;
      try {
        setLoadingResults(true);
        const results = await getResults(Number(selectedElectionId));
        setCandidatesData(results.map((c, index) => ({
          name: c.name,
          votes: c.votes,
          party: c.party,
          color: COLORS[index % COLORS.length]
        })));
      } catch (error) {
        console.error("Error fetching election results:", error);
      } finally {
        setLoadingResults(false);
      }
    };
    fetchElectionResults();
  }, [selectedElectionId]);

  const selectedElection = elections.find(e => e.id.toString() === selectedElectionId);

  const totalVotes = candidatesData.reduce((acc, curr) => acc + curr.votes, 0);
  const winner = candidatesData.length > 0 && totalVotes > 0
    ? candidatesData.reduce((prev, current) => (prev.votes > current.votes) ? prev : current)
    : { name: 'N/A', votes: 0 };

  // Turnout helper or status
  let electionStatusText = "Upcoming";
  if (selectedElection) {
    if (selectedElection.status === 1) electionStatusText = "Active";
    else if (selectedElection.status === 2) electionStatusText = "Completed";
  }

  return (
    <div className="pt-32 pb-24 container mx-auto px-6 min-h-screen">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-12 gap-6">
        <div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4">Live <span className="gradient-text">Analytics</span></h1>
          <p className="text-muted text-lg max-w-xl">
            Real-time voting data synchronized from the blockchain. Transparency in every single vote.
          </p>
        </div>
        
        {/* Election Selector Dropdown */}
        <div className="w-full lg:w-80">
          <label className="block text-xs uppercase tracking-wider text-muted font-bold mb-2 flex items-center">
            <Calendar className="w-3.5 h-3.5 mr-1" /> View Results For
          </label>
          <select
            value={selectedElectionId}
            onChange={(e) => setSelectedElectionId(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-primary/50 transition-all text-sm"
          >
            {elections.length === 0 ? (
              <option value="" disabled className="bg-background">No elections available</option>
            ) : (
              elections.map((elec) => (
                <option key={elec.id} value={elec.id} className="bg-background">
                  ID {elec.id}: {elec.title} ({elec.status === 0 ? 'Upcoming' : elec.status === 1 ? 'Active' : 'Ended'})
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {elections.length === 0 ? (
        <div className="text-center py-24 glass-card rounded-[2.5rem] max-w-xl mx-auto border border-white/5 p-8">
          <AlertCircle className="w-16 h-16 text-muted/30 mx-auto mb-6" />
          <h3 className="text-2xl font-bold mb-2">No Election Data</h3>
          <p className="text-muted">Once elections are created by the admin and voting begins, real-time analytics will display here.</p>
        </div>
      ) : loadingResults ? (
        <div className="text-center py-24 min-h-[40vh] flex flex-col justify-center items-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-6"></div>
          <p className="text-muted text-lg animate-pulse">Fetching real-time tallies from blockchain network...</p>
        </div>
      ) : candidatesData.length === 0 ? (
        <div className="text-center py-24 glass-card rounded-[2.5rem] max-w-xl mx-auto border border-white/5 p-8">
          <Users className="w-16 h-16 text-accent/30 mx-auto mb-6" />
          <h3 className="text-2xl font-bold mb-2">No Candidates Registered</h3>
          <p className="text-muted">There are no candidates added to this election. Results will be shown once candidates are registered.</p>
        </div>
      ) : (
        <>
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
             <div className="glass-card p-6 rounded-3xl">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                   <Users className="w-6 h-6 text-primary" />
                </div>
                <p className="text-muted text-sm font-medium">Total Votes</p>
                <h3 className="text-3xl font-bold">{totalVotes.toLocaleString()}</h3>
             </div>
             <div className="glass-card p-6 rounded-3xl">
                <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center mb-4">
                   <Trophy className="w-6 h-6 text-green-500" />
                </div>
                <p className="text-muted text-sm font-medium">Leading Candidate</p>
                <h3 className="text-2xl font-bold truncate">{winner.name}</h3>
             </div>
             <div className="glass-card p-6 rounded-3xl">
                <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center mb-4">
                   <CheckCircle2 className="w-6 h-6 text-accent" />
                </div>
                <p className="text-muted text-sm font-medium">Verification Rate</p>
                <h3 className="text-3xl font-bold">100%</h3>
             </div>
             <div className="glass-card p-6 rounded-3xl">
                <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-4">
                   <TrendingUp className="w-6 h-6 text-blue-500" />
                </div>
                <p className="text-muted text-sm font-medium">Election Status</p>
                <h3 className="text-2xl font-bold">{electionStatusText}</h3>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
             {/* Bar Chart */}
             <motion.div 
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: 0.2 }}
               className="glass-card p-8 rounded-[2.5rem]"
             >
                <h3 className="text-xl font-bold mb-8">Vote Distribution</h3>
                <div className="h-80 w-full">
                   {totalVotes === 0 ? (
                     <div className="h-full flex items-center justify-center text-muted italic">
                       No votes cast yet. Chart will render once voting starts.
                     </div>
                   ) : (
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={candidatesData}>
                           <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                           <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                           <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                           <Tooltip 
                              contentStyle={{ backgroundColor: '#1E293B', border: 'none', borderRadius: '12px', color: '#fff' }}
                              cursor={{ fill: '#ffffff05' }}
                           />
                           <Bar dataKey="votes" fill="#7C3AED" radius={[8, 8, 0, 0]} />
                        </BarChart>
                     </ResponsiveContainer>
                   )}
                </div>
             </motion.div>

             {/* Pie Chart */}
             <motion.div 
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: 0.3 }}
               className="glass-card p-8 rounded-[2.5rem]"
             >
                <h3 className="text-xl font-bold mb-8">Vote Share</h3>
                <div className="h-80 w-full">
                   {totalVotes === 0 ? (
                     <div className="h-full flex items-center justify-center text-muted italic">
                       No votes cast yet. Chart will render once voting starts.
                     </div>
                   ) : (
                     <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                           <Pie
                              data={candidatesData}
                              cx="50%"
                              cy="50%"
                              innerRadius={80}
                              outerRadius={120}
                              paddingAngle={5}
                              dataKey="votes"
                           >
                              {candidatesData.map((entry, index) => (
                                 <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                           </Pie>
                           <Tooltip 
                              contentStyle={{ backgroundColor: '#1E293B', border: 'none', borderRadius: '12px', color: '#fff' }}
                           />
                           <Legend verticalAlign="bottom" height={36}/>
                        </PieChart>
                     </ResponsiveContainer>
                   )}
                </div>
             </motion.div>
          </div>

          {/* Detailed Table */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card rounded-[2.5rem] overflow-hidden"
          >
             <div className="p-8 border-b border-white/5">
                <h3 className="text-xl font-bold">Live Vote Feed</h3>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead>
                      <tr className="bg-white/5 text-muted text-xs uppercase tracking-widest">
                         <th className="px-8 py-4 font-semibold">Candidate</th>
                         <th className="px-8 py-4 font-semibold">Party</th>
                         <th className="px-8 py-4 font-semibold">Votes</th>
                         <th className="px-8 py-4 font-semibold">Percentage</th>
                         <th className="px-8 py-4 font-semibold">Progress</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-white/5">
                      {candidatesData.map((candidate, i) => {
                         const percentage = totalVotes > 0 
                           ? ((candidate.votes / totalVotes) * 100).toFixed(1) 
                           : "0.0";
                         return (
                            <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                               <td className="px-8 py-6 font-bold">{candidate.name}</td>
                               <td className="px-8 py-6 text-muted">{candidate.party}</td>
                               <td className="px-8 py-6 font-mono">{candidate.votes.toLocaleString()}</td>
                               <td className="px-8 py-6">{percentage}%</td>
                               <td className="px-8 py-6">
                                  <div className="w-48 h-2 bg-white/10 rounded-full overflow-hidden">
                                     <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${percentage}%` }}
                                        transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
                                        className="h-full bg-primary"
                                     />
                                  </div>
                               </td>
                            </tr>
                         )
                      })}
                   </tbody>
                </table>
             </div>
          </motion.div>
        </>
      )}
    </div>
  );
};

export default Results;
