import React from 'react';
import { motion } from 'framer-motion';
import { Wallet, UserCheck, Vote, BarChart3 } from 'lucide-react';

const steps = [
  {
    icon: Wallet,
    title: "Connect Wallet",
    description: "Link your MetaMask or any Web3 wallet to get started with the platform."
  },
  {
    icon: UserCheck,
    title: "Verify Identity",
    description: "Ensure your voter registration is valid and verified on the blockchain."
  },
  {
    icon: Vote,
    title: "Cast Your Vote",
    description: "Select your candidate and sign the transaction to cast your immutable vote."
  },
  {
    icon: BarChart3,
    title: "Track Results",
    description: "Monitor real-time results as they are recorded transparently on-chain."
  }
];

const HowItWorks = () => {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">How It <span className="gradient-text">Works</span></h2>
          <p className="text-muted max-w-2xl mx-auto">Cast your vote in four simple steps with complete confidence and security.</p>
        </div>

        <div className="relative">
          {/* Progress Line */}
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/5 -translate-y-1/2 hidden md:block" />
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative z-10 text-center"
              >
                <div className="w-16 h-16 bg-background border border-primary/30 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(124,58,237,0.2)]">
                  <step.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">Step {index + 1}: {step.title}</h3>
                <p className="text-muted text-sm px-4">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
