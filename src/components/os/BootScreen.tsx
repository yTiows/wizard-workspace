import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useSystemStore } from '@/stores/systemStore';

const BOOT_LINES = [
  'WIZARD OS v1.0.0',
  'Copyright (c) 2026 Wizard Systems',
  '',
  '[    0.000000] Initializing hardware...',
  '[    0.012847] CPU: 4 cores detected',
  '[    0.024912] Memory: 8192 MB available',
  '[    0.038291] Storage: Virtual disk initialized',
  '[    0.051823] Security: Framework loaded',
  '',
  '[    0.100000] Loading kernel modules...',
  '[    0.142891] net: Network stack initialized',
  '[    0.178234] fs: Mounting filesystems...',
  '[    0.201847] fs: /home mounted',
  '[    0.234891] fs: /data mounted',
  '[    0.267234] fs: /missions mounted',
  '',
  '[    0.300000] Starting system services...',
  '[    0.342891] sshd: Disabled (controlled environment)',
  '[    0.378234] wizard-core: Mission engine online',
  '[    0.401847] wizard-fs: Filesystem ready',
  '[    0.434891] wizard-auth: Authentication ready',
  '',
  '[    0.500000] System initialization complete.',
  '[    0.512847] Starting desktop environment...',
];

export const BootScreen = () => {
  const { advanceBootPhase, completeBoot, bootState } = useSystemStore();
  const [displayedLines, setDisplayedLines] = useState<string[]>([]);
  const [currentLine, setCurrentLine] = useState(0);

  useEffect(() => {
    if (currentLine < BOOT_LINES.length) {
      const timer = setTimeout(() => {
        setDisplayedLines(prev => [...prev, BOOT_LINES[currentLine]]);
        setCurrentLine(prev => prev + 1);
        
        // Advance boot phases at certain points
        if (currentLine === 4) advanceBootPhase(); // BIOS
        if (currentLine === 10) advanceBootPhase(); // Kernel
        if (currentLine === 16) advanceBootPhase(); // Services
      }, 50 + Math.random() * 30);
      
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        advanceBootPhase(); // Desktop phase
        completeBoot();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentLine, advanceBootPhase, completeBoot]);

  return (
    <div className="fixed inset-0 bg-background overflow-hidden">
      {/* Scanlines */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px]" />
      </div>

      {/* CRT glow effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.3)_100%)]" />
      </div>

      <div className="relative h-full flex flex-col p-6 font-mono text-sm overflow-hidden">
        {/* Boot text */}
        <motion.div 
          className="flex-1 overflow-hidden"
        >
          <div className="space-y-0.5">
            {displayedLines.map((line, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.1 }}
                className={`text-terminal ${line.startsWith('[') ? 'text-terminal-glow' : ''}`}
              >
                {line || '\u00A0'}
              </motion.div>
            ))}
            
            {currentLine < BOOT_LINES.length && (
              <span className="inline-block w-2 h-4 bg-terminal animate-pulse ml-1" />
            )}
          </div>
        </motion.div>

        {/* Progress bar */}
        <div className="mt-auto pt-4">
          <div className="flex items-center justify-between text-xs text-foreground-muted mb-2">
            <span>SYSTEM BOOT</span>
            <span>{Math.round(bootState.progress)}%</span>
          </div>
          <div className="h-1 bg-background-surface rounded overflow-hidden">
            <motion.div
              className="h-full bg-terminal"
              initial={{ width: 0 }}
              animate={{ width: `${bootState.progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
