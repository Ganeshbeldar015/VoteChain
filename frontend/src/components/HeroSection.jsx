import React from 'react';
import { motion } from 'framer-motion';
import { Shield, ArrowRight, Play } from 'lucide-react';
import { Link } from 'react-router-dom';

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] -z-10 animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[120px] -z-10 animate-pulse delay-1000" />
      
      <div className="container mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center space-x-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full mb-8 backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Web3 Powered Security</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold mb-8 tracking-tight">
            Secure, Transparent & <br />
            <span className="gradient-text">Decentralized Voting</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted max-w-2xl mx-auto mb-10 leading-relaxed">
            Vote from anywhere with blockchain-powered security and complete transparency. 
            The future of democratic participation starts here.
          </p>
          
          <div className="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-6">
            <Link to="/elections">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-primary hover:bg-secondary text-white px-8 py-4 rounded-2xl font-bold flex items-center space-x-2 shadow-xl shadow-primary/20 transition-all w-full md:w-auto"
              >
                <span>Explore Elections</span>
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </Link>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-900 px-8 py-4 rounded-2xl font-bold flex items-center space-x-2 backdrop-blur-md transition-all w-full md:w-auto"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>How it Works</span>
            </motion.button>
          </div>
        </motion.div>
        
        {/* Animated Mockup / Illustration Placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-20 relative mx-auto max-w-5xl"
        >
          <div className="glass-card rounded-3xl p-4 md:p-8 relative">
             <div className="aspect-video rounded-2xl bg-gradient-to-br from-[#1E293B] to-[#0F172A] flex items-center justify-center border border-white/5 overflow-hidden">
                {/* Abstract Blockchain Illustration */}
                <div className="relative w-full h-full">
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-primary/30 rounded-full blur-[60px]" />
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border border-primary/20 rounded-full w-[300px] h-[300px] animate-[spin_10s_linear_infinite]" />
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border border-accent/20 rounded-full w-[450px] h-[450px] animate-[spin_15s_linear_infinite_reverse]" />
                   <div className="flex flex-col items-center justify-center h-full relative z-10">
                      <Shield className="w-20 h-20 text-primary mb-4 drop-shadow-2xl" />
                      <div className="h-1 w-32 bg-gradient-to-r from-transparent via-primary to-transparent" />
                   </div>
                </div>
             </div>
             {/* Floating UI Elements */}
             <div className="absolute -top-6 -right-6 md:-right-12 glass-card p-4 rounded-2xl hidden md:block">
                <div className="flex items-center space-x-3">
                   <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full" />
                   </div>
                   <div>
                      <p className="text-xs text-muted">Network Status</p>
                      <p className="text-sm font-bold">Mainnet Active</p>
                   </div>
                </div>
             </div>
             <div className="absolute -bottom-6 -left-6 md:-left-12 glass-card p-4 rounded-2xl hidden md:block">
                <div className="flex items-center space-x-3">
                   <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                      <Shield className="w-5 h-5 text-primary" />
                   </div>
                   <div>
                      <p className="text-xs text-muted">Security Score</p>
                      <p className="text-sm font-bold">99.9% Immutable</p>
                   </div>
                </div>
             </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
