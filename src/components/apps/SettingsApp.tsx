import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import { useSystemStore } from '@/stores/systemStore';
import { cn } from '@/lib/utils';

interface SettingsAppProps {
  windowId: string;
}

type SettingsTab = 'account' | 'appearance' | 'security' | 'system' | 'about';

export const SettingsApp = ({ windowId }: SettingsAppProps) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('account');
  const { session, lockTimeoutMinutes, logout } = useAuthStore();
  const { systemState, user } = useSystemStore();
  
  const tabs: { id: SettingsTab; label: string; icon: string }[] = [
    { id: 'account', label: 'Account', icon: '👤' },
    { id: 'appearance', label: 'Appearance', icon: '🎨' },
    { id: 'security', label: 'Security', icon: '🔒' },
    { id: 'system', label: 'System', icon: '⚙️' },
    { id: 'about', label: 'About', icon: 'ℹ️' },
  ];
  
  return (
    <div className="h-full flex bg-background">
      {/* Sidebar */}
      <div className="w-48 border-r border-[hsl(var(--border))] bg-[hsl(var(--background-surface))] p-2">
        <div className="space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors",
                activeTab === tab.id
                  ? "bg-terminal/20 text-terminal"
                  : "hover:bg-[hsl(var(--background-elevated))] text-foreground-muted"
              )}
            >
              <span>{tab.icon}</span>
              <span className="text-sm">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {activeTab === 'account' && (
          <AccountSettings session={session} onLogout={logout} />
        )}
        
        {activeTab === 'appearance' && (
          <AppearanceSettings />
        )}
        
        {activeTab === 'security' && (
          <SecuritySettings lockTimeout={lockTimeoutMinutes} />
        )}
        
        {activeTab === 'system' && (
          <SystemSettings systemState={systemState} />
        )}
        
        {activeTab === 'about' && (
          <AboutSettings />
        )}
      </div>
    </div>
  );
};

// Account Settings
const AccountSettings = ({ 
  session, 
  onLogout 
}: { 
  session: { username?: string; rank?: string; xp?: number; created_at?: string } | null;
  onLogout: () => void;
}) => {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl text-terminal mb-1">Account</h2>
        <p className="text-foreground-muted text-sm">Manage your operator profile</p>
      </div>
      
      {/* Profile section */}
      <div className="bg-[hsl(var(--background-surface))] border border-[hsl(var(--border))] rounded-lg p-6">
        <div className="flex items-center gap-6">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-full bg-[hsl(var(--terminal-dim))] border-4 border-terminal flex items-center justify-center">
            <span className="font-display text-4xl font-bold text-terminal">
              {session?.username?.charAt(0).toUpperCase() || 'W'}
            </span>
          </div>
          
          <div>
            <h3 className="font-mono text-xl text-foreground">{session?.username}</h3>
            <p className="text-foreground-muted text-sm mt-1">
              Rank: <span className="text-terminal">{session?.rank || 'Initiate'}</span>
            </p>
            <p className="text-foreground-subtle text-xs mt-2">
              Account created: {session?.created_at ? new Date(session.created_at).toLocaleDateString() : 'Unknown'}
            </p>
          </div>
        </div>
        
        <button className="mt-6 px-4 py-2 rounded border border-[hsl(var(--border))] hover:bg-[hsl(var(--background-elevated))] text-sm transition-colors">
          Change Avatar
        </button>
      </div>
      
      {/* Stats */}
      <div className="bg-[hsl(var(--background-surface))] border border-[hsl(var(--border))] rounded-lg p-6">
        <h3 className="font-display text-lg text-terminal mb-4">Statistics</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-foreground-subtle text-xs uppercase tracking-wider">XP</p>
            <p className="text-2xl font-mono text-terminal">{session?.xp || 0}</p>
          </div>
          <div>
            <p className="text-foreground-subtle text-xs uppercase tracking-wider">Rank</p>
            <p className="text-lg font-mono text-foreground">{session?.rank || 'Initiate'}</p>
          </div>
        </div>
      </div>
      
      {/* Danger zone */}
      <div className="bg-[hsl(var(--background-surface))] border border-danger/30 rounded-lg p-6">
        <h3 className="font-display text-lg text-danger mb-4">Danger Zone</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-foreground">Sign Out</p>
              <p className="text-foreground-subtle text-xs">End your current session</p>
            </div>
            <button 
              onClick={onLogout}
              className="px-4 py-2 rounded border border-amber text-amber hover:bg-amber/10 text-sm transition-colors"
            >
              Sign Out
            </button>
          </div>
          
          <div className="flex items-center justify-between pt-4 border-t border-[hsl(var(--border))]">
            <div>
              <p className="text-foreground">Delete Account</p>
              <p className="text-foreground-subtle text-xs">Permanently delete all data</p>
            </div>
            <button className="px-4 py-2 rounded border border-danger text-danger hover:bg-danger/10 text-sm transition-colors">
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Appearance Settings
const AppearanceSettings = () => {
  const [selectedWallpaper, setSelectedWallpaper] = useState('default');
  
  const wallpapers = [
    { id: 'default', name: 'Default Grid', preview: 'bg-grid' },
    { id: 'matrix', name: 'Matrix Rain', preview: 'bg-terminal/10' },
    { id: 'cyber', name: 'Cyber Dark', preview: 'bg-cyber/10' },
    { id: 'minimal', name: 'Minimal', preview: 'bg-background' },
  ];
  
  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl text-terminal mb-1">Appearance</h2>
        <p className="text-foreground-muted text-sm">Customize your workspace</p>
      </div>
      
      {/* Wallpaper */}
      <div className="bg-[hsl(var(--background-surface))] border border-[hsl(var(--border))] rounded-lg p-6">
        <h3 className="font-display text-lg text-terminal mb-4">Wallpaper</h3>
        
        <div className="grid grid-cols-4 gap-4">
          {wallpapers.map((wp) => (
            <motion.button
              key={wp.id}
              onClick={() => setSelectedWallpaper(wp.id)}
              className={cn(
                "aspect-video rounded-lg overflow-hidden border-2 transition-colors",
                selectedWallpaper === wp.id ? 'border-terminal' : 'border-transparent hover:border-[hsl(var(--border))]'
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className={cn("w-full h-full", wp.preview)} />
            </motion.button>
          ))}
        </div>
      </div>
      
      {/* Theme options */}
      <div className="bg-[hsl(var(--background-surface))] border border-[hsl(var(--border))] rounded-lg p-6">
        <h3 className="font-display text-lg text-terminal mb-4">Theme Options</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-foreground">Scanlines</p>
              <p className="text-foreground-subtle text-xs">CRT-style scanline effect</p>
            </div>
            <ToggleSwitch defaultChecked />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-foreground">Noise Overlay</p>
              <p className="text-foreground-subtle text-xs">Subtle grain texture</p>
            </div>
            <ToggleSwitch defaultChecked />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-foreground">Glow Effects</p>
              <p className="text-foreground-subtle text-xs">Neon glow on terminal elements</p>
            </div>
            <ToggleSwitch defaultChecked />
          </div>
        </div>
      </div>
    </div>
  );
};

// Security Settings
const SecuritySettings = ({ lockTimeout }: { lockTimeout: number }) => {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl text-terminal mb-1">Security</h2>
        <p className="text-foreground-muted text-sm">Protect your workspace</p>
      </div>
      
      {/* PIN */}
      <div className="bg-[hsl(var(--background-surface))] border border-[hsl(var(--border))] rounded-lg p-6">
        <h3 className="font-display text-lg text-terminal mb-4">Access Code</h3>
        
        <p className="text-foreground-muted text-sm mb-4">
          Your 6-digit PIN protects access to your workspace
        </p>
        
        <button className="px-4 py-2 rounded bg-terminal text-background font-medium text-sm hover:bg-terminal/90 transition-colors">
          Change PIN
        </button>
      </div>
      
      {/* Auto-lock */}
      <div className="bg-[hsl(var(--background-surface))] border border-[hsl(var(--border))] rounded-lg p-6">
        <h3 className="font-display text-lg text-terminal mb-4">Auto-Lock</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-foreground">Lock on inactivity</p>
              <p className="text-foreground-subtle text-xs">Auto-lock after idle time</p>
            </div>
            <ToggleSwitch defaultChecked />
          </div>
          
          <div>
            <label className="text-foreground-muted text-sm">Lock timeout</label>
            <select className="mt-2 w-full bg-background border border-[hsl(var(--border))] rounded px-3 py-2 text-sm focus:outline-none focus:border-terminal">
              <option value="1">1 minute</option>
              <option value="5" selected={lockTimeout === 5}>5 minutes</option>
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="60">1 hour</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Sessions */}
      <div className="bg-[hsl(var(--background-surface))] border border-[hsl(var(--border))] rounded-lg p-6">
        <h3 className="font-display text-lg text-terminal mb-4">Active Sessions</h3>
        
        <div className="bg-background rounded p-4 border border-[hsl(var(--border))]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-terminal" />
              <div>
                <p className="text-foreground text-sm">Current Session</p>
                <p className="text-foreground-subtle text-xs">This browser</p>
              </div>
            </div>
            <span className="text-xs text-foreground-subtle">Active now</span>
          </div>
        </div>
        
        <button className="mt-4 px-4 py-2 rounded border border-danger text-danger hover:bg-danger/10 text-sm transition-colors">
          Sign out all other sessions
        </button>
      </div>
    </div>
  );
};

// System Settings
const SystemSettings = ({ systemState }: { systemState: { machine_state: string; integrity: number; network_connected: boolean; snapshots: unknown[] } }) => {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl text-terminal mb-1">System</h2>
        <p className="text-foreground-muted text-sm">Environment configuration</p>
      </div>
      
      {/* Status */}
      <div className="bg-[hsl(var(--background-surface))] border border-[hsl(var(--border))] rounded-lg p-6">
        <h3 className="font-display text-lg text-terminal mb-4">System Status</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-foreground-subtle text-xs uppercase tracking-wider">Machine State</p>
            <p className="text-lg font-mono text-terminal capitalize">{systemState.machine_state}</p>
          </div>
          <div>
            <p className="text-foreground-subtle text-xs uppercase tracking-wider">Integrity</p>
            <p className="text-lg font-mono text-foreground">{systemState.integrity}%</p>
          </div>
          <div>
            <p className="text-foreground-subtle text-xs uppercase tracking-wider">Network</p>
            <p className="text-lg font-mono text-foreground">
              {systemState.network_connected ? 'Connected' : 'Offline'}
            </p>
          </div>
          <div>
            <p className="text-foreground-subtle text-xs uppercase tracking-wider">Snapshots</p>
            <p className="text-lg font-mono text-foreground">{systemState.snapshots.length}</p>
          </div>
        </div>
      </div>
      
      {/* Data */}
      <div className="bg-[hsl(var(--background-surface))] border border-[hsl(var(--border))] rounded-lg p-6">
        <h3 className="font-display text-lg text-terminal mb-4">Data Management</h3>
        
        <div className="space-y-4">
          <button className="w-full flex items-center justify-between px-4 py-3 rounded border border-[hsl(var(--border))] hover:bg-[hsl(var(--background-elevated))] transition-colors">
            <div className="text-left">
              <p className="text-foreground">Export Data</p>
              <p className="text-foreground-subtle text-xs">Download all projects and files</p>
            </div>
            <span>📥</span>
          </button>
          
          <button className="w-full flex items-center justify-between px-4 py-3 rounded border border-amber/30 hover:bg-amber/10 transition-colors">
            <div className="text-left">
              <p className="text-amber">Reset Environment</p>
              <p className="text-foreground-subtle text-xs">Clear all files and restore defaults</p>
            </div>
            <span>🔄</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// About Settings
const AboutSettings = () => {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl text-terminal mb-1">About</h2>
        <p className="text-foreground-muted text-sm">System information</p>
      </div>
      
      {/* Logo and version */}
      <div className="bg-[hsl(var(--background-surface))] border border-[hsl(var(--border))] rounded-lg p-8 text-center">
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
        
        <h1 className="font-display text-3xl font-bold text-terminal glow-terminal tracking-wider">
          WIZARD
        </h1>
        <p className="text-foreground-muted mt-2 tracking-widest text-sm">
          CONTROLLED ENVIRONMENT
        </p>
        
        <p className="text-foreground-subtle text-sm mt-6 font-mono">
          Version 1.0.0 • Build 2026.01
        </p>
      </div>
      
      {/* Legal */}
      <div className="bg-[hsl(var(--background-surface))] border border-[hsl(var(--border))] rounded-lg p-6">
        <h3 className="font-display text-lg text-terminal mb-4">Legal</h3>
        
        <div className="space-y-2">
          <a href="#" className="block text-foreground-muted hover:text-terminal text-sm transition-colors">
            Terms of Service
          </a>
          <a href="#" className="block text-foreground-muted hover:text-terminal text-sm transition-colors">
            Privacy Policy
          </a>
          <a href="#" className="block text-foreground-muted hover:text-terminal text-sm transition-colors">
            Acceptable Use Policy
          </a>
          <a href="#" className="block text-foreground-muted hover:text-terminal text-sm transition-colors">
            Security Policy
          </a>
        </div>
      </div>
    </div>
  );
};

// Toggle Switch component
const ToggleSwitch = ({ defaultChecked = false }: { defaultChecked?: boolean }) => {
  const [checked, setChecked] = useState(defaultChecked);
  
  return (
    <button
      onClick={() => setChecked(!checked)}
      className={cn(
        "w-11 h-6 rounded-full transition-colors relative",
        checked ? 'bg-terminal' : 'bg-[hsl(var(--background-elevated))]'
      )}
    >
      <motion.div
        className="w-5 h-5 rounded-full bg-white absolute top-0.5"
        animate={{ left: checked ? 'calc(100% - 22px)' : '2px' }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </button>
  );
};
