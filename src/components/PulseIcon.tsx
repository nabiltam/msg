import { motion } from 'motion/react';

export function PulseIcon({ isOnline }: { isOnline: boolean }) {
  return (
    <div className="relative flex items-center justify-center w-3 h-3">
      {isOnline && (
        <motion.div
          className="absolute w-full h-full bg-green-500 rounded-full opacity-75"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.75, 0, 0.75],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}
      <div
        className={`w-2 h-2 rounded-full ${
          isOnline ? 'bg-green-500' : 'bg-gray-400'
        }`}
      />
    </div>
  );
}
