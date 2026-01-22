import { useEffect, forwardRef } from 'react';
import { useAuthStore, useActivityTracker } from '@/stores/authStore';
import { SetupWizard } from './SetupWizard';
import { LockScreen } from './LockScreen';
import { motion, AnimatePresence } from 'framer-motion';

interface AuthGateProps {
  children: React.ReactNode;
}

export const AuthGate = ({ children }: AuthGateProps) => {
  const { phase, checkExistingSession, isLoading, recordActivity, lockScreen } = useAuthStore();
  const { checkInactivity } = useActivityTracker();
  
  // Check for existing session on mount
  useEffect(() => {
    checkExistingSession();
  }, [checkExistingSession]);
  
  // Set up activity tracking
  useEffect(() => {
    if (phase !== 'authenticated') return;
    
    const handleActivity = () => {
      recordActivity();
    };
    
    // Track user activity
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('scroll', handleActivity);
    
    // Check for inactivity periodically
    const inactivityCheck = setInterval(checkInactivity, 30000);
    
    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      clearInterval(inactivityCheck);
    };
  }, [phase, recordActivity, checkInactivity]);
  
  // Handle ESC key to lock screen
  useEffect(() => {
    if (phase !== 'authenticated') return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC + Shift to lock (to avoid accidental locks)
      if (e.key === 'Escape' && e.shiftKey) {
        lockScreen('manual');
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, lockScreen]);
  
  // Loading/checking state
  if (phase === 'checking') {
    return <LoadingScreen />;
  }
  
  // First boot - show setup wizard
  if (phase === 'first_boot') {
    return <SetupWizard />;
  }
  
  // Locked or initial login
  if (phase === 'locked' || phase === 'login') {
    return <LockScreen />;
  }
  
  // Authenticated - show app
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="authenticated"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="h-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

const LoadingScreen = () => (
  <div className="fixed inset-0 bg-background flex items-center justify-center">
    {/* Background */}
    <div className="absolute inset-0 bg-grid opacity-10" />
    <div className="absolute inset-0 bg-noise pointer-events-none" />
    
    {/* Logo and loading */}
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center"
    >
      <motion.div
        className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-[hsl(var(--terminal-dim))] border-2 border-terminal flex items-center justify-center"
        animate={{
          boxShadow: [
            '0 0 20px hsl(160 100% 45% / 0.3)',
            '0 0 40px hsl(160 100% 45% / 0.5)',
            '0 0 20px hsl(160 100% 45% / 0.3)',
          ],
        }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <span className="font-display text-4xl font-bold text-terminal glow-terminal">W</span>
      </motion.div>
      
      <div className="w-8 h-8 mx-auto border-2 border-terminal border-t-transparent rounded-full animate-spin" />
      
      <p className="text-foreground-muted mt-4 text-sm">
        Loading system...
      </p>
    </motion.div>
  </div>
);
