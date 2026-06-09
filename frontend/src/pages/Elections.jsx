import React, { useState } from 'react';
import { motion } from 'framer-motion';
import ElectionCard from '../components/ElectionCard';
import { Search, Filter } from 'lucide-react';
import { useWallet } from '../context/WalletContext';

const Elections = () => {
  const { elections, loading } = useWallet();
  const [filter, setFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Map blockchain elections to UI-compatible format
  const mappedElections = elections.map(e => {
    let statusText = "Upcoming";
    if (e.status === 1) statusText = "Active";
    else if (e.status === 2) statusText = "Completed";

    let endsIn = "";
    const now = Math.floor(Date.now() / 1000);
    if (e.status === 0) {
      const diff = e.startTime - now;
      if (diff > 86400) {
        endsIn = `Starts in ${Math.round(diff / 86400)} days`;
      } else if (diff > 0) {
        endsIn = `Starts in ${Math.round(diff / 3600)} hrs`;
      } else {
        endsIn = "Starting soon";
      }
    } else if (e.status === 1) {
      const diff = e.endTime - now;
      if (diff > 86400) {
        endsIn = `${Math.round(diff / 86400)} days left`;
      } else if (diff > 3600) {
        endsIn = `${Math.round(diff / 3600)} hrs left`;
      } else if (diff > 0) {
        endsIn = `${Math.round(diff / 60)} mins left`;
      } else {
        endsIn = "Ending soon";
      }
    } else {
      endsIn = "Ended";
    }

    return {
      id: e.id,
      title: e.title,
      description: e.description,
      status: statusText,
      candidateCount: e.candidateIds.length,
      endsIn: endsIn
    };
  });

  const filteredElections = mappedElections.filter(e => {
    const matchesFilter = filter === 'All' || e.status === filter;
    const matchesSearch = e.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="pt-32 pb-24 container mx-auto px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <h1 className="text-4xl md:text-6xl font-bold mb-6">Explore <span className="gradient-text">Elections</span></h1>
        {loading && <span className="text-sm text-primary animate-pulse mb-4 block">Fetching data from decentralized ledger...</span>}
        <p className="text-muted text-lg max-w-2xl">
          Browse through all active, upcoming, and completed elections. Use filters to find what matters to you.
        </p>
      </motion.div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
        <div className="flex space-x-2 bg-white/5 p-1.5 rounded-2xl border border-white/10 w-full md:w-auto overflow-x-auto">
          {['All', 'Active', 'Upcoming', 'Completed'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                filter === f ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Search elections..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
          />
        </div>
      </div>

      {/* Elections Grid */}
      <motion.div 
        layout
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
      >
        {filteredElections.map((election) => (
          <motion.div layout key={election.id}>
            <ElectionCard election={election} />
          </motion.div>
        ))}
      </motion.div>

      {filteredElections.length === 0 && (
        <div className="text-center py-24">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
            <Filter className="w-10 h-10 text-muted" />
          </div>
          <h3 className="text-2xl font-bold mb-2">No elections found</h3>
          <p className="text-muted">Try adjusting your filters or search term.</p>
        </div>
      )}
    </div>
  );
};

export default Elections;
