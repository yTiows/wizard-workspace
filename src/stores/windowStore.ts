import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { WindowState, AppId, AppDefinition } from '@/types/wizard';

export const APP_DEFINITIONS: Record<AppId, AppDefinition> = {
  terminal: {
    id: 'terminal',
    name: 'Terminal',
    icon: '⌘',
    description: 'Command line interface',
    defaultWidth: 720,
    defaultHeight: 480,
    minWidth: 400,
    minHeight: 300,
  },
  files: {
    id: 'files',
    name: 'Files',
    icon: '📁',
    description: 'File manager',
    defaultWidth: 800,
    defaultHeight: 500,
    minWidth: 400,
    minHeight: 300,
  },
  editor: {
    id: 'editor',
    name: 'Editor',
    icon: '✎',
    description: 'Code editor',
    defaultWidth: 900,
    defaultHeight: 600,
    minWidth: 500,
    minHeight: 400,
  },
  browser: {
    id: 'browser',
    name: 'NetView',
    icon: '◎',
    description: 'Controlled browser',
    defaultWidth: 1024,
    defaultHeight: 700,
    minWidth: 600,
    minHeight: 400,
  },
  logs: {
    id: 'logs',
    name: 'LogTrace',
    icon: '▤',
    description: 'Log viewer',
    defaultWidth: 800,
    defaultHeight: 500,
    minWidth: 500,
    minHeight: 300,
  },
  network: {
    id: 'network',
    name: 'NetScope',
    icon: '⬡',
    description: 'Network inspector',
    defaultWidth: 850,
    defaultHeight: 550,
    minWidth: 500,
    minHeight: 350,
  },
  processes: {
    id: 'processes',
    name: 'ProcMon',
    icon: '⚙',
    description: 'Process monitor',
    defaultWidth: 750,
    defaultHeight: 500,
    minWidth: 450,
    minHeight: 300,
  },
  packages: {
    id: 'packages',
    name: 'PackMan',
    icon: '▦',
    description: 'Package manager',
    defaultWidth: 700,
    defaultHeight: 500,
    minWidth: 400,
    minHeight: 300,
  },
  notes: {
    id: 'notes',
    name: 'Evidence',
    icon: '✐',
    description: 'Notes and evidence',
    defaultWidth: 600,
    defaultHeight: 500,
    minWidth: 350,
    minHeight: 300,
  },
  projects: {
    id: 'projects',
    name: 'Projects',
    icon: '▣',
    description: 'Workspace manager',
    defaultWidth: 800,
    defaultHeight: 550,
    minWidth: 450,
    minHeight: 350,
  },
  portfolio: {
    id: 'portfolio',
    name: 'Artifacts',
    icon: '◈',
    description: 'Your artifacts',
    defaultWidth: 800,
    defaultHeight: 550,
    minWidth: 450,
    minHeight: 350,
  },
  skills: {
    id: 'skills',
    name: 'Skill Graph',
    icon: '◇',
    description: 'Capability map',
    defaultWidth: 1000,
    defaultHeight: 700,
    minWidth: 700,
    minHeight: 500,
  },
  mentor: {
    id: 'mentor',
    name: 'Mentor',
    icon: '◉',
    description: 'AI assistant',
    defaultWidth: 450,
    defaultHeight: 600,
    minWidth: 350,
    minHeight: 400,
    singleton: true,
  },
  snapshots: {
    id: 'snapshots',
    name: 'Snapshots',
    icon: '⊡',
    description: 'State manager',
    defaultWidth: 600,
    defaultHeight: 450,
    minWidth: 400,
    minHeight: 300,
  },
  settings: {
    id: 'settings',
    name: 'Settings',
    icon: '⚙',
    description: 'System settings',
    defaultWidth: 700,
    defaultHeight: 550,
    minWidth: 450,
    minHeight: 400,
    singleton: true,
  },
  missions: {
    id: 'missions',
    name: 'Missions',
    icon: '⊕',
    description: 'Mission control',
    defaultWidth: 900,
    defaultHeight: 650,
    minWidth: 600,
    minHeight: 450,
  },
};

interface WindowStore {
  windows: WindowState[];
  maxZIndex: number;
  
  // Window management
  openWindow: (appId: AppId, title?: string) => string;
  closeWindow: (windowId: string) => void;
  focusWindow: (windowId: string) => void;
  minimizeWindow: (windowId: string) => void;
  maximizeWindow: (windowId: string) => void;
  restoreWindow: (windowId: string) => void;
  
  // Window positioning
  moveWindow: (windowId: string, x: number, y: number) => void;
  resizeWindow: (windowId: string, width: number, height: number) => void;
  
  // Utilities
  getWindow: (windowId: string) => WindowState | undefined;
  getWindowsByApp: (appId: AppId) => WindowState[];
  getFocusedWindow: () => WindowState | undefined;
  closeAllWindows: () => void;
}

export const useWindowStore = create<WindowStore>((set, get) => ({
  windows: [],
  maxZIndex: 0,

  openWindow: (appId: AppId, title?: string) => {
    const app = APP_DEFINITIONS[appId];
    if (!app) return '';

    // Check singleton
    if (app.singleton) {
      const existing = get().windows.find(w => w.appId === appId);
      if (existing) {
        get().focusWindow(existing.id);
        return existing.id;
      }
    }

    const windowId = uuidv4();
    const existingCount = get().windows.filter(w => w.appId === appId).length;
    
    // Offset new windows slightly
    const offset = existingCount * 30;
    const x = Math.min(100 + offset, window.innerWidth - app.defaultWidth - 100);
    const y = Math.min(50 + offset, window.innerHeight - app.defaultHeight - 100);

    const newWindow: WindowState = {
      id: windowId,
      appId,
      title: title || app.name,
      x: Math.max(50, x),
      y: Math.max(50, y),
      width: app.defaultWidth,
      height: app.defaultHeight,
      isMinimized: false,
      isMaximized: false,
      isFocused: true,
      zIndex: get().maxZIndex + 1,
    };

    set(state => ({
      windows: [
        ...state.windows.map(w => ({ ...w, isFocused: false })),
        newWindow,
      ],
      maxZIndex: state.maxZIndex + 1,
    }));

    return windowId;
  },

  closeWindow: (windowId: string) => {
    set(state => ({
      windows: state.windows.filter(w => w.id !== windowId),
    }));
  },

  focusWindow: (windowId: string) => {
    const window = get().windows.find(w => w.id === windowId);
    if (!window) return;

    set(state => ({
      windows: state.windows.map(w => ({
        ...w,
        isFocused: w.id === windowId,
        zIndex: w.id === windowId ? state.maxZIndex + 1 : w.zIndex,
        isMinimized: w.id === windowId ? false : w.isMinimized,
      })),
      maxZIndex: state.maxZIndex + 1,
    }));
  },

  minimizeWindow: (windowId: string) => {
    set(state => ({
      windows: state.windows.map(w =>
        w.id === windowId
          ? { ...w, isMinimized: true, isFocused: false }
          : w
      ),
    }));
  },

  maximizeWindow: (windowId: string) => {
    set(state => ({
      windows: state.windows.map(w =>
        w.id === windowId
          ? { ...w, isMaximized: true }
          : w
      ),
    }));
  },

  restoreWindow: (windowId: string) => {
    set(state => ({
      windows: state.windows.map(w =>
        w.id === windowId
          ? { ...w, isMaximized: false, isMinimized: false }
          : w
      ),
    }));
  },

  moveWindow: (windowId: string, x: number, y: number) => {
    set(state => ({
      windows: state.windows.map(w =>
        w.id === windowId ? { ...w, x, y } : w
      ),
    }));
  },

  resizeWindow: (windowId: string, width: number, height: number) => {
    const window = get().windows.find(w => w.id === windowId);
    if (!window) return;

    const app = APP_DEFINITIONS[window.appId as AppId];
    const newWidth = Math.max(width, app?.minWidth || 300);
    const newHeight = Math.max(height, app?.minHeight || 200);

    set(state => ({
      windows: state.windows.map(w =>
        w.id === windowId
          ? { ...w, width: newWidth, height: newHeight }
          : w
      ),
    }));
  },

  getWindow: (windowId: string) => {
    return get().windows.find(w => w.id === windowId);
  },

  getWindowsByApp: (appId: AppId) => {
    return get().windows.filter(w => w.appId === appId);
  },

  getFocusedWindow: () => {
    return get().windows.find(w => w.isFocused);
  },

  closeAllWindows: () => {
    set({ windows: [], maxZIndex: 0 });
  },
}));
