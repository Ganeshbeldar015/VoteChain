import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, AlertCircle } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center container mx-auto px-6">
      <div className="text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-8"
        >
          <AlertCircle className="w-12 h-12 text-red-500" />
        </motion.div>
        
        <h1 className="text-6xl font-black mb-4 gradient-text">404</h1>
        <h2 className="text-3xl font-bold mb-6">Page Not Found</h2>
        <p className="text-muted mb-10 max-w-md mx-auto">
          The page you are looking for might have been moved, deleted, or never existed in this blockchain.
        </p>
        
        <Link to="/">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-primary hover:bg-secondary text-white px-8 py-4 rounded-2xl font-bold flex items-center space-x-2 mx-auto shadow-lg shadow-primary/20 transition-all"
          >
            <Home className="w-5 h-5" />
            <span>Back to Home</span>
          </motion.button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
