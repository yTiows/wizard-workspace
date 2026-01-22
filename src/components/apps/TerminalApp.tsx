import { useRef, useEffect, useState, KeyboardEvent } from 'react';
import { useTerminalStore } from '@/stores/terminalStore';
import { useMissionStore } from '@/stores/missionStore';

export const TerminalApp = () => {
  const { 
    history, 
    executeCommand, 
    navigateHistory, 
    setCurrentInput,
    currentInput,
    getPrompt 
  } = useTerminalStore();
  
  const { recordCommand } = useMissionStore();
  
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [localInput, setLocalInput] = useState('');

  // Sync local input with store
  useEffect(() => {
    setLocalInput(currentInput);
  }, [currentInput]);

  // Auto-scroll and focus
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const handleFocus = () => {
    inputRef.current?.focus();
  };

  const handleSubmit = () => {
    if (!localInput.trim()) {
      executeCommand('');
      return;
    }
    
    const result = executeCommand(localInput);
    
    // Record for mission tracking
    if (result.exitCode !== 127) {
      recordCommand();
    }
    
    setLocalInput('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = navigateHistory('up');
      setLocalInput(prev);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = navigateHistory('down');
      setLocalInput(next);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // TODO: Tab completion
    } else if (e.key === 'c' && e.ctrlKey) {
      e.preventDefault();
      setLocalInput('');
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      executeCommand('clear');
    }
  };

  const handleInputChange = (value: string) => {
    setLocalInput(value);
    setCurrentInput(value);
  };

  const prompt = getPrompt();

  return (
    <div 
      className="h-full bg-background font-mono text-sm flex flex-col cursor-text"
      onClick={handleFocus}
    >
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-1"
      >
        {/* History */}
        {history.map((cmd) => (
          <div key={cmd.id}>
            {/* Input line */}
            <div className="flex">
              <span className="text-terminal whitespace-pre">{prompt}</span>
              <span className="text-foreground">{cmd.input}</span>
            </div>
            {/* Output */}
            {cmd.output && cmd.output !== '__CLEAR__' && cmd.output !== '__EXIT__' && (
              <pre className={`whitespace-pre-wrap ${
                cmd.exitCode === 0 ? 'text-foreground-muted' : 'text-danger'
              }`}>
                {cmd.output}
              </pre>
            )}
          </div>
        ))}

        {/* Current input line */}
        <div className="flex items-center">
          <span className="text-terminal whitespace-pre">{prompt}</span>
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={localInput}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-transparent text-foreground outline-none caret-terminal"
              autoFocus
              spellCheck={false}
              autoComplete="off"
              autoCapitalize="off"
            />
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="h-6 px-4 flex items-center justify-between text-xs text-foreground-subtle border-t border-border bg-background-elevated">
        <span>WIZARD TERMINAL v1.0</span>
        <span>Type 'help' for commands</span>
      </div>
    </div>
  );
};
