import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface PageTransitionProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
}

const PageTransition: React.FC<PageTransitionProps> = ({ children, className = '', ...props }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -15, scale: 0.99 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={`w-full h-full flex flex-col ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
