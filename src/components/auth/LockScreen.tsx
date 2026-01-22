import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import { PinInput } from './PinInput';

export const LockScreen = () => {
  const {
    session,
    loginPin,
    setLoginPin,
    verifyPin,
    error,
    isLoading,
    failedAttempts,
    lockedUntil,
    lockReason,
  } = useAuthStore();
  
  const [localError, setLocalError] = useState(false);
  const [lockCountdown, setLockCountdown] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Update clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  
  // Handle lockout countdown
  useEffect(() => {
    if (lockedUntil) {
      const updateCountdown = () => {
        const remaining = Math.max(0, Math.ceil((new Date(lockedUntil).getTime() - Date.now()) / 1000));
        setLockCountdown(remaining);
      };
      
      updateCountdown();
      const timer = setInterval(updateCountdown, 1000);
      return () => clearInterval(timer);
    } else {
      setLockCountdown(0);
    }
  }, [lockedUntil]);
  
  const handlePinComplete = useCallback(async (pin: string) => {
    if (lockCountdown > 0) return;
    
    const success = await verifyPin(pin);
    if (!success) {
      setLocalError(true);
      setTimeout(() => {
        setLocalError(false);
        setLoginPin('');
      }, 600);
    }
  }, [verifyPin, lockCountdown, setLoginPin]);
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };
  
  const getAvatarInitial = () => {
    return session?.username?.charAt(0).toUpperCase() || 'W';
  };
  
  const isLocked = lockCountdown > 0;
  
  return (
    <div className="fixed inset-0 bg-background overflow-hidden select-none">
      {/* Blurred wallpaper background */}
      <div className="absolute inset-0 bg-grid opacity-10" />
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 30% 20%, hsl(var(--terminal) / 0.08) 0%, transparent 50%)',
        }}
      />
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 70% 80%, hsl(var(--cyber) / 0.05) 0%, transparent 50%)',
        }}
      />
      
      {/* Blur overlay */}
      <div className="absolute inset-0 backdrop-blur-xl bg-[hsl(var(--background)/0.7)]" />
      
      {/* Noise texture */}
      <div className="absolute inset-0 bg-noise pointer-events-none" />
      
      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,hsl(var(--background))_100%)] opacity-60" />
      
      {/* Lock screen content */}
      <div className="relative h-full flex flex-col items-center justify-center px-8">
        {/* Time display (top) */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-16 text-center"
        >
          <div className="font-display text-7xl font-light text-foreground tracking-wider">
            {formatTime(currentTime)}
          </div>
          <div className="text-foreground-muted text-lg mt-2">
            {formatDate(currentTime)}
          </div>
        </motion.div>
        
        {/* Main login panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center"
        >
          {/* Avatar */}
          <motion.div
            className="relative mb-6"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
          >
            <div 
              className="w-32 h-32 rounded-full bg-[hsl(var(--terminal-dim))] border-4 border-terminal flex items-center justify-center overflow-hidden"
              style={{
                boxShadow: '0 0 40px hsl(var(--terminal) / 0.3), 0 0 80px hsl(var(--terminal) / 0.1)',
              }}
            >
              {session?.avatar_url ? (
                <img 
                  src={session.avatar_url} 
                  alt={session.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="font-display text-5xl font-bold text-terminal glow-terminal">
                  {getAvatarInitial()}
                </span>
              )}
            </div>
            
            {/* Status ring */}
            <motion.div
              className="absolute -inset-1 rounded-full border-2 border-terminal opacity-50"
              animate={{
                scale: [1, 1.05, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>
          
          {/* Username */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-8"
          >
            <h2 className="font-mono text-2xl text-foreground">
              {session?.username || 'Operator'}
            </h2>
            {session?.rank && (
              <p className="text-foreground-subtle text-sm mt-1 uppercase tracking-wider">
                {session.rank}
              </p>
            )}
          </motion.div>
          
          {/* PIN Input */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-6"
          >
            <PinInput
              value={loginPin}
              onChange={setLoginPin}
              onComplete={handlePinComplete}
              error={localError || !!error}
              disabled={isLoading || isLocked}
              autoFocus
            />
          </motion.div>
          
          {/* Error / Lock message */}
          <AnimatePresence mode="wait">
            {isLocked ? (
              <motion.div
                key="locked"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center"
              >
                <p className="text-danger text-sm">
                  System locked
                </p>
                <p className="text-foreground-muted text-xs mt-1">
                  Try again in {lockCountdown}s
                </p>
              </motion.div>
            ) : error ? (
              <motion.p
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-danger text-sm"
              >
                {error}
              </motion.p>
            ) : (
              <motion.p
                key="hint"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-foreground-subtle text-sm"
              >
                Enter PIN to unlock
              </motion.p>
            )}
          </AnimatePresence>
          
          {/* Failed attempts indicator */}
          {failedAttempts > 0 && failedAttempts < 5 && !isLocked && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 flex gap-1"
            >
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    i < failedAttempts ? 'bg-danger' : 'bg-[hsl(var(--border))]'
                  }`}
                />
              ))}
            </motion.div>
          )}
        </motion.div>
        
        {/* Bottom system info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="absolute bottom-8 text-center"
        >
          <div className="flex items-center justify-center gap-4 text-xs text-foreground-subtle">
            <span className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-terminal" />
              System Online
            </span>
            <span>•</span>
            <span>WIZARD OS v1.0.0</span>
          </div>
          
          {lockReason === 'inactivity' && (
            <p className="text-foreground-subtle text-xs mt-2">
              Locked due to inactivity
            </p>
          )}
        </motion.div>
        
        {/* Loading overlay */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[hsl(var(--background)/0.5)] flex items-center justify-center"
            >
              <div className="w-8 h-8 border-2 border-terminal border-t-transparent rounded-full animate-spin" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
