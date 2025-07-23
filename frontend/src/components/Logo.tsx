import React from 'react';
import { motion } from 'framer-motion';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animated?: boolean;
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ 
  size = 'md', 
  animated = true, 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const logoVariants = {
    hidden: { scale: 0, rotate: -180 },
    visible: { 
      scale: 1, 
      rotate: 0,
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 20,
        duration: 1.2
      }
    }
  };

  const leafVariants = {
    animate: {
      rotate: [0, 5, -5, 0],
      scale: [1, 1.05, 1],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const glowVariants = {
    animate: {
      opacity: [0.5, 1, 0.5],
      scale: [1, 1.1, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <motion.div
      className={`relative ${sizeClasses[size]} ${className}`}
      variants={animated ? logoVariants : {}}
      initial={animated ? "hidden" : "visible"}
      animate="visible"
    >
      {/* Glowing background effect */}
      {animated && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-oasis-400 to-primary-500 rounded-full blur-sm opacity-50"
          variants={glowVariants}
          animate="animate"
        />
      )}
      
      {/* Main logo container */}
      <div className="relative z-10 w-full h-full bg-gradient-to-br from-oasis-500 via-primary-500 to-oasis-600 rounded-full p-1">
        <div className="w-full h-full bg-white rounded-full flex items-center justify-center relative overflow-hidden">
          
          {/* Animated leaves */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            variants={animated ? leafVariants : {}}
            animate={animated ? "animate" : ""}
          >
            {/* Left leaf */}
            <div className="absolute -left-1 top-1/2 transform -translate-y-1/2">
              <div className="w-3 h-5 bg-gradient-to-br from-oasis-400 to-oasis-600 rounded-full transform -rotate-45 origin-bottom"></div>
            </div>
            
            {/* Right leaf */}
            <div className="absolute -right-1 top-1/2 transform -translate-y-1/2">
              <div className="w-3 h-5 bg-gradient-to-br from-oasis-400 to-oasis-600 rounded-full transform rotate-45 origin-bottom"></div>
            </div>
            
            {/* Center tree/book symbol */}
            <div className="relative z-20">
              {/* Book pages */}
              <div className="w-4 h-3 bg-gradient-to-r from-primary-400 to-primary-600 rounded-sm relative">
                <div className="absolute top-0 left-1 w-2 h-3 bg-white rounded-sm opacity-80"></div>
                <div className="absolute top-0 right-1 w-2 h-3 bg-white rounded-sm opacity-60"></div>
              </div>
              
              {/* Growth arrow/stem */}
              <div className="w-0.5 h-2 bg-oasis-500 mx-auto"></div>
            </div>
          </motion.div>
          
          {/* Sparkle effects */}
          {animated && (
            <>
              <motion.div
                className="absolute top-1 right-2 w-1 h-1 bg-yellow-400 rounded-full"
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: 0.5,
                }}
              />
              <motion.div
                className="absolute bottom-2 left-1 w-1 h-1 bg-yellow-300 rounded-full"
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: 1,
                }}
              />
              <motion.div
                className="absolute top-3 left-2 w-0.5 h-0.5 bg-white rounded-full"
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: 1.5,
                }}
              />
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default Logo;
