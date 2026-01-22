import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface PinInputProps {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
  autoFocus?: boolean;
  showNumpad?: boolean;
}

export const PinInput = ({
  value,
  onChange,
  onComplete,
  disabled = false,
  error = false,
  autoFocus = true,
  showNumpad = false,
}: PinInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [shake, setShake] = useState(false);
  
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);
  
  useEffect(() => {
    if (error) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  }, [error]);
  
  useEffect(() => {
    if (value.length === 6 && onComplete) {
      onComplete(value);
    }
  }, [value, onComplete]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.replace(/\D/g, '').slice(0, 6);
    onChange(newValue);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && value.length === 0) {
      return;
    }
  };
  
  const handleNumpadClick = (digit: string) => {
    if (disabled) return;
    
    if (digit === 'clear') {
      onChange('');
    } else if (digit === 'back') {
      onChange(value.slice(0, -1));
    } else if (value.length < 6) {
      const newValue = value + digit;
      onChange(newValue);
    }
  };
  
  const focusInput = () => {
    inputRef.current?.focus();
  };
  
  const digits = Array(6).fill(0);
  
  return (
    <div className="flex flex-col items-center gap-8">
      {/* Hidden input for keyboard capture */}
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className="sr-only"
        autoComplete="off"
      />
      
      {/* PIN dots display */}
      <motion.div
        className={cn(
          "flex gap-4 cursor-pointer",
          shake && "animate-shake"
        )}
        onClick={focusInput}
        animate={shake ? { x: [0, -10, 10, -10, 10, 0] } : {}}
        transition={{ duration: 0.4 }}
      >
        {digits.map((_, i) => (
          <motion.div
            key={i}
            className={cn(
              "w-5 h-5 rounded-full border-2 transition-all duration-150",
              i < value.length
                ? error
                  ? "bg-danger border-danger shadow-[0_0_12px_hsl(var(--danger-glow))]"
                  : "bg-terminal border-terminal shadow-[0_0_12px_hsl(var(--terminal-glow))]"
                : i === value.length
                  ? "border-terminal-glow animate-pulse"
                  : "border-[hsl(var(--border))]"
            )}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ 
              scale: i < value.length ? 1.1 : 1, 
              opacity: 1 
            }}
            transition={{ 
              delay: i * 0.05,
              type: "spring",
              stiffness: 300,
            }}
          />
        ))}
      </motion.div>
      
      {/* Optional numpad */}
      <AnimatePresence>
        {showNumpad && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="grid grid-cols-3 gap-3"
          >
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'back'].map((key) => (
              <motion.button
                key={key}
                type="button"
                disabled={disabled}
                onClick={() => handleNumpadClick(key)}
                className={cn(
                  "w-16 h-16 rounded-lg text-xl font-mono transition-all",
                  "bg-[hsl(var(--background-surface))] border border-[hsl(var(--border))]",
                  "hover:bg-[hsl(var(--background-overlay))] hover:border-[hsl(var(--terminal-dim))]",
                  "active:scale-95",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  key === 'clear' && "text-amber text-sm",
                  key === 'back' && "text-foreground-muted text-sm"
                )}
                whileTap={{ scale: 0.95 }}
              >
                {key === 'clear' ? 'CLR' : key === 'back' ? '←' : key}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Shake animation keyframes (add to index.css if not exists)
const shakeKeyframes = `
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
  20%, 40%, 60%, 80% { transform: translateX(4px); }
}

.animate-shake {
  animation: shake 0.5s ease-in-out;
}
`;
