import { motion } from "framer-motion";

interface Avatar3DViewerProps {
  avatarUrl?: string;
  avatarImage?: string;
  className?: string;
  isSpeaking?: boolean;
}

export function Avatar3DViewer({ 
  avatarImage,
  className = "", 
  isSpeaking = false 
}: Avatar3DViewerProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`relative ${className} flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900`}
    >
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-primary/20 rounded-full"
            initial={{
              x: Math.random() * 100 + "%",
              y: Math.random() * 100 + "%",
            }}
            animate={{
              y: [null, "-100%"],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: Math.random() * 5 + 5,
              repeat: Infinity,
              delay: Math.random() * 5,
            }}
          />
        ))}
      </div>

      {/* Main avatar container */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Glow effect behind avatar */}
        <motion.div
          animate={isSpeaking ? {
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          } : {
            scale: [1, 1.05, 1],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{
            duration: isSpeaking ? 0.5 : 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute inset-0 bg-gradient-to-r from-primary/40 to-purple-500/40 rounded-full blur-2xl scale-150"
        />
        
        {/* Avatar image with animation */}
        <motion.div
          animate={isSpeaking ? {
            scale: [1, 1.03, 1],
            y: [0, -3, 0],
          } : {
            y: [0, -5, 0],
          }}
          transition={{
            duration: isSpeaking ? 0.3 : 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="relative"
        >
          {avatarImage ? (
            <img 
              src={avatarImage} 
              alt="Avatar" 
              className="w-52 h-52 rounded-full object-cover border-4 border-primary/40 shadow-2xl shadow-primary/20"
            />
          ) : (
            <div className="w-52 h-52 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 border-4 border-primary/40 shadow-2xl flex items-center justify-center">
              <span className="text-6xl">👤</span>
            </div>
          )}
          
          {/* Speaking ring animation */}
          {isSpeaking && (
            <>
              <motion.div
                animate={{
                  scale: [1, 1.4, 1],
                  opacity: [0.6, 0, 0.6],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                }}
                className="absolute inset-0 rounded-full border-2 border-primary"
              />
              <motion.div
                animate={{
                  scale: [1, 1.6, 1],
                  opacity: [0.4, 0, 0.4],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: 0.3,
                }}
                className="absolute inset-0 rounded-full border-2 border-primary/50"
              />
            </>
          )}
          
        </motion.div>
        
        {/* Audio visualizer when speaking */}
        {isSpeaking && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 flex items-center gap-1"
          >
            {[...Array(9)].map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  height: [8, 28 + Math.sin(i) * 10, 8],
                }}
                transition={{
                  duration: 0.4,
                  repeat: Infinity,
                  delay: i * 0.05,
                  ease: "easeInOut",
                }}
                className="w-1.5 bg-gradient-to-t from-primary to-purple-400 rounded-full"
                style={{ minHeight: 8 }}
              />
            ))}
          </motion.div>
        )}
        
        {/* Status text */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className={`mt-4 text-sm font-medium ${isSpeaking ? 'text-primary' : 'text-white/60'}`}
        >
          {isSpeaking ? 'Sta parlando...' : 'In ascolto...'}
        </motion.p>
      </div>
    </motion.div>
  );
}
