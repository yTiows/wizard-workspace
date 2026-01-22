import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { TerminalCommand, TerminalState } from '@/types/wizard';
import { useFilesystemStore } from './filesystemStore';
import { useSystemStore } from './systemStore';

interface TerminalStore extends TerminalState {
  // Command execution
  executeCommand: (input: string) => TerminalCommand;
  
  // History navigation
  navigateHistory: (direction: 'up' | 'down') => string;
  setCurrentInput: (input: string) => void;
  
  // Clear
  clearHistory: () => void;
  clearScreen: () => void;
  
  // Get prompt
  getPrompt: () => string;
}

// Command implementations
const commands: Record<string, (args: string[], fs: ReturnType<typeof useFilesystemStore.getState>) => { output: string; exitCode: number }> = {
  help: () => ({
    output: `WIZARD OS - Available Commands

Navigation:
  cd <dir>       Change directory
  pwd            Print working directory
  ls [dir]       List directory contents

File Operations:
  cat <file>     Display file contents
  touch <file>   Create empty file
  mkdir <dir>    Create directory
  rm <path>      Remove file/directory
  cp <src> <dst> Copy file
  mv <src> <dst> Move file
  echo <text>    Print text

System:
  whoami         Display current user
  hostname       Display hostname
  uname          System information
  date           Current date/time
  uptime         System uptime
  clear          Clear screen
  history        Command history
  exit           Exit terminal

Utilities:
  grep <pat> <f> Search in file
  head <file>    First 10 lines
  tail <file>    Last 10 lines
  wc <file>      Count lines/words

Type 'man <cmd>' for detailed help.`,
    exitCode: 0,
  }),

  pwd: (_args, fs) => ({
    output: fs.getCurrentDirectory()?.path || '/',
    exitCode: 0,
  }),

  cd: (args, fs) => {
    const target = args[0] || '~';
    const success = fs.setCurrentDirectory(target);
    return {
      output: success ? '' : `cd: ${target}: No such directory`,
      exitCode: success ? 0 : 1,
    };
  },

  ls: (args, fs) => {
    const showAll = args.includes('-a') || args.includes('-la') || args.includes('-al');
    const longFormat = args.includes('-l') || args.includes('-la') || args.includes('-al');
    
    const targetPath = args.filter(a => !a.startsWith('-'))[0];
    const targetNode = targetPath 
      ? fs.getNodeByPath(targetPath)
      : fs.getCurrentDirectory();

    if (!targetNode) {
      return { output: `ls: cannot access '${targetPath}': No such file or directory`, exitCode: 1 };
    }

    if (targetNode.type === 'file') {
      return { output: targetNode.name, exitCode: 0 };
    }

    const children = fs.getChildren(targetNode.id);
    let items = showAll 
      ? children 
      : children.filter(c => !c.name.startsWith('.'));

    if (longFormat) {
      const lines = items.map(item => {
        const typeChar = item.type === 'directory' ? 'd' : '-';
        const size = item.size.toString().padStart(8);
        const date = new Date(item.modified).toLocaleDateString('en-US', { 
          month: 'short', 
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
        return `${typeChar}${item.permissions} ${item.owner} ${item.group} ${size} ${date} ${item.name}`;
      });
      return { output: lines.join('\n') || '', exitCode: 0 };
    }

    const names = items.map(item => 
      item.type === 'directory' ? `${item.name}/` : item.name
    );
    return { output: names.join('  ') || '', exitCode: 0 };
  },

  cat: (args, fs) => {
    if (!args[0]) {
      return { output: 'cat: missing operand', exitCode: 1 };
    }
    
    const content = fs.readFile(args[0]);
    if (content === null) {
      return { output: `cat: ${args[0]}: No such file`, exitCode: 1 };
    }
    return { output: content, exitCode: 0 };
  },

  touch: (args, fs) => {
    if (!args[0]) {
      return { output: 'touch: missing operand', exitCode: 1 };
    }
    
    const path = fs.resolvePath(args[0]);
    const existing = fs.getNodeByPath(path);
    
    if (existing) {
      return { output: '', exitCode: 0 }; // Just update timestamp
    }
    
    const parentPath = fs.getParentPath(path);
    const name = path.split('/').pop() || '';
    
    const result = fs.createFile(name, parentPath);
    return {
      output: result ? '' : `touch: cannot create '${args[0]}'`,
      exitCode: result ? 0 : 1,
    };
  },

  mkdir: (args, fs) => {
    if (!args[0]) {
      return { output: 'mkdir: missing operand', exitCode: 1 };
    }
    
    const createParents = args.includes('-p');
    const targetPaths = args.filter(a => !a.startsWith('-'));
    
    for (const target of targetPaths) {
      const path = fs.resolvePath(target);
      const parentPath = fs.getParentPath(path);
      const name = path.split('/').pop() || '';
      
      const result = fs.createDirectory(name, parentPath);
      if (!result && !createParents) {
        return { output: `mkdir: cannot create directory '${target}'`, exitCode: 1 };
      }
    }
    
    return { output: '', exitCode: 0 };
  },

  rm: (args, fs) => {
    if (!args[0]) {
      return { output: 'rm: missing operand', exitCode: 1 };
    }
    
    const recursive = args.includes('-r') || args.includes('-rf');
    const targets = args.filter(a => !a.startsWith('-'));
    
    for (const target of targets) {
      const node = fs.getNodeByPath(target);
      if (!node) {
        return { output: `rm: cannot remove '${target}': No such file or directory`, exitCode: 1 };
      }
      
      if (node.type === 'directory' && !recursive) {
        return { output: `rm: cannot remove '${target}': Is a directory`, exitCode: 1 };
      }
      
      // Damage integrity for dangerous removals
      if (node.path.startsWith('/system') || node.path === '/home/user') {
        useSystemStore.getState().updateIntegrity(-25);
      }
      
      fs.deleteNode(target);
    }
    
    return { output: '', exitCode: 0 };
  },

  echo: (args) => {
    const text = args.join(' ').replace(/^["']|["']$/g, '');
    return { output: text, exitCode: 0 };
  },

  whoami: () => ({
    output: useSystemStore.getState().user?.username || 'user',
    exitCode: 0,
  }),

  hostname: () => ({
    output: 'wizard-vm',
    exitCode: 0,
  }),

  uname: (args) => {
    if (args.includes('-a')) {
      return { output: 'WizardOS 1.0.0 wizard-vm x86_64 GNU/Linux', exitCode: 0 };
    }
    return { output: 'WizardOS', exitCode: 0 };
  },

  date: () => ({
    output: new Date().toString(),
    exitCode: 0,
  }),

  uptime: () => {
    const bootTime = useSystemStore.getState().systemState.boot_time;
    const uptime = Math.floor((Date.now() - new Date(bootTime).getTime()) / 1000);
    const hours = Math.floor(uptime / 3600);
    const mins = Math.floor((uptime % 3600) / 60);
    const secs = uptime % 60;
    return { 
      output: `up ${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`, 
      exitCode: 0 
    };
  },

  clear: () => ({ output: '__CLEAR__', exitCode: 0 }),

  history: () => {
    const store = useTerminalStore.getState();
    const lines = store.commandHistory.map((cmd, i) => `  ${i + 1}  ${cmd}`);
    return { output: lines.join('\n'), exitCode: 0 };
  },

  exit: () => ({ output: '__EXIT__', exitCode: 0 }),

  head: (args, fs) => {
    const lines = parseInt(args.find(a => a.startsWith('-'))?.slice(1) || '10');
    const file = args.find(a => !a.startsWith('-'));
    
    if (!file) return { output: 'head: missing operand', exitCode: 1 };
    
    const content = fs.readFile(file);
    if (content === null) return { output: `head: ${file}: No such file`, exitCode: 1 };
    
    return { output: content.split('\n').slice(0, lines).join('\n'), exitCode: 0 };
  },

  tail: (args, fs) => {
    const lines = parseInt(args.find(a => a.startsWith('-'))?.slice(1) || '10');
    const file = args.find(a => !a.startsWith('-'));
    
    if (!file) return { output: 'tail: missing operand', exitCode: 1 };
    
    const content = fs.readFile(file);
    if (content === null) return { output: `tail: ${file}: No such file`, exitCode: 1 };
    
    return { output: content.split('\n').slice(-lines).join('\n'), exitCode: 0 };
  },

  wc: (args, fs) => {
    const file = args[0];
    if (!file) return { output: 'wc: missing operand', exitCode: 1 };
    
    const content = fs.readFile(file);
    if (content === null) return { output: `wc: ${file}: No such file`, exitCode: 1 };
    
    const lines = content.split('\n').length;
    const words = content.split(/\s+/).filter(Boolean).length;
    const chars = content.length;
    
    return { output: `  ${lines}   ${words}  ${chars} ${file}`, exitCode: 0 };
  },

  grep: (args, fs) => {
    if (args.length < 2) return { output: 'grep: missing pattern or file', exitCode: 1 };
    
    const pattern = args[0];
    const file = args[1];
    
    const content = fs.readFile(file);
    if (content === null) return { output: `grep: ${file}: No such file`, exitCode: 1 };
    
    try {
      const regex = new RegExp(pattern, 'gi');
      const matches = content.split('\n').filter(line => regex.test(line));
      return { output: matches.join('\n'), exitCode: matches.length > 0 ? 0 : 1 };
    } catch {
      return { output: `grep: invalid pattern '${pattern}'`, exitCode: 2 };
    }
  },

  man: (args) => {
    const cmd = args[0];
    if (!cmd) return { output: 'What manual page do you want?', exitCode: 1 };
    
    if (!commands[cmd]) {
      return { output: `No manual entry for ${cmd}`, exitCode: 1 };
    }
    
    return { output: `${cmd.toUpperCase()}(1) - Type 'help' for command list`, exitCode: 0 };
  },

  // Fake dangerous commands that damage integrity
  'rm -rf /': () => {
    useSystemStore.getState().updateIntegrity(-100);
    return { output: 'rm: destroying filesystem...', exitCode: 0 };
  },
};

export const useTerminalStore = create<TerminalStore>()(
  persist(
    (set, get) => ({
      history: [],
      commandHistory: [],
      historyIndex: -1,
      currentInput: '',
      workingDirectory: '/home/user',
      environment: {
        HOME: '/home/user',
        USER: 'user',
        SHELL: '/bin/bash',
        PATH: '/usr/local/bin:/usr/bin:/bin',
        PS1: '\\u@wizard:\\w\\$ ',
      },
      aliases: {
        ll: 'ls -la',
        la: 'ls -a',
        cls: 'clear',
        c: 'clear',
      },

      executeCommand: (rawInput: string) => {
        const fs = useFilesystemStore.getState();
        const input = rawInput.trim();
        
        // Expand aliases
        const firstWord = input.split(/\s+/)[0];
        const alias = get().aliases[firstWord];
        const expandedInput = alias 
          ? input.replace(firstWord, alias)
          : input;
        
        // Parse command and args
        const parts = expandedInput.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
        const cmd = parts[0]?.toLowerCase() || '';
        const args = parts.slice(1).map(a => a.replace(/^"|"$/g, ''));
        
        let output = '';
        let exitCode = 127;
        
        if (!cmd) {
          output = '';
          exitCode = 0;
        } else if (commands[cmd]) {
          const result = commands[cmd](args, fs);
          output = result.output;
          exitCode = result.exitCode;
        } else {
          output = `${cmd}: command not found`;
          exitCode = 127;
        }
        
        const command: TerminalCommand = {
          id: uuidv4(),
          input: rawInput,
          output,
          exitCode,
          timestamp: new Date(),
          workingDirectory: fs.getCurrentDirectory()?.path || '/',
        };
        
        // Update stats
        if (cmd) {
          useSystemStore.getState().updateStats({
            total_commands: (useSystemStore.getState().user?.stats.total_commands || 0) + 1,
          });
        }
        
        set(state => ({
          history: output === '__CLEAR__' 
            ? [] 
            : [...state.history, command],
          commandHistory: cmd 
            ? [...state.commandHistory.filter(c => c !== rawInput), rawInput]
            : state.commandHistory,
          historyIndex: -1,
          currentInput: '',
          workingDirectory: fs.getCurrentDirectory()?.path || '/',
        }));
        
        return command;
      },

      navigateHistory: (direction: 'up' | 'down') => {
        const { commandHistory, historyIndex, currentInput } = get();
        
        if (commandHistory.length === 0) return currentInput;
        
        let newIndex = historyIndex;
        
        if (direction === 'up') {
          newIndex = historyIndex === -1 
            ? commandHistory.length - 1 
            : Math.max(0, historyIndex - 1);
        } else {
          newIndex = historyIndex === -1 
            ? -1 
            : Math.min(commandHistory.length - 1, historyIndex + 1);
          
          if (historyIndex === commandHistory.length - 1) {
            set({ historyIndex: -1, currentInput: '' });
            return '';
          }
        }
        
        const newInput = commandHistory[newIndex] || '';
        set({ historyIndex: newIndex, currentInput: newInput });
        return newInput;
      },

      setCurrentInput: (input: string) => {
        set({ currentInput: input, historyIndex: -1 });
      },

      clearHistory: () => {
        set({ history: [], commandHistory: [] });
      },

      clearScreen: () => {
        set({ history: [] });
      },

      getPrompt: () => {
        const user = useSystemStore.getState().user?.username || 'user';
        const fs = useFilesystemStore.getState();
        const cwd = fs.getCurrentDirectory()?.path || '/';
        const displayPath = cwd.replace('/home/user', '~');
        return `${user}@wizard:${displayPath}$ `;
      },
    }),
    {
      name: 'wizard-terminal',
      partialize: (state) => ({
        commandHistory: state.commandHistory,
        aliases: state.aliases,
        environment: state.environment,
      }),
    }
  )
);
