import React from 'react';
import { motion } from 'framer-motion';

const AnimatedBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 bg-slate-50 dark:bg-[#0b0f19]">
      {/* Mesh gradients are applied via class name in App.tsx, but here we add floating blobs */}
      
      {/* Blob 1 */}
      <motion.div
        animate={{
          x: [0, 100, 0, -100, 0],
          y: [0, 50, -50, 50, 0],
          scale: [1, 1.2, 1, 0.8, 1],
        }}
        transition={{
          duration: 25,
          ease: "linear",
          repeat: Infinity,
        }}
        className="hidden md:block absolute -top-32 -left-32 w-96 h-96 bg-brand-500/20 dark:bg-brand-600/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[100px] opacity-70"
      />
      
      {/* Blob 2 */}
      <motion.div
        animate={{
          x: [0, -150, 0, 150, 0],
          y: [0, 100, 0, -100, 0],
          scale: [1, 1.5, 1, 1.2, 1],
        }}
        transition={{
          duration: 30,
          ease: "linear",
          repeat: Infinity,
        }}
        className="hidden md:block absolute top-1/2 -right-32 w-[30rem] h-[30rem] bg-indigo-400/20 dark:bg-indigo-600/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[120px] opacity-60"
      />

      {/* Blob 3 */}
      <motion.div
        animate={{
          x: [0, 50, 150, 50, 0],
          y: [0, -100, 0, 100, 0],
          scale: [1, 0.8, 1, 1.1, 1],
        }}
        transition={{
          duration: 20,
          ease: "linear",
          repeat: Infinity,
        }}
        className="hidden md:block absolute -bottom-48 left-1/3 w-[25rem] h-[25rem] bg-cyan-400/20 dark:bg-cyan-600/10 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[100px] opacity-50"
      />
    </div>
  );
};

export default AnimatedBackground;
