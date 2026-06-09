import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Users, ArrowRight, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

const ElectionCard = ({ election }) => {
  const { id, title, status, candidateCount, endsIn, description } = election;

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="glass-card rounded-3xl overflow-hidden group transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 border border-white/10"
    >
      <div className="p-8">
        <div className="flex justify-between items-start mb-6">
          <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
            status === 'Active' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 
            status === 'Upcoming' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 
            'bg-muted/10 text-muted border border-muted/20'
          }`}>
            {status}
          </div>
          <div className="flex items-center space-x-2 text-muted text-sm">
             <Clock className="w-4 h-4" />
             <span>{endsIn}</span>
          </div>
        </div>

        <h3 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors">{title}</h3>
        <p className="text-muted text-sm mb-6 line-clamp-2">{description}</p>

        <div className="flex items-center space-x-6 mb-8 py-4 border-y border-white/5">
           <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-primary" />
              <div>
                 <p className="text-xs text-muted">Candidates</p>
                 <p className="font-bold">{candidateCount}</p>
              </div>
           </div>
           <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-accent" />
              <div>
                 <p className="text-xs text-muted">Expires</p>
                 <p className="font-bold">2026-06-30</p>
              </div>
           </div>
        </div>

        <Link to={`/candidates/${id}`}>
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="w-full py-4 rounded-2xl bg-white/5 hover:bg-primary text-white font-bold transition-all duration-300 flex items-center justify-center space-x-2 group/btn"
          >
            <span>{status === 'Active' ? 'Vote Now' : 'View Details'}</span>
            <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
          </motion.button>
        </Link>
      </div>
    </motion.div>
  );
};

export default ElectionCard;
