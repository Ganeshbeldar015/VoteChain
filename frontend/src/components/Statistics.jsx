import React from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';

const StatItem = ({ label, value, delay }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="text-center"
    >
      <h3 className="text-4xl md:text-6xl font-extrabold mb-2 gradient-text">{value}</h3>
      <p className="text-muted font-medium uppercase tracking-widest text-sm">{label}</p>
    </motion.div>
  );
};

const Statistics = () => {
  return (
    <section className="py-20 border-y border-white/5 bg-white/[0.02]">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
          <StatItem label="Votes Cast" value="10k+" delay={0.1} />
          <StatItem label="Transparency" value="100%" delay={0.2} />
          <StatItem label="Elections" value="500+" delay={0.3} />
          <StatItem label="Uptime" value="99.9%" delay={0.4} />
        </div>
      </div>
    </section>
  );
};

export default Statistics;
