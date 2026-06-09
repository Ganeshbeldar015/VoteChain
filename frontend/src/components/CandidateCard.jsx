import React from 'react';
import { motion } from 'framer-motion';
import { User, ShieldCheck, ArrowRight } from 'lucide-react';

const CandidateCard = ({ candidate, onVote, isSelected }) => {
  const { id, name, party, description, image } = candidate;

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className={`glass-card rounded-3xl p-6 border transition-all duration-300 ${
        isSelected ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : 'border-white/10'
      }`}
    >
      <div className="relative mb-6">
        <div className="w-full aspect-square rounded-2xl bg-gradient-to-br from-white/5 to-white/10 flex items-center justify-center overflow-hidden">
           {image ? (
             <img src={image} alt={name} className="w-full h-full object-cover" />
           ) : (
             <User className="w-20 h-20 text-muted/30" />
           )}
        </div>
        {isSelected && (
          <div className="absolute top-4 right-4 bg-primary text-white p-2 rounded-full shadow-lg">
             <ShieldCheck className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="text-center mb-6">
        <h3 className="text-xl font-bold mb-1">{name}</h3>
        <p className="text-primary text-sm font-semibold uppercase tracking-wider">{party}</p>
      </div>

      <p className="text-muted text-sm text-center mb-8 line-clamp-3">
        {description}
      </p>

      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => onVote(id)}
        className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center space-x-2 transition-all ${
          isSelected 
          ? 'bg-primary text-white shadow-xl shadow-primary/30' 
          : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
        }`}
      >
        <span>{isSelected ? 'Selected' : 'Select Candidate'}</span>
        {!isSelected && <ArrowRight className="w-4 h-4" />}
      </motion.button>
    </motion.div>
  );
};

export default CandidateCard;
