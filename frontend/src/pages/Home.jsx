import React from 'react';
import HeroSection from '../components/HeroSection';
import FeatureCard from '../components/FeatureCard';
import HowItWorks from '../components/HowItWorks';
import Statistics from '../components/Statistics';
import ElectionCard from '../components/ElectionCard';
import { Shield, Zap, Globe, Lock, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { useWallet } from '../context/WalletContext';
import { Link } from 'react-router-dom';

const features = [
  {
    icon: Lock,
    title: "Immutable Records",
    description: "Once cast, your vote is permanently recorded on the blockchain and cannot be altered.",
    delay: 0.1
  },
  {
    icon: Zap,
    title: "Real-Time Counting",
    description: "Results are processed instantly as votes come in, providing immediate transparency.",
    delay: 0.2
  },
  {
    icon: Globe,
    title: "Decentralized Infrastructure",
    description: "No central authority control. Powered by a global network of independent nodes.",
    delay: 0.3
  },
  {
    icon: Shield,
    title: "End-to-End Security",
    description: "Advanced cryptographic techniques ensure that only verified voters can participate.",
    delay: 0.4
  }
];

const Home = () => {
  const { elections } = useWallet();

  // Filter and limit to 3 active/upcoming elections
  const activeElections = elections
    .filter(e => e.status === 1 || e.status === 0)
    .slice(0, 3)
    .map(e => {
      let statusText = e.status === 1 ? "Active" : "Upcoming";
      
      let endsIn = "";
      const now = Math.floor(Date.now() / 1000);
      if (e.status === 0) {
        const diff = e.startTime - now;
        endsIn = diff > 86400 ? `Starts in ${Math.round(diff / 86400)} days` : "Starting soon";
      } else {
        const diff = e.endTime - now;
        endsIn = diff > 86400 ? `${Math.round(diff / 86400)} days left` : "Ending soon";
      }

      return {
        id: e.id,
        title: e.title,
        description: e.description,
        status: statusText,
        candidateCount: e.candidateIds.length,
        endsIn: endsIn
    });

  return (
    <div>
      <HeroSection />
      
      {/* Features Section */}
      <section className="py-24 container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>
      </section>

      <Statistics />
      
      <HowItWorks />

      {/* Featured Elections */}
      <section className="py-24 container mx-auto px-6">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Live <span className="gradient-text">Elections</span></h2>
            <p className="text-muted">Participate in ongoing democratic processes happening right now.</p>
          </div>
          <Link to="/elections">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              className="text-primary font-bold flex items-center space-x-2"
            >
              <span>View All</span>
              <ChevronDown className="w-4 h-4 -rotate-90" />
            </motion.button>
          </Link>
        </div>
        
        {activeElections.length === 0 ? (
          <div className="text-center py-12 glass-card rounded-3xl p-8 max-w-xl mx-auto border border-white/5">
             <p className="text-muted">No active or upcoming elections right now. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {activeElections.map((election) => (
              <ElectionCard key={election.id} election={election} />
            ))}
          </div>
        )}
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-white/[0.02] border-y border-white/5">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-16">Trusted by <span className="gradient-text">Voters</span></h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card p-8 rounded-3xl">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold">
                    U{i}
                  </div>
                  <div>
                    <h4 className="font-bold">User Name {i}</h4>
                    <p className="text-xs text-muted">Verified Voter</p>
                  </div>
                </div>
                <p className="text-muted italic leading-relaxed">
                  "The most seamless voting experience I've ever had. Knowing my vote is on the blockchain gives me incredible peace of mind."
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 container mx-auto px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-16">Frequently Asked <span className="gradient-text">Questions</span></h2>
          <div className="space-y-4">
            {[
              { q: "How does blockchain voting work?", a: "Every vote is recorded as a transaction on a decentralized ledger, ensuring it cannot be changed or deleted." },
              { q: "Is my vote anonymous?", a: "Yes, we use advanced cryptographic techniques to separate your identity from your actual vote." },
              { q: "Can votes be altered?", a: "No, the fundamental nature of blockchain prevents any alteration once a block is confirmed." },
              { q: "How secure is the platform?", a: "Our smart contracts undergo rigorous security audits and are protected by decentralized consensus." }
            ].map((faq, i) => (
              <details key={i} className="glass-card rounded-2xl group transition-all duration-300">
                <summary className="p-6 cursor-pointer font-bold flex justify-between items-center list-none">
                  {faq.q}
                  <ChevronDown className="w-5 h-5 group-open:rotate-180 transition-transform" />
                </summary>
                <div className="p-6 pt-0 text-muted leading-relaxed">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
