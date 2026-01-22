import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { 
  SystemState, 
  MachineState, 
  Snapshot, 
  UserProfile, 
  UserRank,
  BootPhase,
  BootState,
  Notification,
  NotificationType
} from '@/types/wizard';
import { useFilesystemStore } from './filesystemStore';

interface SystemStore {
  // Boot state
  bootState: BootState;
  isBooted: boolean;
  
  // System state
  systemState: SystemState;
  
  // User
  user: UserProfile | null;
  isAuthenticated: boolean;
  
  // Notifications
  notifications: Notification[];
  
  // Boot actions
  startBoot: () => void;
  advanceBootPhase: () => void;
  completeBoot: () => void;
  
  // Auth actions
  login: (username: string) => void;
  logout: () => void;
  
  // System actions
  setMachineState: (state: MachineState) => void;
  updateIntegrity: (delta: number) => void;
  brickSystem: () => void;
  recoverSystem: () => void;
  
  // Snapshot actions
  createSnapshot: (name: string, description?: string) => Snapshot;
  restoreSnapshot: (snapshotId: string) => boolean;
  deleteSnapshot: (snapshotId: string) => void;
  
  // User actions
  addXP: (amount: number) => void;
  updateStats: (updates: Partial<UserProfile['stats']>) => void;
  updatePreferences: (updates: Partial<UserProfile['preferences']>) => void;
  
  // Notification actions
  addNotification: (type: NotificationType, title: string, message: string) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  
  // Reset
  hardReset: () => void;
}

const BOOT_MESSAGES: Record<BootPhase, string[]> = {
  power_on: [
    'Power on self test...',
    'Hardware initialization...',
  ],
  bios: [
    'BIOS check complete',
    'Loading bootloader...',
  ],
  kernel: [
    'Loading kernel modules...',
    'Mounting filesystems...',
    'Initializing network stack...',
  ],
  services: [
    'Starting system services...',
    'Initializing security framework...',
    'Loading user environment...',
  ],
  login: [],
  desktop: [],
};

const calculateRank = (xp: number): UserRank => {
  if (xp >= 50000) return 'architect';
  if (xp >= 25000) return 'master';
  if (xp >= 10000) return 'expert';
  if (xp >= 5000) return 'specialist';
  if (xp >= 2000) return 'operator';
  if (xp >= 500) return 'apprentice';
  return 'initiate';
};

const calculateLevel = (xp: number): number => {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
};

const createInitialUser = (username: string): UserProfile => ({
  id: uuidv4(),
  username,
  rank: 'initiate',
  xp: 0,
  level: 1,
  created_at: new Date(),
  last_active: new Date(),
  preferences: {
    wallpaper: 'grid',
    mentor_mode: 'balanced',
    terminal_font_size: 14,
    show_hints: true,
  },
  stats: {
    missions_completed: 0,
    total_commands: 0,
    files_created: 0,
    artifacts_generated: 0,
    time_spent_seconds: 0,
  },
  badges: [],
  unlocked_wallpapers: ['grid', 'noise', 'matrix'],
});

export const useSystemStore = create<SystemStore>()(
  persist(
    (set, get) => ({
      bootState: {
        phase: 'power_on',
        progress: 0,
        messages: [],
        complete: false,
      },
      isBooted: false,
      
      systemState: {
        machine_state: 'running',
        integrity: 100,
        network_connected: true,
        storage_used: 0,
        storage_total: 1073741824, // 1GB
        snapshots: [],
        boot_time: new Date(),
      },
      
      user: null,
      isAuthenticated: false,
      
      notifications: [],

      startBoot: () => {
        set({
          bootState: {
            phase: 'power_on',
            progress: 0,
            messages: [],
            complete: false,
          },
          isBooted: false,
        });
      },

      advanceBootPhase: () => {
        const phases: BootPhase[] = ['power_on', 'bios', 'kernel', 'services', 'login', 'desktop'];
        const { bootState } = get();
        const currentIndex = phases.indexOf(bootState.phase);
        
        if (currentIndex < phases.length - 1) {
          const nextPhase = phases[currentIndex + 1];
          const newMessages = [...bootState.messages, ...BOOT_MESSAGES[bootState.phase]];
          
          set({
            bootState: {
              phase: nextPhase,
              progress: ((currentIndex + 1) / (phases.length - 1)) * 100,
              messages: newMessages,
              complete: nextPhase === 'desktop',
            },
          });
        }
      },

      completeBoot: () => {
        set({
          bootState: {
            phase: 'desktop',
            progress: 100,
            messages: get().bootState.messages,
            complete: true,
          },
          isBooted: true,
          systemState: {
            ...get().systemState,
            boot_time: new Date(),
          },
        });
      },

      login: (username: string) => {
        const existingUser = get().user;
        const user = existingUser?.username === username 
          ? { ...existingUser, last_active: new Date() }
          : createInitialUser(username);
        
        set({
          user,
          isAuthenticated: true,
        });
      },

      logout: () => {
        set({
          isAuthenticated: false,
          isBooted: false,
          bootState: {
            phase: 'power_on',
            progress: 0,
            messages: [],
            complete: false,
          },
        });
      },

      setMachineState: (state: MachineState) => {
        set(s => ({
          systemState: { ...s.systemState, machine_state: state },
        }));
      },

      updateIntegrity: (delta: number) => {
        set(s => ({
          systemState: {
            ...s.systemState,
            integrity: Math.max(0, Math.min(100, s.systemState.integrity + delta)),
          },
        }));
        
        const { systemState } = get();
        if (systemState.integrity <= 0) {
          get().brickSystem();
        }
      },

      brickSystem: () => {
        set(s => ({
          systemState: {
            ...s.systemState,
            machine_state: 'bricked',
            integrity: 0,
          },
        }));
        
        get().addNotification(
          'error',
          'System Bricked',
          'Critical system failure. Use snapshot recovery or hard reset.'
        );
      },

      recoverSystem: () => {
        set(s => ({
          systemState: {
            ...s.systemState,
            machine_state: 'running',
            integrity: 75,
          },
        }));
      },

      createSnapshot: (name: string, description?: string) => {
        const filesystem = useFilesystemStore.getState();
        
        const snapshot: Snapshot = {
          id: uuidv4(),
          name,
          created_at: new Date(),
          filesystem_state: filesystem.exportFilesystem(),
          description,
        };
        
        set(s => ({
          systemState: {
            ...s.systemState,
            snapshots: [...s.systemState.snapshots, snapshot],
          },
        }));
        
        get().addNotification('success', 'Snapshot Created', `Saved: ${name}`);
        
        return snapshot;
      },

      restoreSnapshot: (snapshotId: string) => {
        const { systemState } = get();
        const snapshot = systemState.snapshots.find(s => s.id === snapshotId);
        
        if (!snapshot) return false;
        
        const filesystem = useFilesystemStore.getState();
        const success = filesystem.importFilesystem(snapshot.filesystem_state);
        
        if (success) {
          set(s => ({
            systemState: {
              ...s.systemState,
              machine_state: 'running',
              integrity: 100,
            },
          }));
          
          get().addNotification('success', 'Snapshot Restored', `Restored: ${snapshot.name}`);
        }
        
        return success;
      },

      deleteSnapshot: (snapshotId: string) => {
        set(s => ({
          systemState: {
            ...s.systemState,
            snapshots: s.systemState.snapshots.filter(snap => snap.id !== snapshotId),
          },
        }));
      },

      addXP: (amount: number) => {
        const { user } = get();
        if (!user) return;
        
        const newXP = user.xp + amount;
        const newRank = calculateRank(newXP);
        const newLevel = calculateLevel(newXP);
        
        const rankChanged = newRank !== user.rank;
        const levelChanged = newLevel !== user.level;
        
        set({
          user: {
            ...user,
            xp: newXP,
            rank: newRank,
            level: newLevel,
          },
        });
        
        if (rankChanged) {
          get().addNotification(
            'success',
            'Rank Up!',
            `You are now: ${newRank.toUpperCase()}`
          );
        } else if (levelChanged) {
          get().addNotification(
            'info',
            'Level Up!',
            `You reached level ${newLevel}`
          );
        }
      },

      updateStats: (updates: Partial<UserProfile['stats']>) => {
        const { user } = get();
        if (!user) return;
        
        set({
          user: {
            ...user,
            stats: { ...user.stats, ...updates },
          },
        });
      },

      updatePreferences: (updates: Partial<UserProfile['preferences']>) => {
        const { user } = get();
        if (!user) return;
        
        set({
          user: {
            ...user,
            preferences: { ...user.preferences, ...updates },
          },
        });
      },

      addNotification: (type: NotificationType, title: string, message: string) => {
        const notification: Notification = {
          id: uuidv4(),
          type,
          title,
          message,
          timestamp: new Date(),
          read: false,
        };
        
        set(s => ({
          notifications: [notification, ...s.notifications].slice(0, 50),
        }));
      },

      markNotificationRead: (id: string) => {
        set(s => ({
          notifications: s.notifications.map(n =>
            n.id === id ? { ...n, read: true } : n
          ),
        }));
      },

      clearNotifications: () => {
        set({ notifications: [] });
      },

      hardReset: () => {
        useFilesystemStore.getState().resetFilesystem();
        
        set({
          bootState: {
            phase: 'power_on',
            progress: 0,
            messages: [],
            complete: false,
          },
          isBooted: false,
          systemState: {
            machine_state: 'running',
            integrity: 100,
            network_connected: true,
            storage_used: 0,
            storage_total: 1073741824,
            snapshots: [],
            boot_time: new Date(),
          },
          isAuthenticated: false,
          notifications: [],
        });
      },
    }),
    {
      name: 'wizard-system',
      partialize: (state) => ({
        user: state.user,
        systemState: {
          ...state.systemState,
          machine_state: 'running', // Always start fresh
        },
      }),
    }
  )
);
