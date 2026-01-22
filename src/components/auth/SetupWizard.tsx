import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore, validateUsername, validatePin, SetupStep } from '@/stores/authStore';
import { PinInput } from './PinInput';
import { cn } from '@/lib/utils';

const INIT_MESSAGES = [
  'Preparing environment...',
  'Initializing filesystem...',
  'Generating user workspace...',
  'Mounting directories...',
  'Loading system modules...',
  'Configuring security framework...',
  'Starting core services...',
  'Environment ready.',
];

export const SetupWizard = () => {
  const {
    setupStep,
    setSetupStep,
    setupUsername,
    setSetupUsername,
    setupPin,
    setSetupPin,
    setupPinConfirm,
    setSetupPinConfirm,
    createAccount,
    error,
    setError,
    isLoading,
  } = useAuthStore();
  
  const [localError, setLocalError] = useState<string | null>(null);
  const [initProgress, setInitProgress] = useState(0);
  const [initMessages, setInitMessages] = useState<string[]>([]);
  
  // Clear errors when changing steps
  useEffect(() => {
    setLocalError(null);
    setError(null);
  }, [setupStep, setError]);
  
  // Handle initialization animation
  useEffect(() => {
    if (setupStep === 'initializing') {
      let messageIndex = 0;
      const interval = setInterval(() => {
        if (messageIndex < INIT_MESSAGES.length) {
          setInitMessages(prev => [...prev, INIT_MESSAGES[messageIndex]]);
          setInitProgress(((messageIndex + 1) / INIT_MESSAGES.length) * 100);
          messageIndex++;
        } else {
          clearInterval(interval);
          // Trigger account creation
          setTimeout(async () => {
            const success = await createAccount();
            if (!success) {
              setSetupStep('username');
            }
          }, 500);
        }
      }, 400);
      
      return () => clearInterval(interval);
    }
  }, [setupStep, createAccount, setSetupStep]);
  
  const handleUsernameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateUsername(setupUsername);
    if (!validation.valid) {
      setLocalError(validation.error || 'Invalid username');
      return;
    }
    setSetupStep('pin_create');
  };
  
  const handlePinCreate = (pin: string) => {
    setSetupPin(pin);
    if (pin.length === 6) {
      const validation = validatePin(pin);
      if (!validation.valid) {
        setLocalError(validation.error || 'Invalid PIN');
        setSetupPin('');
        return;
      }
      setSetupStep('pin_confirm');
    }
  };
  
  const handlePinConfirm = (pin: string) => {
    setSetupPinConfirm(pin);
    if (pin.length === 6) {
      if (pin !== setupPin) {
        setLocalError('PINs do not match');
        setSetupPinConfirm('');
        return;
      }
      setSetupStep('avatar');
    }
  };
  
  const handleAvatarContinue = () => {
    setInitMessages([]);
    setInitProgress(0);
    setSetupStep('initializing');
  };
  
  const displayError = localError || error;
  
  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-grid opacity-20" />
      <div className="absolute inset-0 bg-noise pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,hsl(var(--background))_70%)]" />
      
      {/* Scanlines */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px]" />
      </div>
      
      <AnimatePresence mode="wait">
        {setupStep === 'welcome' && (
          <WelcomeStep key="welcome" onContinue={() => setSetupStep('username')} />
        )}
        
        {setupStep === 'username' && (
          <UsernameStep
            key="username"
            username={setupUsername}
            onUsernameChange={setSetupUsername}
            onSubmit={handleUsernameSubmit}
            error={displayError}
            isLoading={isLoading}
          />
        )}
        
        {setupStep === 'pin_create' && (
          <PinCreateStep
            key="pin_create"
            pin={setupPin}
            onPinChange={handlePinCreate}
            error={displayError}
            onBack={() => setSetupStep('username')}
          />
        )}
        
        {setupStep === 'pin_confirm' && (
          <PinConfirmStep
            key="pin_confirm"
            pin={setupPinConfirm}
            onPinChange={handlePinConfirm}
            error={displayError}
            onBack={() => {
              setSetupPin('');
              setSetupStep('pin_create');
            }}
          />
        )}
        
        {setupStep === 'avatar' && (
          <AvatarStep
            key="avatar"
            username={setupUsername}
            onContinue={handleAvatarContinue}
          />
        )}
        
        {setupStep === 'initializing' && (
          <InitializingStep
            key="initializing"
            messages={initMessages}
            progress={initProgress}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Welcome Step
const WelcomeStep = ({ onContinue }: { onContinue: () => void }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.95 }}
    className="text-center max-w-lg px-8"
  >
    {/* Wizard Logo */}
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="mb-12"
    >
      <motion.div
        className="w-32 h-32 mx-auto mb-6 rounded-2xl bg-[hsl(var(--terminal-dim))] border-2 border-terminal flex items-center justify-center"
        animate={{
          boxShadow: [
            '0 0 20px hsl(160 100% 45% / 0.3)',
            '0 0 40px hsl(160 100% 45% / 0.5)',
            '0 0 20px hsl(160 100% 45% / 0.3)',
          ],
        }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <span className="font-display text-5xl font-bold text-terminal glow-terminal">W</span>
      </motion.div>
      
      <h1 className="font-display text-4xl font-bold text-terminal glow-terminal tracking-wider">
        WIZARD
      </h1>
      <p className="text-foreground-muted mt-2 tracking-widest text-sm">
        CONTROLLED ENVIRONMENT
      </p>
    </motion.div>
    
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.6 }}
    >
      <p className="text-foreground-muted mb-8 text-lg">
        Welcome to your secure workspace.
        <br />
        Let's set up your operator credentials.
      </p>
      
      <button
        onClick={onContinue}
        className="btn-terminal py-4 px-12 font-display text-lg uppercase tracking-wider"
      >
        Begin Setup
      </button>
    </motion.div>
    
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.8 }}
      className="text-foreground-subtle text-xs mt-12"
    >
      WIZARD OS v1.0.0 • Build 2026.01
    </motion.p>
  </motion.div>
);

// Username Step
const UsernameStep = ({
  username,
  onUsernameChange,
  onSubmit,
  error,
  isLoading,
}: {
  username: string;
  onUsernameChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  error: string | null;
  isLoading: boolean;
}) => (
  <motion.div
    initial={{ opacity: 0, x: 50 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -50 }}
    className="w-full max-w-md px-8"
  >
    <div className="text-center mb-8">
      <h2 className="font-display text-2xl font-bold text-foreground tracking-wide">
        CREATE OPERATOR ID
      </h2>
      <p className="text-foreground-muted mt-2">
        This will be your identity within the system
      </p>
    </div>
    
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="bg-[hsl(var(--background-surface))] border border-[hsl(var(--border))] rounded-lg p-6">
        <label className="block text-xs text-foreground-subtle mb-3 uppercase tracking-wider">
          Username
        </label>
        <input
          type="text"
          value={username}
          onChange={(e) => onUsernameChange(e.target.value.toLowerCase())}
          className={cn(
            "w-full bg-background border rounded px-4 py-4 text-xl font-mono",
            "focus:outline-none transition-colors",
            error
              ? "border-danger focus:border-danger"
              : "border-[hsl(var(--border))] focus:border-terminal focus:ring-1 focus:ring-terminal"
          )}
          placeholder="operator"
          autoFocus
          disabled={isLoading}
          maxLength={20}
        />
        
        <p className="text-xs text-foreground-subtle mt-3">
          3-20 characters • lowercase letters and numbers only
        </p>
        
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="text-danger text-sm mt-3"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
      
      <button
        type="submit"
        disabled={!username || isLoading}
        className="w-full btn-terminal py-4 font-display uppercase tracking-wider disabled:opacity-50"
      >
        Continue
      </button>
    </form>
  </motion.div>
);

// PIN Create Step
const PinCreateStep = ({
  pin,
  onPinChange,
  error,
  onBack,
}: {
  pin: string;
  onPinChange: (pin: string) => void;
  error: string | null;
  onBack: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0, x: 50 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -50 }}
    className="w-full max-w-md px-8 text-center"
  >
    <div className="mb-12">
      <h2 className="font-display text-2xl font-bold text-foreground tracking-wide">
        CREATE ACCESS CODE
      </h2>
      <p className="text-foreground-muted mt-2">
        Enter a 6-digit PIN to secure your session
      </p>
    </div>
    
    <div className="mb-8">
      <PinInput
        value={pin}
        onChange={onPinChange}
        error={!!error}
        autoFocus
      />
    </div>
    
    <AnimatePresence>
      {error && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="text-danger text-sm mb-6"
        >
          {error}
        </motion.p>
      )}
    </AnimatePresence>
    
    <p className="text-foreground-subtle text-xs mb-8">
      Avoid simple sequences or repeating digits
    </p>
    
    <button
      onClick={onBack}
      className="text-foreground-muted hover:text-foreground text-sm"
    >
      ← Back
    </button>
  </motion.div>
);

// PIN Confirm Step
const PinConfirmStep = ({
  pin,
  onPinChange,
  error,
  onBack,
}: {
  pin: string;
  onPinChange: (pin: string) => void;
  error: string | null;
  onBack: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0, x: 50 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -50 }}
    className="w-full max-w-md px-8 text-center"
  >
    <div className="mb-12">
      <h2 className="font-display text-2xl font-bold text-foreground tracking-wide">
        CONFIRM ACCESS CODE
      </h2>
      <p className="text-foreground-muted mt-2">
        Re-enter your PIN to verify
      </p>
    </div>
    
    <div className="mb-8">
      <PinInput
        value={pin}
        onChange={onPinChange}
        error={!!error}
        autoFocus
      />
    </div>
    
    <AnimatePresence>
      {error && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="text-danger text-sm mb-6"
        >
          {error}
        </motion.p>
      )}
    </AnimatePresence>
    
    <button
      onClick={onBack}
      className="text-foreground-muted hover:text-foreground text-sm"
    >
      ← Start over
    </button>
  </motion.div>
);

// Avatar Step
const AvatarStep = ({
  username,
  onContinue,
}: {
  username: string;
  onContinue: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0, x: 50 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -50 }}
    className="w-full max-w-md px-8 text-center"
  >
    <div className="mb-8">
      <h2 className="font-display text-2xl font-bold text-foreground tracking-wide">
        OPERATOR PROFILE
      </h2>
    </div>
    
    {/* Default Avatar */}
    <motion.div
      className="w-40 h-40 mx-auto mb-6 rounded-full bg-[hsl(var(--terminal-dim))] border-4 border-terminal flex items-center justify-center overflow-hidden"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 200 }}
    >
      <span className="font-display text-6xl font-bold text-terminal glow-terminal">
        {username.charAt(0).toUpperCase()}
      </span>
    </motion.div>
    
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
    >
      <p className="font-mono text-2xl text-terminal mb-2">{username}</p>
      <p className="text-foreground-subtle text-sm mb-8">
        You can customize your profile picture later in Settings
      </p>
      
      <button
        onClick={onContinue}
        className="btn-terminal py-4 px-12 font-display uppercase tracking-wider"
      >
        Initialize Environment
      </button>
    </motion.div>
  </motion.div>
);

// Initializing Step
const InitializingStep = ({
  messages,
  progress,
}: {
  messages: string[];
  progress: number;
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="w-full max-w-xl px-8"
  >
    <div className="text-center mb-8">
      <h2 className="font-display text-2xl font-bold text-terminal glow-terminal tracking-wide">
        INITIALIZING ENVIRONMENT
      </h2>
    </div>
    
    {/* Terminal-style log */}
    <div className="bg-[hsl(var(--background-surface))] border border-[hsl(var(--border))] rounded-lg p-4 font-mono text-sm h-64 overflow-hidden">
      <div className="space-y-1">
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-terminal"
          >
            <span className="text-foreground-subtle">[{String(i).padStart(2, '0')}]</span>{' '}
            {msg}
          </motion.div>
        ))}
        
        {/* Cursor */}
        {progress < 100 && (
          <span className="inline-block w-2 h-4 bg-terminal animate-pulse" />
        )}
      </div>
    </div>
    
    {/* Progress bar */}
    <div className="mt-6">
      <div className="flex justify-between text-xs text-foreground-muted mb-2">
        <span>Progress</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div className="h-1.5 bg-[hsl(var(--background-elevated))] rounded overflow-hidden">
        <motion.div
          className="h-full bg-terminal"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </div>
  </motion.div>
);
