import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useWallet } from '../context/WalletContext';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useState } from 'react';

const MainLayout = () => {
  const { account, networkDetails } = useWallet();
  const [switching, setSwitching] = useState(false);

  // If connected, check if contract bytecode length is 0 (or hex 0x / <= 2)
  const isWrongNetwork = account && networkDetails && networkDetails.codeLength <= 2;

  const handleSwitchNetwork = async () => {
    if (window.ethereum) {
      try {
        setSwitching(true);
        // Base Sepolia chainId in hex is 0x14a34 (84532)
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x14a34' }],
        });
      } catch (switchError) {
        // This error code indicates that the chain has not been added to MetaMask.
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: '0x14a34',
                  chainName: 'Base Sepolia',
                  nativeCurrency: {
                    name: 'Ethereum',
                    symbol: 'ETH',
                    decimals: 18,
                  },
                  rpcUrls: ['https://sepolia.base.org'],
                  blockExplorerUrls: ['https://sepolia.basescan.org'],
                },
              ],
            });
          } catch (addError) {
            console.error("Failed to add Base Sepolia network:", addError);
          }
        } else {
          console.error("Failed to switch to Base Sepolia network:", switchError);
        }
      } finally {
        setSwitching(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background text-zinc-900 selection:bg-primary/10 selection:text-primary flex flex-col justify-between">
      <div>
        <Navbar />
        {isWrongNetwork && (
          <div className="fixed top-16 md:top-20 left-0 right-0 z-40 bg-amber-500/10 border-b border-amber-500/20 backdrop-blur-md py-3 px-6 flex flex-col sm:flex-row items-center justify-center gap-3 text-amber-600 shadow-md">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-amber-500 animate-bounce" />
              <span className="text-xs md:text-sm font-semibold">
                Wrong Network: The VoteChain contract is deployed on <strong className="font-bold text-amber-700">Base Sepolia</strong>, but your wallet is connected to a different network.
              </span>
            </div>
            <button
              onClick={handleSwitchNetwork}
              disabled={switching}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs px-4 py-1.5 rounded-full font-bold shadow-md hover:shadow-lg active:scale-95 transition-all flex items-center space-x-1 disabled:opacity-50"
            >
              {switching ? (
                <>
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>Switching...</span>
                </>
              ) : (
                <span>Switch to Base Sepolia</span>
              )}
            </button>
          </div>
        )}
        <main className={isWrongNetwork ? "pt-12 md:pt-10" : ""}>
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default MainLayout;
