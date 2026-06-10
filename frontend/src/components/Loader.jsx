import { motion } from 'framer-motion';

const Loader = () => {
  return (
    <div className="flex items-center justify-center space-x-2">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          animate={{
            y: [0, -10, 0],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.2
          }}
          className="w-3 h-3 bg-primary rounded-full"
        />
      ))}
    </div>
  );
};

export default Loader;
