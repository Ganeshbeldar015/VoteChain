import { motion } from 'framer-motion';
import { Wallet, LogOut, CheckCircle2 } from 'lucide-react';
import { useWallet } from '../context/WalletContext';

const WalletConnect = () => {
  const { account, connect, disconnect, loading } = useWallet();

  return (
    <div className="flex items-center">
      {account ? (
        <div className="flex items-center space-x-3 bg-white/5 border border-white/10 px-4 py-2 rounded-full backdrop-blur-sm">
          <div className="flex items-center space-x-2 text-sm font-medium">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <span>{`${account.substring(0, 6)}...${account.substring(account.length - 4)}`}</span>
          </div>
          <button 
            onClick={disconnect}
            className="text-muted hover:text-red-400 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={connect}
          disabled={loading}
          className="bg-primary hover:bg-secondary text-white px-6 py-2.5 rounded-full font-semibold flex items-center space-x-2 shadow-lg shadow-primary/30 transition-all disabled:opacity-50"
        >
          <Wallet className="w-4 h-4" />
          <span>{loading ? 'Connecting...' : 'Connect Wallet'}</span>
        </motion.button>
      )}
    </div>
  );
};

export default WalletConnect;
